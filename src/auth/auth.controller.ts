import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from '../dtos/login-dto.js';
import { RegisterStaffDto } from '../dtos/register-staff-dto.js';

// Controlador de rotas de autenticação (/api/auth)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Rota para cadastrar novos funcionários (requer autenticação via Bearer token)
  @Post('register')
  register(@Body() dto: RegisterStaffDto) {
    return this.authService.registerStaff(dto);
  }

  // Rota para listar todos os funcionários cadastrados (requer autenticação)
  @Get('staff')
  findAllStaff() {
    return this.authService.findAllStaff();
  }

  // Rota pública para login de funcionários e obtenção de token JWT
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
