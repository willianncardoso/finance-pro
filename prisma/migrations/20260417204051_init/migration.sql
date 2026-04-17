-- CreateTable
CREATE TABLE "Transacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
