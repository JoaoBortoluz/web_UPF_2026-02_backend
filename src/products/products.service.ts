import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateProductDto } from '../dtos/create-product-dto.js';

// Serviço de gerenciamento do cardápio de produtos
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // Cria um novo produto no cardápio
  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  // Lista todos os produtos ordenados por categoria
  findAll() {
    return this.prisma.product.findMany({ orderBy: { category: 'asc' } });
  }

  // Busca um produto pelo ID ou lança erro 404
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
  }

  // Remove um produto do cardápio garantindo que ele existe antes
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
