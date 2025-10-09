import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde la raíz del monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar validación global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no están en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
      transform: true, // Transforma automáticamente los tipos (ej. string a number)
      disableErrorMessages: false, // Mantener mensajes de error en producción
    }),
  );

  // Configuración de Swagger (OpenAPI)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gestión de Activos API')
    .setDescription('API para gestión de máquinas y activos')
    .setVersion('1.0.0')
    .addTag('machines', 'Operaciones con máquinas')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    customSiteTitle: 'Gestión de Activos API',
  });

  // Configurar CORS para desarrollo y producción
  app.enableCors({
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // Next.js dev server
      'https://costo-horario-frontend.onrender.com', // Frontend en Render
      /\.vercel\.app$/, // Vercel deployments
      /\.netlify\.app$/, // Netlify deployments
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${port}/api/docs`,
  );
}
bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
