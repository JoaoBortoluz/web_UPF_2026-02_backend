import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Guarda de rotas JWT: valida se o cabeçalho Authorization contém um token válido
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = String(request.originalUrl || request.url);

    // A rota de login de funcionários é pública
    if (url.includes('/auth/login')) {
      return true;
    }

    // Verifica se o cabeçalho Authorization foi enviado no padrão 'Bearer <token>'
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Token de autorização ausente ou inválido',
      );
    }

    const token = authHeader.split(' ')[1];
    try {
      // Valida e decodifica o token JWT
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
