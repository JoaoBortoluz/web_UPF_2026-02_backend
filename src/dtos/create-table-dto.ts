import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

// DTO para cadastro de mesas
export class CreateTableDto {
  @IsInt({ message: 'O número da mesa deve ser um número inteiro' })
  @IsPositive({ message: 'O número da mesa deve ser positivo' })
  @IsNotEmpty({ message: 'O número da mesa é obrigatório' })
  number: number;

  @IsInt({ message: 'A capacidade deve ser um número inteiro' })
  @IsPositive({ message: 'A capacidade deve ser maior que zero' })
  @IsNotEmpty({ message: 'A capacidade da mesa é obrigatória' })
  capacity: number;
}
