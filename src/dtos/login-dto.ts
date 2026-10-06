import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// DTO para autenticação/login de funcionários
export class LoginDto {
  @ApiProperty({ example: 'admin@restaurant.com' })
  @IsEmail({}, { message: 'O e-mail informado deve ser válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string = '';

  @ApiProperty({ example: 'admin123', minLength: 6 })
  @IsString({ message: 'A senha deve ser um texto' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve conter pelo menos 6 caracteres' })
  password: string = '';
}