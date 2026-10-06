import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcryptjs';

// Configuração do Prisma Client com o driver SQLite
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando o povoamento do banco de dados (seed)...');

  // Senha padrão criptografada com bcrypt
  const passwordHash = await bcrypt.hash('admin123', 10);

  // Cria ou atualiza o usuário Administrador
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      name: 'Administrador Geral',
      email: 'admin@restaurant.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  // Cria ou atualiza o usuário Garçom
  const waiter = await prisma.user.upsert({
    where: { email: 'waiter@restaurant.com' },
    update: {},
    create: {
      name: 'Garçom João',
      email: 'waiter@restaurant.com',
      password: passwordHash,
      role: 'WAITER',
    },
  });

  console.log('Seed executado com sucesso! Usuários criados/verificados:');
  console.log(`- Administrador: ${admin.email} (Senha: admin123)`);
  console.log(`- Garçom: ${waiter.email} (Senha: admin123)`);
}

main()
  .catch((e) => {
    console.error('Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });