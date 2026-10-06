import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service.js';
import { LoginDto } from '../dtos/login-dto.js';
import { RegisterStaffDto } from '../dtos/register-staff-dto.js';
import * as bcrypt from 'bcryptjs';

// Serviço de autenticação e controle de acesso dos funcionários
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Cadastro de novo funcionário (administrador, garçom, recepcionista)
  async registerStaff(dto: RegisterStaffDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new ConflictException('E-mail já cadastrado no sistema');
    }

    // Gera o hash seguro da senha com bcrypt
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
      },
    });

    // Retorna os dados do usuário omitindo a senha
    const { password: _password, ...result } = user;
    return result;
  }

  // Login de funcionário gerando o token de acesso JWT
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Informações salvas dentro do token JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
