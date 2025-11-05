import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { EntriesService } from '../modules/entries/entries.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { GqlCurrentUser } from '../auth/decorators/gql-current-user.decorator';
import type { CurrentUserGql } from '../auth/decorators/gql-current-user.decorator';
import { EntryPage } from './models/entry.model';
import { LocationWithEntriesPage } from './models/location-with-entries.model';

@Resolver()
export class EntriesResolver {
  constructor(private readonly entriesService: EntriesService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => EntryPage, { name: 'entriesByTrip' })
  async entriesByTrip(
    @GqlCurrentUser() user: CurrentUserGql,
    @Args('tripId', { type: () => String }) tripId: string,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<EntryPage> {
    const viewerId = user?.id;
    if (!viewerId) throw new Error('Unauthenticated');
    const result = await this.entriesService.listEntriesForTripView(
      viewerId,
      tripId,
      page ?? 1,
      limit ?? 10,
    );
    return result as unknown as EntryPage;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => LocationWithEntriesPage, { name: 'locationsWithEntries' })
  async locationsWithEntries(
    @GqlCurrentUser() user: CurrentUserGql,
    @Args('tripId', { type: () => String }) tripId: string,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<LocationWithEntriesPage> {
    const viewerId = user?.id;
    if (!viewerId) throw new Error('Unauthenticated');
    const result = await this.entriesService.findTripLocationsWithEntriesView(
      viewerId,
      tripId,
      page ?? 1,
      limit ?? 10,
    );
    return result as unknown as LocationWithEntriesPage;
  }
}
