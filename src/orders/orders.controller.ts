import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from '../dtos/create-order-dto.js';
import { AddOrderItemDto } from '../dtos/add-order-item-dto.js';

// Controlador de rotas para gerenciamento de pedidos e comandas (/api/orders)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Abre um novo pedido para uma mesa
  @Post()
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  // Adiciona um item (produto) ao pedido especificado
  @Post(':id/items')
  addItem(@Param('id', ParseIntPipe) id: number, @Body() dto: AddOrderItemDto) {
    return this.ordersService.addItem(id, dto);
  }

  // Atualiza a quantidade de um item do pedido
  @Patch(':id/items/:itemId')
  updateItemQuantity(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: { quantity: number },
  ) {
    return this.ordersService.updateItemQuantity(
      id,
      itemId,
      Number(body.quantity),
    );
  }

  // Remove um item do pedido
  @Delete(':id/items/:itemId')
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.ordersService.removeItem(id, itemId);
  }

  // Transfere um pedido aberto para outra mesa
  @Patch(':id/transfer')
  transferOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { targetTableId: number },
  ) {
    return this.ordersService.transferOrder(id, Number(body.targetTableId));
  }

  // Lista todos os pedidos
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  // Busca detalhes de um pedido específico
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  // Fecha a conta do pedido e libera a mesa
  @Patch(':id/close')
  closeOrder(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.closeOrder(id);
  }
}

// Controlador público para o Cardápio Digital de Autoatendimento dos Clientes (/api/public)
@Controller('public')
export class PublicMenuController {
  constructor(private readonly ordersService: OrdersService) {}

  // Lista produtos, mesas e comandas ativas para a tela pública de cardápio
  @Get('menu')
  getMenu() {
    return this.ordersService.getPublicMenuData();
  }

  // Consulta a comanda aberta de uma mesa específica
  @Get('tables/:tableId/order')
  getTableOrder(@Param('tableId', ParseIntPipe) tableId: number) {
    return this.ordersService.getPublicTableOrder(tableId);
  }

  // Envia novo pedido do cliente direto para o sistema de gestão
  @Post('orders')
  createCustomerOrder(
    @Body()
    body: {
      tableId: number;
      customerName?: string;
      items: Array<{ productId: number; quantity: number; notes?: string }>;
    },
  ) {
    return this.ordersService.createCustomerOrder(body);
  }
}
