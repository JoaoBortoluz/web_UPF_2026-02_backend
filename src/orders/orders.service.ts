import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateOrderDto } from '../dtos/create-order-dto.js';
import { AddOrderItemDto } from '../dtos/add-order-item-dto.js';

// Serviço de gerenciamento de pedidos (comandas de mesa)
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // Abertura de novo pedido para uma mesa
  async createOrder(dto: CreateOrderDto) {
    const table = await this.prisma.table.findUnique({
      where: { id: dto.tableId },
    });
    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }
    if (table.status === 'OCCUPIED') {
      throw new ConflictException('A mesa já está ocupada');
    }

    // Cria o pedido com status OPEN (aberto)
    const order = await this.prisma.order.create({
      data: {
        tableId: dto.tableId,
        userId: dto.userId,
        status: 'OPEN',
      },
    });

    // Atualiza o status da mesa para OCCUPIED (ocupada)
    await this.prisma.table.update({
      where: { id: dto.tableId },
      data: { status: 'OCCUPIED' },
    });

    return order;
  }

  // Adiciona um item ao pedido aberto e atualiza o valor total
  async addItem(orderId: number, dto: AddOrderItemDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    if (order.status !== 'OPEN') {
      throw new ConflictException(
        'Não é possível adicionar itens a um pedido fechado',
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Salva o item com o preço unitário atual do produto
    const item = await this.prisma.orderItem.create({
      data: {
        orderId,
        productId: dto.productId,
        quantity: dto.quantity,
        notes: dto.notes,
        unitPrice: product.price,
      },
    });

    // Incrementa o valor total do pedido
    const itemTotal = product.price * dto.quantity;
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        totalAmount: { increment: itemTotal },
      },
    });

    return item;
  }

  // Lista todos os pedidos com detalhes da mesa, funcionário e itens
  findAll() {
    return this.prisma.order.findMany({
      include: {
        table: true,
        user: { select: { id: true, name: true, role: true } },
        orderItems: { include: { product: true } },
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  // Busca detalhes de um pedido específico
  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        user: { select: { id: true, name: true, role: true } },
        orderItems: { include: { product: true } },
      },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    return order;
  }

  // Encerra a comanda do pedido e libera a mesa correspondente
  async closeOrder(id: number) {
    const order = await this.findOne(id);
    if (order.status !== 'OPEN') {
      throw new ConflictException('O pedido já está fechado ou cancelado');
    }

    // Marca o pedido como CLOSED
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    // Libera a mesa para novos clientes (AVAILABLE)
    await this.prisma.table.update({
      where: { id: order.tableId },
      data: { status: 'AVAILABLE' },
    });

    return updatedOrder;
  }
}
