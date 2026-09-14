type PrismaConstructor = new () => unknown;

const globalForPrisma = globalThis as unknown as { prisma?: unknown };

export async function getPrisma() {
  if (!globalForPrisma.prisma) {
    const clientModule = (await import("@prisma/client")) as unknown as {
      PrismaClient?: PrismaConstructor;
    };

    if (!clientModule.PrismaClient) {
      return null;
    }

    globalForPrisma.prisma = new clientModule.PrismaClient();
  }

  return globalForPrisma.prisma;
}
