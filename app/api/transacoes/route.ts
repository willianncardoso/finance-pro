import { db } from "@/app/lib/db";

export async function GET() {
  try {
    const transacoes = await db.transacao.findMany({
      orderBy: { data: "desc" },
    });
    return Response.json(transacoes);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transacao = await db.transacao.create({
      data: {
        data: new Date(body.data),
        descricao: body.descricao,
        valor: Number(body.valor),
        tipo: body.tipo,
        categoria: body.categoria ?? "",
        banco: body.banco ?? "",
        moeda: body.moeda ?? "BRL",
      },
    });
    return Response.json(transacao, { status: 201 });
  } catch {
    return Response.json({ error: "Erro ao criar transação" }, { status: 500 });
  }
}
