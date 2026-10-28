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

  // Atualiza a quantidade de um item do pedido e recalcula o total
  async updateItemQuantity(orderId: number, itemId: number, quantity: number) {
    const order = await this.findOne(orderId);
    if (order.status !== 'OPEN') {
      throw new ConflictException(
        'Não é possível alterar itens de um pedido fechado',
      );
    }

    const item = order.orderItems.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Item não encontrado neste pedido');
    }

    if (quantity <= 0) {
      return this.removeItem(orderId, itemId);
    }

    await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.recalculateOrderTotal(orderId);
  }

  // Remove um item do pedido aberto e recalcula o total
  async removeItem(orderId: number, itemId: number) {
    const order = await this.findOne(orderId);
    if (order.status !== 'OPEN') {
      throw new ConflictException(
        'Não é possível remover itens de um pedido fechado',
      );
    }

    const item = order.orderItems.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Item não encontrado neste pedido');
    }

    await this.prisma.orderItem.delete({
      where: { id: itemId },
    });

    return this.recalculateOrderTotal(orderId);
  }

  // Transfere um pedido aberto para outra mesa disponível
  async transferOrder(orderId: number, targetTableId: number) {
    const order = await this.findOne(orderId);
    if (order.status !== 'OPEN') {
      throw new ConflictException(
        'Apenas pedidos abertos podem ser transferidos',
      );
    }

    const targetTable = await this.prisma.table.findUnique({
      where: { id: targetTableId },
    });
    if (!targetTable) {
      throw new NotFoundException('Mesa de destino não encontrada');
    }
    if (targetTable.status === 'OCCUPIED') {
      throw new ConflictException('A mesa de destino já está ocupada');
    }

    await this.prisma.table.update({
      where: { id: order.tableId },
      data: { status: 'AVAILABLE' },
    });

    await this.prisma.table.update({
      where: { id: targetTableId },
      data: { status: 'OCCUPIED' },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { tableId: targetTableId },
    });

    return this.findOne(orderId);
  }

  // Recalcula o valor total do pedido com base nos itens atuais
  private async recalculateOrderTotal(orderId: number) {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
    });
    const totalAmount = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    await this.prisma.order.update({
      where: { id: orderId },
      data: { totalAmount },
    });
    return this.findOne(orderId);
  }

  // Retorna cardápio completo, mesas e pedidos ativos para a tela pública de autoatendimento do cliente
  async getPublicMenuData() {
    const [products, tables, openOrders] = await Promise.all([
      this.prisma.product.findMany({ orderBy: { category: 'asc' } }),
      this.prisma.table.findMany({ orderBy: { number: 'asc' } }),
      this.prisma.order.findMany({
        where: { status: 'OPEN' },
        include: {
          table: true,
          orderItems: { include: { product: true } },
        },
        orderBy: { openedAt: 'desc' },
      }),
    ]);

    return { products, tables, openOrders };
  }

  // Busca o pedido aberto de uma mesa específica para o cliente acompanhar a conta
  async getPublicTableOrder(tableId: number) {
    const openOrder = await this.prisma.order.findFirst({
      where: { tableId, status: 'OPEN' },
      include: {
        table: true,
        user: { select: { id: true, name: true, role: true } },
        orderItems: { include: { product: true } },
      },
      orderBy: { openedAt: 'desc' },
    });

    return openOrder;
  }

  // Recebe pedido feito pelo cliente no Cardápio Digital e integra diretamente na comanda da mesa
  async createCustomerOrder(payload: {
    tableId: number;
    customerName?: string;
    items: Array<{ productId: number; quantity: number; notes?: string }>;
  }) {
    const table = await this.prisma.table.findUnique({
      where: { id: payload.tableId },
    });
    if (!table) {
      throw new NotFoundException('Mesa selecionada não encontrada');
    }

    // Verifica se já existe um pedido aberto para a mesa
    let order = await this.prisma.order.findFirst({
      where: { tableId: payload.tableId, status: 'OPEN' },
    });

    // Caso a mesa ainda não tenha comanda aberta, abre uma automaticamente vinculada a um atendente
    if (!order) {
      const defaultStaff =
        (await this.prisma.user.findFirst({
          where: { role: 'WAITER' },
        })) ?? (await this.prisma.user.findFirst());

      if (!defaultStaff) {
        throw new NotFoundException(
          'Nenhum funcionário cadastrado para vincular a comanda',
        );
      }

      order = await this.prisma.order.create({
        data: {
          tableId: payload.tableId,
          userId: defaultStaff.id,
          status: 'OPEN',
        },
      });

      await this.prisma.table.update({
        where: { id: payload.tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    // Adiciona todos os itens enviados pelo cliente ao pedido da mesa
    for (const item of payload.items) {
      if (item.quantity > 0) {
        const prefix = payload.customerName
          ? `[Cliente: ${payload.customerName}]`
          : '[Autoatendimento]';
        const finalNotes = item.notes ? `${prefix} ${item.notes}` : prefix;

        await this.addItem(order.id, {
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          notes: finalNotes,
        });
      }
    }

    return this.findOne(order.id);
  }
}
