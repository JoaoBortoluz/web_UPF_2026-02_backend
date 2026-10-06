import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

// DTO para abertura de comanda/pedido de uma mesa
export class CreateOrderDto {
  @IsInt({ message: 'O ID da mesa deve ser um número inteiro' })
  @IsPositive({ message: 'O ID da mesa deve ser maior que zero' })
  @IsNotEmpty({ message: 'O ID da mesa é obrigatório' })
  tableId: number;

  @IsInt({ message: 'O ID do funcionário/usuário deve ser um número inteiro' })
  @IsPositive({ message: 'O ID do funcionário deve ser maior que zero' })
  @IsNotEmpty({ message: 'O ID do funcionário é obrigatório' })
  userId: number;
}
