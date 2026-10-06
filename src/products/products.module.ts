import { Module } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';

// Módulo que agrupa o controlador e o serviço de produtos
@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
