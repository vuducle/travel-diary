import { Module } from '@nestjs/common';
import { EntriesController } from './entries.controller';
import { TripsEntriesController } from './trips-entries.controller';
import { EntriesService } from './entries.service';
import { PrismaModule } from '../../database/prisma.module';
import { EntriesResolver } from '../../graphql/entries.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [EntriesController, TripsEntriesController],
  providers: [EntriesService, EntriesResolver],
  exports: [EntriesService],
})
export class EntriesModule {}
