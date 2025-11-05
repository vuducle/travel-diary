import { Field, Int, ObjectType } from '@nestjs/graphql';
import { TripModel } from './trip.model';

@ObjectType()
export class TripPage {
  @Field(() => [TripModel])
  items!: TripModel[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  totalPages!: number;

  @Field()
  hasNextPage!: boolean;
}
