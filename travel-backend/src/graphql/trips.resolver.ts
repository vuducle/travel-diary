import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { TripsService } from '../modules/trips/trips.service';
import { TripPage } from './models/pagination.model';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { GqlCurrentUser } from '../auth/decorators/gql-current-user.decorator';
import type { CurrentUserGql } from '../auth/decorators/gql-current-user.decorator';
import { TripModel } from './models/trip.model';

@Resolver()
export class TripsResolver {
  constructor(private readonly tripsService: TripsService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => TripPage, { name: 'userTrips' })
  async userTrips(
    @GqlCurrentUser() user: CurrentUserGql,
    @Args('ownerId', { type: () => String }) ownerId: string,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<TripPage> {
    const viewerId = user?.id;
    // Fallback safety, though guard should ensure presence
    if (!viewerId) {
      throw new Error('Unauthenticated');
    }

    const result = await this.tripsService.findVisibleTripsForUser(
      viewerId,
      ownerId,
      page ?? 1,
      limit ?? 10,
    );
    return result as unknown as TripPage;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => TripPage, { name: 'myTrips' })
  async myTrips(
    @GqlCurrentUser() user: CurrentUserGql,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<TripPage> {
    const viewerId = user?.id;
    if (!viewerId) throw new Error('Unauthenticated');
    const result = await this.tripsService.findVisibleTripsForUser(
      viewerId,
      viewerId,
      page ?? 1,
      limit ?? 10,
    );
    return result as unknown as TripPage;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => TripModel, { name: 'trip', nullable: true })
  async trip(
    @GqlCurrentUser() user: CurrentUserGql,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<TripModel | null> {
    const viewerId = user?.id;
    if (!viewerId) throw new Error('Unauthenticated');
    const trip = await this.tripsService.findOneForView(viewerId, id);
    return trip as unknown as TripModel;
  }
}
