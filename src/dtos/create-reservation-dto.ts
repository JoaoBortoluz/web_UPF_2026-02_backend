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
  @IsString({ message: 'O nome do cliente deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do cliente é obrigatório' })
  customerName: string;

  @IsString({ message: 'O telefone do cliente deve ser um texto' })
  @IsNotEmpty({ message: 'O telefone do cliente é obrigatório' })
  customerPhone: string;

  @IsDateString(
    {},
    {
      message:
        'A data e horário devem estar no formato de data ISO válido (ex: 2026-10-10T19:00:00Z)',
    },
  )
  dateTime: string;

  @IsInt({
    message: 'A quantidade de convidados/pessoas deve ser um número inteiro',
  })
  @IsPositive({ message: 'A quantidade de convidados deve ser maior que zero' })
  guestCount: number;

  @IsInt({ message: 'O ID da mesa deve ser um número inteiro' })
  @IsOptional()
  tableId?: number;
}
