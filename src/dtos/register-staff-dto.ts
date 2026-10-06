import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export enum RoleEnum {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  WAITER = 'WAITER',
  RECEPTIONIST = 'RECEPTIONIST',
}

export class RegisterStaffDto {
  @ApiProperty({ example: 'Maria Recepcionista' })
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name: string = '';

  @ApiProperty({ example: 'recepcao@restaurante.com' })
  @IsEmail({}, { message: 'O e-mail informado deve ser válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string = '';

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString({ message: 'A senha deve ser um texto' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string = '';

  @ApiProperty({ enum: RoleEnum, example: RoleEnum.RECEPTIONIST })
  @IsEnum(RoleEnum, {
    message: 'O cargo (role) deve ser ADMIN, MANAGER, WAITER ou RECEPTIONIST',
  })
  @IsNotEmpty({ message: 'O cargo é obrigatório' })
  role: RoleEnum;
}