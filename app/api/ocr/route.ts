import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

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

  const client = new Anthropic({ apiKey });

  const prompt = `You are a financial data extractor. This screenshot is from a Brazilian bank app or Apple Wallet showing credit/debit card transactions.

Today's date is ${today || new Date().toISOString().slice(0, 10)}.

Extract ALL visible transactions and return them as a JSON array. Each item must have:
- "date": string in YYYY-MM-DD format. For relative dates like "Yesterday", "Tuesday", "Sunday" etc., calculate the actual date relative to today.
- "merchant": string — the store/payee name, cleaned up (remove city names, "São Paulo, SP", "SAO PAU" suffixes, "Em processamento" status text, card identifiers like "Cartão final XXXX")
- "amount": number — NEGATIVE for purchases/expenses (money leaving), POSITIVE for refunds/income (money coming in). Use the R$ values shown.
- "account": string — card account label. If a card number is visible (e.g. "final 9514", "•• 9514"), use "C6 Bank •9514". If Apple Wallet, extract card name and last 4 digits.
- "installment": string or null — if installment info shown (e.g. "Parcela 3 de 12"), include it, else null.

Rules:
- "Estorno" transactions are refunds: make amount POSITIVE.
- "Em processamento" is just a status — still include the transaction.
- Skip header rows, section titles, totals, and non-transaction UI elements.
- If you cannot determine an amount, skip that row.
- Return ONLY valid JSON — no markdown, no explanation, no code fences.

Example output:
[{"date":"2026-04-24","merchant":"Mercado Livre","amount":-838.40,"account":"C6 Bank •9514","installment":null}]`;

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: image,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const text = (msg.content[0] as { type: string; text: string }).text.trim();
    // Strip markdown fences if model added them anyway
    const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const txns = JSON.parse(json);
    if (!Array.isArray(txns)) throw new Error('Response is not an array');
    return Response.json({ txns });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `OCR failed: ${msg}` }, { status: 500 });
  }
}
