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

  // Verifica se já existem mesas cadastradas; caso não, popula os dados iniciais do salão e cardápio
  const existingTables = await prisma.table.count();
  if (existingTables === 0) {
    console.log('Populando mesas, cardápio, reservas e pedidos iniciais...');

    const table1 = await prisma.table.create({
      data: { number: 1, capacity: 2, status: 'AVAILABLE' },
    });
    const table2 = await prisma.table.create({
      data: { number: 2, capacity: 4, status: 'OCCUPIED' },
    });
    const table3 = await prisma.table.create({
      data: { number: 3, capacity: 4, status: 'RESERVED' },
    });
    const table4 = await prisma.table.create({
      data: { number: 4, capacity: 4, status: 'OCCUPIED' },
    });
    await prisma.table.create({
      data: { number: 5, capacity: 6, status: 'AVAILABLE' },
    });
    const table6 = await prisma.table.create({
      data: { number: 6, capacity: 2, status: 'OCCUPIED' },
    });

    // Produtos do cardápio conforme layout de referência
    const prodAgua = await prisma.product.create({
      data: {
        name: 'Água com gás',
        description: 'Garrafa 350ml naturalmente gaseificada com rodela de limão siciliano',
        price: 8.0,
        category: 'Bebida',
      },
    });
    const prodLimonada = await prisma.product.create({
      data: {
        name: 'Limonada natural',
        description: 'Limões taiti e siciliano espremidos na hora com hortelã fresca',
        price: 16.0,
        category: 'Bebida',
      },
    });
    const prodBrownie = await prisma.product.create({
      data: {
        name: 'Brownie de chocolate',
        description: 'Brownie meio amargo 70% cacau servido quente com calda artesanal',
        price: 26.0,
        category: 'Sobremesa',
      },
    });
    const prodBife = await prisma.product.create({
      data: {
        name: 'Bife grelhado',
        description: 'Corte nobre de ancho grelhado na brasa com manteiga de ervas e batatas rústicas',
        price: 89.0,
        category: 'Prato principal',
      },
    });
    const prodRisoto = await prisma.product.create({
      data: {
        name: 'Risoto de cogumelos',
        description: 'Arroz arbóreo cremoso com mix de cogumelos paris, shimeji e parmesão maturado',
        price: 64.0,
        category: 'Prato principal',
      },
    });
    const prodBruschetta = await prisma.product.create({
      data: {
        name: 'Bruschetta de tomate',
        description: 'Pão de fermentação natural tostado com tomates confit, alho assado e manjericão',
        price: 28.0,
        category: 'Entrada',
      },
    });

    // Reservas iniciais
    await prisma.reservation.createMany({
      data: [
        {
          customerName: 'Ana Martins',
          customerPhone: '(54) 99912-3456',
          dateTime: new Date('2026-10-20T19:30:00.000Z'),
          guestCount: 4,
          status: 'CONFIRMED',
          tableId: table3.id,
        },
        {
          customerName: 'Bruno Costa',
          customerPhone: '(54) 99988-7766',
          dateTime: new Date('2026-10-20T20:00:00.000Z'),
          guestCount: 2,
          status: 'CONFIRMED',
          tableId: table1.id,
        },
      ],
    });

    // Pedido ativo na Mesa 02
    const orderMesa2 = await prisma.order.create({
      data: {
        tableId: table2.id,
        userId: waiter.id,
        status: 'OPEN',
        totalAmount: 92.0,
      },
    });
    await prisma.orderItem.createMany({
      data: [
        {
          orderId: orderMesa2.id,
          productId: prodRisoto.id,
          quantity: 1,
          unitPrice: 64.0,
        },
        {
          orderId: orderMesa2.id,
          productId: prodBruschetta.id,
          quantity: 1,
          unitPrice: 28.0,
        },
      ],
    });

    // Pedido ativo na Mesa 04 (idêntico ao print de referência: R$ 284,00 subtotal)
    const orderMesa4 = await prisma.order.create({
      data: {
        tableId: table4.id,
        userId: admin.id,
        status: 'OPEN',
        totalAmount: 284.0,
      },
    });
    await prisma.orderItem.createMany({
      data: [
        {
          orderId: orderMesa4.id,
          productId: prodBife.id,
          quantity: 2,
          unitPrice: 89.0,
        },
        {
          orderId: orderMesa4.id,
          productId: prodRisoto.id,
          quantity: 1,
          unitPrice: 64.0,
        },
        {
          orderId: orderMesa4.id,
          productId: prodAgua.id,
          quantity: 2,
          unitPrice: 8.0,
        },
        {
          orderId: orderMesa4.id,
          productId: prodBrownie.id,
          quantity: 1,
          unitPrice: 26.0,
        },
      ],
    });

    // Pedido ativo na Mesa 06
    const orderMesa6 = await prisma.order.create({
      data: {
        tableId: table6.id,
        userId: waiter.id,
        status: 'OPEN',
        totalAmount: 42.0,
      },
    });
    await prisma.orderItem.createMany({
      data: [
        {
          orderId: orderMesa6.id,
          productId: prodLimonada.id,
          quantity: 1,
          unitPrice: 16.0,
        },
        {
          orderId: orderMesa6.id,
          productId: prodBrownie.id,
          quantity: 1,
          unitPrice: 26.0,
        },
      ],
    });

    console.log('Dados iniciais de mesas, produtos, reservas e comandas criados!');
  }
}

main()
  .catch((e) => {
    console.error('Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });