import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { TablesService } from './tables.service.js';
import { CreateTableDto } from '../dtos/create-table-dto.js';

// Controlador de rotas para gerenciamento de mesas (/api/tables)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  // Cadastra uma nova mesa
  @Post()
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  // Lista todas as mesas
  @Get()
  findAll() {
    return this.tablesService.findAll();
  }

  // Busca detalhes de uma mesa específica pelo ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.findOne(id);
  }
}
