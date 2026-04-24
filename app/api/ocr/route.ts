import { createWorker } from 'tesseract.js';

/* ── Helpers ──────────────────────────────────────────────────────── */

const MONTHS_PT: Record<string, string> = {
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
};

function resolveDate(line: string, todayStr: string): string | null {
  const s = line.toLowerCase().trim();
  const today = new Date(todayStr + 'T12:00:00');
  if (/\bhoje\b/.test(s)) return todayStr;
  if (/\bontem\b/.test(s)) {
    const d = new Date(today); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  // "23 abr", "23 de abr", "23 de abril."
  const mAbr = s.match(/\b(\d{1,2})\s+(?:de\s+)?([a-záàâãéêíóôõú]{3,})/);
  if (mAbr) {
    const mon = MONTHS_PT[mAbr[2].slice(0, 3)];
    if (mon) return `${today.getFullYear()}-${mon}-${mAbr[1].padStart(2, '0')}`;
  }
  // DD/MM/YYYY or DD/MM/YY
  const mDmy = s.match(/\b(\d{2})\/(\d{2})\/(\d{2,4})\b/);
  if (mDmy) {
    const yr = mDmy[3].length === 2 ? `20${mDmy[3]}` : mDmy[3];
    return `${yr}-${mDmy[2]}-${mDmy[1]}`;
  }
  return null;
}

function detectAccount(text: string): string {
  const lo = text.toLowerCase();
  if (/nubank/.test(lo)) return 'Nubank';
  if (/c6/.test(lo)) {
    const m = text.match(/(?:final|•{2,}|\*{2,})\s*(\d{4})/i);
    return m ? `C6 Bank •${m[1]}` : 'C6 Bank';
  }
  return 'Importado';
}

const SKIP_RE = /fatura de|fatura aberta|limite|saldo|disponível|total da fatura|ver fatura|cartão virtual|crédito disponível|transações|extrato/i;
const AMT_RE  = /[-−]?\s*R[S$]\$?\s*([\d.]+,\d{2})/i;
const INST_RE = /\b(\d{1,2})\/(\d{2,3})\b/;

function parseOcrText(text: string, today: string, account: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: { date: string; merchant: string; amount: number; account: string; installment: string | null }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const amtMatch = lines[i].match(AMT_RE);
    if (!amtMatch) continue;

    const ctx = lines.slice(Math.max(0, i - 2), i + 3).join(' ');
    if (SKIP_RE.test(ctx)) continue;

    const amtRaw = parseFloat(amtMatch[1].replace(/\./g, '').replace(',', '.'));
    if (isNaN(amtRaw) || amtRaw === 0) continue;

    const isRefund = /estorno|devolução|reembolso/i.test(ctx);
    const amount = isRefund ? amtRaw : -amtRaw;

    // Merchant: scan backwards, skip date / amount / header lines
    let merchant = '';
    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
      const l = lines[j];
      if (AMT_RE.test(l)) break;
      if (resolveDate(l, today)) continue;
      if (SKIP_RE.test(l)) continue;
      if (l.length >= 3 && !/^\d+$/.test(l)) { merchant = l; break; }
    }
    if (!merchant) continue;

    // Date: forward first, then backward
    let date = today;
    for (const j of [i + 1, i + 2, i - 1, i - 2, i + 3]) {
      if (j < 0 || j >= lines.length) continue;
      const r = resolveDate(lines[j], today);
      if (r) { date = r; break; }
    }

    const cleanMerch = merchant.replace(/[|]{2,}/g, '').replace(/\s+/g, ' ').trim();
    if (cleanMerch.length < 2) continue;

    const key = `${cleanMerch}|${amount}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Extract installment from merchant name
    const instMatch = cleanMerch.match(INST_RE);
    let installment: string | null = null;
    let finalMerch = cleanMerch;
    if (instMatch && instMatch.index !== undefined) {
      installment = `${parseInt(instMatch[1], 10)}/${parseInt(instMatch[2], 10)}`;
      finalMerch = cleanMerch.slice(0, instMatch.index).replace(/[\s\-–]+$/, '').trim() || cleanMerch;
    }

    results.push({ date, merchant: finalMerch, amount, account, installment });
  }

  return results;
}

/* ── POST handler ─────────────────────────────────────────────────── */

export async function POST(request: Request) {
  let body: { image: string; mediaType: string; today: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { image, mediaType, today } = body;
  if (!image || !mediaType) {
    return Response.json({ error: 'Missing image or mediaType' }, { status: 400 });
  }

  try {
    const imageBuffer = Buffer.from(image, 'base64');
    const worker = await createWorker(['por', 'eng']);
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();

    const todayStr = today || new Date().toISOString().slice(0, 10);
    const account = detectAccount(text);
    const txns = parseOcrText(text, todayStr, account);

    return Response.json({ txns, rawText: text.slice(0, 600) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `OCR failed: ${msg}` }, { status: 500 });
  }
}
