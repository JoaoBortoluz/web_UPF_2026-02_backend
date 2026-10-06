import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

// DTO para cadastro de mesas
export class CreateTableDto {
  @ApiProperty({ example: 1, description: 'Número da mesa' })
  @IsInt({ message: 'O número da mesa deve ser um número inteiro' })
  @IsPositive({ message: 'O número da mesa deve ser positivo' })
  @IsNotEmpty({ message: 'O número da mesa é obrigatório' })
  number: number;

  @ApiProperty({ example: 4, description: 'Quantidade de lugares' })
  @IsInt({ message: 'A capacidade deve ser um número inteiro' })
  @IsPositive({ message: 'A capacidade deve ser maior que zero' })
  @IsNotEmpty({ message: 'A capacidade da mesa é obrigatória' })
  capacity: number;
}