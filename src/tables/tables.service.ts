import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateTableDto } from '../dtos/create-table-dto.js';

// Serviço de gerenciamento de mesas do restaurante
@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  // Cria uma nova mesa garantindo que o número não seja duplicado
  async create(dto: CreateTableDto) {
    const existing = await this.prisma.table.findUnique({
      where: { number: dto.number },
    });
    if (existing) {
      throw new ConflictException(
        `A mesa número ${dto.number} já está cadastrada`,
      );
    }

    return this.prisma.table.create({ data: dto });
  }

  // Lista todas as mesas ordenadas pelo número
  findAll() {
    return this.prisma.table.findMany({ orderBy: { number: 'asc' } });
  }

  // Busca uma mesa pelo ID ou lança erro 404 se não for encontrada
  async findOne(id: number) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }
    return table;
  }
}
