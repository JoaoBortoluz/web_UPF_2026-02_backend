import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// DTO para cadastro de produtos no cardápio
export class CreateProductDto {
  @ApiProperty({ example: 'Hambúrguer Clássico' })
  @IsString({ message: 'O nome do produto deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do produto é obrigatório' })
  name: string = '';

  @ApiPropertyOptional({
    example: 'Pão brioche, blend bovino de 180g, queijo cheddar e bacon crocante',
  })
  @IsString({ message: 'A descrição do produto deve ser um texto' })
  @IsOptional()
  description?: string = '';

  @ApiProperty({ example: 38.5, minimum: 0 })
  @IsNumber({}, { message: 'O preço deve ser um número válido' })
  @Min(0, { message: 'O preço não pode ser negativo' })
  price: number;

  @ApiProperty({ example: 'Lanches' })
  @IsString({ message: 'A categoria deve ser um texto' })
  @IsNotEmpty({ message: 'A categoria do produto é obrigatória' })
  category: string = '';
}