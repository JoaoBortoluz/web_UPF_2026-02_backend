import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from '../dtos/create-product-dto.js';

// Controlador de rotas para gerenciamento do cardápio de produtos (/api/products)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Cadastra um novo produto
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // Lista todos os produtos
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Busca um produto específico pelo ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // Remove um produto pelo ID
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
