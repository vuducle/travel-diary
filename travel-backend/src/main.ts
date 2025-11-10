// Load environment variables from .env into process.env
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Response } from 'express';

async function bootstrap() {
  // Build DATABASE_URL from component env vars (DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME)
  const dbUser = process.env.DB_USER ?? 'postgres';
  const dbPassword = process.env.DB_PASSWORD ?? 'password';
  const dbHost = process.env.DB_HOST ?? 'localhost';
  const dbPort = process.env.DB_PORT ?? '5432';
  const dbName = process.env.DB_NAME ?? 'travel_db';

  // Set DATABASE_URL for Prisma to consume
  process.env.DATABASE_URL = `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}?schema=public`;

  const port = Number(process.env.PORT ?? 3000);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3598'],
      credentials: true,
    },
  });

  // Serve static files (uploaded avatars) with CORS headers
  // Use process.cwd() to get the project root directory where uploads folder is located
  const uploadsPath = join(process.cwd(), 'uploads');
  console.log(`[Static Files] Serving uploads from: ${uploadsPath}`);

  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (res: Response) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  // Enable global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Parse cookies (for HttpOnly refresh token cookie)
  app.use(cookieParser());

  // Setup Swagger (OpenAPI) at /api
  const config = new DocumentBuilder()
    .setTitle('Travel Diary API')
    .setDescription('API documentation for the Travel Diary backend')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwt',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Travel Diary API Docs',
    swaggerOptions: {
      // Expand tag sections (not every operation) and show models at the bottom
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      displayRequestDuration: true,
      persistAuthorization: true,
    },
  });

  // Helmet security headers
  // GraphQL Playground (and some other dev tools) load assets from CDNs and use inline scripts.
  // A strict Content Security Policy will block those in development. We disable CSP in dev only.
  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProd ? undefined : false,
    }),
  );

  // Loosen CSP specifically for GraphQL Playground in dev, or when explicitly enabled via env
  // This helps when NODE_ENV=production is set locally but you still want to use Playground.
  const relaxPlayground = !isProd || process.env.RELAX_GRAPHQL_CSP === 'true';
  if (relaxPlayground) {
    app.use(
      '/graphql',
      helmet({
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'blob:'],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'",
              "'unsafe-eval'",
              'https:',
              'http:',
              'blob:',
            ],
            styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
            imgSrc: ["'self'", 'data:', 'https:', 'http:', 'blob:'],
            connectSrc: ["'self'", 'https:', 'http:', 'ws:', 'wss:'],
            workerSrc: ["'self'", 'blob:'],
            frameSrc: ["'self'", 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
      }),
    );
  }
  // CORS already configured during app bootstrap
  await app.listen(port);

  // Use Nest's logger so logs integrate with Nest's logging system
  const url = await app.getUrl();
  const logger = new Logger('Bootstrap');
  logger.log(`Listening on ${url}`);
  logger.log(`Database connected successfully: ${dbHost}:${dbPort}/${dbName}`);
}

void bootstrap();
