import {
  Field,
  ID,
  ObjectType,
  Int,
  GraphQLISODateTime,
} from '@nestjs/graphql';

import { EntryImageModel } from './entry-image.model';

@ObjectType()
export class EntryModel {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  tripId!: string;

  @Field(() => String, { nullable: true })
  locationId?: string | null;

  @Field(() => String, { nullable: true })
  content?: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => [EntryImageModel])
  images!: EntryImageModel[];
}

@ObjectType()
export class EntryPage {
  @Field(() => [EntryModel])
  items!: EntryModel[];

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
