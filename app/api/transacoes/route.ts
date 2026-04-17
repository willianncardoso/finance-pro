import { db } from "@/app/lib/db";

export async function GET() {
  try {
    const transacoes = await db.transacao.findMany({
      orderBy: { data: "desc" },
    });
    return Response.json(transacoes);
  } catch {
    return Response.json({ error: "Erro ao buscar transações" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.data || !body.descricao || body.valor === undefined || !body.tipo) {
      return Response.json({ error: "Campos obrigatórios: data, descricao, valor, tipo" }, { status: 400 });
    }

    const date = new Date(body.data);
    if (isNaN(date.getTime())) {
      return Response.json({ error: "Data inválida" }, { status: 400 });
    }

    const valor = Number(body.valor);
    if (isNaN(valor)) {
      return Response.json({ error: "Valor inválido" }, { status: 400 });
    }

    const TIPOS_VALIDOS = ["receita", "despesa", "transferencia"] as const;
    if (!TIPOS_VALIDOS.includes(body.tipo)) {
      return Response.json({ error: "Tipo deve ser: receita, despesa ou transferencia" }, { status: 400 });
    }

    const transacao = await db.transacao.create({
      data: {
        data: date,
        descricao: String(body.descricao).slice(0, 500),
        valor,
        tipo: body.tipo,
        categoria: body.categoria ? String(body.categoria).slice(0, 100) : "",
        banco: body.banco ? String(body.banco).slice(0, 100) : "",
        moeda: body.moeda ? String(body.moeda).slice(0, 3) : "BRL",
      },
    });
    return Response.json(transacao, { status: 201 });
  } catch {
    return Response.json({ error: "Erro ao criar transação" }, { status: 500 });
  }
}
