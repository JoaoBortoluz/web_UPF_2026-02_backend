import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// DTO para cadastro de produtos no cardápio
export class CreateProductDto {
  @IsString({ message: 'O nome do produto deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do produto é obrigatório' })
  name: string = '';

  @IsString({ message: 'A descrição do produto deve ser um texto' })
  @IsOptional()
  description?: string = '';

  @IsNumber({}, { message: 'O preço deve ser um número válido' })
  @Min(0, { message: 'O preço não pode ser negativo' })
  price: number;

  @IsString({ message: 'A categoria deve ser um texto' })
  @IsNotEmpty({ message: 'A categoria do produto é obrigatória' })
  category: string = '';
}
