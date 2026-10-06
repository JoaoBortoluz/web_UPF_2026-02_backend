import { Module } from '@nestjs/common';
import { TablesService } from './tables.service.js';
import { TablesController } from './tables.controller.js';

// Módulo que agrupa o controlador e o serviço de mesas
@Module({
  controllers: [TablesController],
  providers: [TablesService],
})
export class TablesModule {}
