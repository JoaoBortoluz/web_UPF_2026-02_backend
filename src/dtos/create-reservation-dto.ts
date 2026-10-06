import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

// DTO para criação de reservas de mesas
export class CreateReservationDto {
  @ApiProperty({ example: 'Carlos Silva' })
  @IsString({ message: 'O nome do cliente deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do cliente é obrigatório' })
  customerName: string;

  @ApiProperty({ example: '(54) 99988-7766' })
  @IsString({ message: 'O telefone do cliente deve ser um texto' })
  @IsNotEmpty({ message: 'O telefone do cliente é obrigatório' })
  customerPhone: string;

  @ApiProperty({
    example: '2026-10-10T20:00:00.000Z',
    description: 'Data e hora no formato ISO',
  })
  @IsDateString(
    {},
    {
      message:
        'A data e horário devem estar no formato de data ISO válido (ex: 2026-10-10T19:00:00Z)',
    },
  )
  dateTime: string;

  @ApiProperty({ example: 2, description: 'Quantidade de pessoas' })
  @IsInt({
    message: 'A quantidade de convidados/pessoas deve ser um número inteiro',
  })
  @IsPositive({ message: 'A quantidade de convidados deve ser maior que zero' })
  guestCount: number;

  @ApiPropertyOptional({ example: 2, description: 'ID da mesa (opcional)' })
  @IsInt({ message: 'O ID da mesa deve ser um número inteiro' })
  @IsOptional()
  tableId?: number;
}