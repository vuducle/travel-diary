import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
import { EntryModel } from './entry.model';

@ObjectType()
export class LocationModel {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  parentId?: string | null;
}

@ObjectType()
export class LocationWithEntriesModel {
  @Field(() => LocationModel)
  location!: LocationModel;

  @Field(() => [EntryModel])
  entries!: EntryModel[];
}

@ObjectType()
export class LocationWithEntriesPage {
  @Field(() => [LocationWithEntriesModel])
  items!: LocationWithEntriesModel[];

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  totalPages!: number;

  @Field(() => Boolean)
  hasNextPage!: boolean;
}
