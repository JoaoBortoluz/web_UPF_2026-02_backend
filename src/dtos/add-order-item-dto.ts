import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

// DTO para inclusão de itens em um pedido aberto
export class AddOrderItemDto {
  @IsInt({ message: 'O ID do produto deve ser um número inteiro' })
  @IsPositive({ message: 'O ID do produto deve ser maior que zero' })
  @IsNotEmpty({ message: 'O ID do produto é obrigatório' })
  productId: number;

  @IsInt({ message: 'A quantidade deve ser um número inteiro' })
  @IsPositive({ message: 'A quantidade deve ser maior que zero' })
  quantity: number;

  @IsString({ message: 'As observações devem ser um texto' })
  @IsOptional()
  notes?: string;
}
