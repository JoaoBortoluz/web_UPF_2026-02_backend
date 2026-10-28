import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import {
  OrdersController,
  PublicMenuController,
} from './orders.controller.js';

// Módulo que agrupa o controlador e o serviço de pedidos
@Module({
  controllers: [OrdersController, PublicMenuController],
  providers: [OrdersService],
})
export class OrdersModule {}
