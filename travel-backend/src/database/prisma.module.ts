import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Global,
  Module,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  // Ensure PrismaClient is constructed
  constructor() {
    // Ensure DATABASE_URL exists at runtime (tests may not load prisma.config.ts)
    if (!process.env.DATABASE_URL) {
      const dbUser =
        process.env.DB_USER ?? process.env.DATABASE_USER ?? 'postgres';
      const dbPassword =
        process.env.DB_PASSWORD ?? process.env.DATABASE_PASSWORD ?? 'password';
      const dbHost = process.env.DB_HOST ?? 'localhost';
      const dbPort = process.env.DB_PORT ?? '5432';
      const dbName = process.env.DB_NAME ?? 'travel_db';
      process.env.DATABASE_URL = `postgresql://${dbUser}:${encodeURIComponent(
        dbPassword,
      )}@${dbHost}:${dbPort}/${dbName}?schema=public`;
    }
    super();
  }

  async onModuleInit() {
    try {
      await super.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await super.$disconnect();
    this.logger.log('Database disconnected');
  }
}

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
