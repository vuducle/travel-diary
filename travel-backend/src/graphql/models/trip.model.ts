import { Field, ID, ObjectType, GraphQLISODateTime } from '@nestjs/graphql';
import { VisibilityGql } from './visibility.enum';

@ObjectType()
export class TripModel {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  startDate?: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  endDate?: Date | null;

  @Field(() => String, { nullable: true })
  coverImage?: string | null;

  @Field(() => VisibilityGql)
  visibility!: VisibilityGql;

  @Field(() => String)
  userId!: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
