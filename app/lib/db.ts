import path from "node:path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbUrl = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./prisma/dev.db";
const dbPath = path.resolve(process.cwd(), dbUrl);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: dbPath }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
