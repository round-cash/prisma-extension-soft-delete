import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createAdapter() {
  return new PrismaPg({ connectionString: process.env.DATABASE_URL! });
}

export function createTestClient() {
  return new PrismaClient({ adapter: createAdapter() });
}

export default new PrismaClient({ adapter: createAdapter() });
