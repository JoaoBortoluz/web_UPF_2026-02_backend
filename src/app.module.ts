// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TablesModule } from './tables/tables.module.js';
import { ProductsModule } from './products/products.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { OrdersModule } from './orders/orders.module.js';

// Módulo principal que reúne todos os submódulos da aplicação
@Module({
  imports: [
    // Torna as variáveis de ambiente do .env disponíveis globalmente
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TablesModule,
    ProductsModule,
    ReservationsModule,
    OrdersModule,
  ],
})
export class AppModule {}
