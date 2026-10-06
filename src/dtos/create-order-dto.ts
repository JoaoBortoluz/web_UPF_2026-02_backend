import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

// DTO para abertura de comanda/pedido de uma mesa
export class CreateOrderDto {
  @ApiProperty({ example: 1, description: 'ID da mesa' })
  @IsInt({ message: 'O ID da mesa deve ser um número inteiro' })
  @IsPositive({ message: 'O ID da mesa deve ser maior que zero' })
  @IsNotEmpty({ message: 'O ID da mesa é obrigatório' })
  tableId: number;

  @ApiProperty({ example: 1, description: 'ID do funcionário (garçom)' })
  @IsInt({ message: 'O ID do funcionário/usuário deve ser um número inteiro' })
  @IsPositive({ message: 'O ID do funcionário deve ser maior que zero' })
  @IsNotEmpty({ message: 'O ID do funcionário é obrigatório' })
  userId: number;
}