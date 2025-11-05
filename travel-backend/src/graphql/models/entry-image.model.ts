import {
  Field,
  ID,
  Int,
  ObjectType,
  GraphQLISODateTime,
} from '@nestjs/graphql';

@ObjectType()
export class EntryImageModel {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  url!: string;

  @Field(() => Int)
  order!: number;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}
