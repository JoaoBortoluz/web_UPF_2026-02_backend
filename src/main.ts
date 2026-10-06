import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // Inicialização da aplicação NestJS
  const app = await NestFactory.create(AppModule);

  // Prefixo global para todas as rotas da API (ex: /api/auth/login)
  app.setGlobalPrefix('api');

  // Habilita CORS para permitir requisições do frontend/mobile
  app.enableCors();

  // Validação global com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuração da documentação Swagger
  const config = new DocumentBuilder()
    .setTitle('API Restaurante')
    .setDescription('Documentação da API')
    .setVersion('1.0')
    .addBearerAuth() // Permite informar o token JWT na interface
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Inicia o servidor na porta definida no .env ou 3000 por padrão
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Servidor rodando em http://localhost:${port}/api`);
  console.log(`Documentação em http://localhost:${port}/api/docs`);
}

bootstrap();