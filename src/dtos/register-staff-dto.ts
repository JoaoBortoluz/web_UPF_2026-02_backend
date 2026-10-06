import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

// Cargos disponíveis para os funcionários do sistema
export enum RoleEnum {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  WAITER = 'WAITER',
  RECEPTIONIST = 'RECEPTIONIST',
}

// DTO para cadastro de novos funcionários
export class RegisterStaffDto {
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name: string = '';

  @IsEmail({}, { message: 'O e-mail informado deve ser válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string = '';

  @IsString({ message: 'A senha deve ser um texto' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string = '';

  @IsEnum(RoleEnum, {
    message: 'O cargo (role) deve ser ADMIN, MANAGER, WAITER ou RECEPTIONIST',
  })
  @IsNotEmpty({ message: 'O cargo é obrigatório' })
  role: RoleEnum;
}
