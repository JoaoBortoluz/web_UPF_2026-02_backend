import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateReservationDto } from '../dtos/create-reservation-dto.js';

// Serviço de gerenciamento de reservas de mesas
@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Cria uma nova reserva, verificando se a mesa informada existe
  async create(dto: CreateReservationDto) {
    if (dto.tableId) {
      const table = await this.prisma.table.findUnique({
        where: { id: dto.tableId },
      });
      if (!table) {
        throw new NotFoundException(
          `Mesa com ID ${dto.tableId} não encontrada`,
        );
      }
    }

    return this.prisma.reservation.create({
      data: {
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        dateTime: new Date(dto.dateTime),
        guestCount: dto.guestCount,
        tableId: dto.tableId ?? null,
      },
    });
  }

  // Lista todas as reservas ordenadas por data/hora
  findAll() {
    return this.prisma.reservation.findMany({
      include: { table: true },
      orderBy: { dateTime: 'asc' },
    });
  }

  // Busca uma reserva pelo ID ou lança erro 404
  async findOne(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });
    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada');
    }
    return reservation;
  }
}
