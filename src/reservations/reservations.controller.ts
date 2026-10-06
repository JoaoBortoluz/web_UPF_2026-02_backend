import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service.js';
import { CreateReservationDto } from '../dtos/create-reservation-dto.js';

// Controlador de rotas para gerenciamento de reservas (/api/reservations)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // Cadastra uma nova reserva de mesa
  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }

  // Lista todas as reservas
  @Get()
  findAll() {
    return this.reservationsService.findAll();
  }

  // Busca uma reserva específica pelo ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }
}
