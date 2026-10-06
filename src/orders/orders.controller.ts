import {
  Body,
  Controller,
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
