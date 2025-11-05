import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentUserGql {
  id: string;
  email: string;
  name?: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
}

export const GqlCurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext<{ req: { user?: CurrentUserGql } }>().req;
    const user = req.user;
    return user;
  },
);
