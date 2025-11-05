import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

describe('ChatGateway - token parsing in handleConnection', () => {
  let gateway: ChatGateway;
  let jwt: { verify: jest.Mock };

  beforeEach(async () => {
    jwt = { verify: jest.fn().mockReturnValue({ sub: 'user-123' }) };
    const chatServiceMock = {} as unknown as ChatService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: ChatService, useValue: chatServiceMock },
        { provide: JwtService, useValue: jwt },
        ChatGateway,
      ],
    }).compile();

    gateway = moduleRef.get(ChatGateway);
    // Stub server
    const s = {
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };
    (gateway as unknown as { server: Server }).server = s as unknown as Server;
  });

  const makeClient = (auth?: unknown, authorization?: string) => {
    const obj = {
      id: 'socket-1',
      handshake: {
        auth: auth ?? {},
        headers: { authorization },
      },
      disconnect: jest.fn(),
    };
    return obj as unknown as Socket & { userId?: string };
  };

  it('extracts raw token from handshake.auth.token (Bearer prefix)', () => {
    const client = makeClient({ token: 'Bearer abc.def' });
    gateway.handleConnection(client);
    expect(jwt.verify).toHaveBeenCalledWith('abc.def');
    expect(client.userId).toBe('user-123');
  });

  it('extracts raw token from handshake.auth.token (raw)', () => {
    const client = makeClient({ token: 'rawtoken' });
    gateway.handleConnection(client);
    expect(jwt.verify).toHaveBeenCalledWith('rawtoken');
    expect(client.userId).toBe('user-123');
  });

  it('falls back to headers.authorization (Bearer)', () => {
    const client = makeClient(undefined, 'Bearer header.token');
    gateway.handleConnection(client);
    expect(jwt.verify).toHaveBeenCalledWith('header.token');
    expect(client.userId).toBe('user-123');
  });
});
