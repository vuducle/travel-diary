import { registerEnumType } from '@nestjs/graphql';

export enum VisibilityGql {
  PRIVATE = 'PRIVATE',
  FRIENDS = 'FRIENDS',
  PUBLIC = 'PUBLIC',
}

registerEnumType(VisibilityGql, {
  name: 'Visibility',
  description: 'Trip visibility setting',
});
