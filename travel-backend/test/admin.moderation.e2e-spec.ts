import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

async function login(
  app: INestApplication<App>,
  email: string,
  password: string,
) {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);
  type LoginResponse = {
    accessToken: string;
    user: { id: string; email: string };
  };
  const body = res.body as LoginResponse;
  const token = body.accessToken;
  const user = body.user;
  return { token, user };
}

describe('Admin Moderation (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let adminId: string;
  let wendyToken: string;
  let wendyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login seeded users
    const adminLogin = await login(app, 'julianguyen@test.com', 'password123');
    adminToken = adminLogin.token;
    adminId = adminLogin.user.id;

    const wendyLogin = await login(
      app,
      'wendyredvelvet@test.com',
      'password123',
    );
    wendyToken = wendyLogin.token;
    wendyId = wendyLogin.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete a comment as admin', async () => {
    // Ensure a trip exists (seed creates Vietnam 2024 for Wendy)
    const tripsRes = await request(app.getHttpServer())
      .get('/trips/all')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const itemsMaybe = (tripsRes.body as { items?: unknown }).items;
    const allTrips: Array<{ id: string; title?: string }> = Array.isArray(
      itemsMaybe,
    )
      ? (itemsMaybe as Array<{ id: string; title?: string }>)
      : Array.isArray(tripsRes.body)
        ? (tripsRes.body as Array<{ id: string; title?: string }>)
        : [];
    const trip =
      allTrips.find((t) => t.title === 'Vietnam 2024') ?? allTrips[0];
    expect(trip).toBeTruthy();

    // Wendy creates a comment
    const commentRes = await request(app.getHttpServer())
      .post(`/trips/${trip.id}/comments`)
      .set('Authorization', `Bearer ${wendyToken}`)
      .send({ content: 'Comment to moderate' })
      .expect(201);

    const commentBody = commentRes.body as { id: string };
    const commentId = commentBody.id;
    expect(commentId).toBeTruthy();

    // Admin removes the comment
    await request(app.getHttpServer())
      .delete(`/admin/comments/${commentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res: { body: { message?: string } }) => {
        expect(res.body.message).toBe('Comment removed by admin');
      });
  });

  it('should suspend and unsuspend a user as admin', async () => {
    // Suspend Wendy
    const suspendRes = await request(app.getHttpServer())
      .patch(`/admin/users/${wendyId}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Test moderation' })
      .expect(200);

    type SuspendResponse = {
      user?: { suspendedAt: string | null; suspendedReason: string | null };
    };
    const suspendBody = suspendRes.body as SuspendResponse;
    expect(suspendBody.user?.suspendedAt).toBeTruthy();
    expect(suspendBody.user?.suspendedReason).toBe('Test moderation');

    // Unsuspend Wendy
    const unsuspendRes = await request(app.getHttpServer())
      .patch(`/admin/users/${wendyId}/unsuspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const unsuspendBody = unsuspendRes.body as SuspendResponse;
    expect(unsuspendBody.user?.suspendedAt).toBeNull();
    expect(unsuspendBody.user?.suspendedReason).toBeNull();
  });

  it('should delete a trip as admin', async () => {
    // Create a new trip for Wendy to safely delete
    const createTripRes = await request(app.getHttpServer())
      .post('/trips')
      .set('Authorization', `Bearer ${wendyToken}`)
      .field('title', 'Trip to Delete')
      .field('description', 'Temporary trip for moderation test')
      .expect(201);

    const createTripBody = createTripRes.body as { id: string };
    const tripId = createTripBody.id;
    expect(tripId).toBeTruthy();

    // Admin removes the trip
    await request(app.getHttpServer())
      .delete(`/admin/trips/${tripId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res: { body: { message?: string } }) => {
        expect(res.body.message).toBe('Trip removed by admin');
      });
  });

  it('should block suspended user from creating comments, trips, and messages', async () => {
    // Suspend Wendy
    await request(app.getHttpServer())
      .patch(`/admin/users/${wendyId}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Blocked for test' })
      .expect(200);

    // Try to create a trip as Wendy
    await request(app.getHttpServer())
      .post('/trips')
      .set('Authorization', `Bearer ${wendyToken}`)
      .field('title', 'Should Fail')
      .expect(403);

    // Ensure a trip exists (seeded trip) to attempt commenting
    const tripsRes = await request(app.getHttpServer())
      .get('/trips/all')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const itemsMaybe2 = (tripsRes.body as { items?: unknown }).items;
    const allTrips2: Array<{ id: string; title?: string }> = Array.isArray(
      itemsMaybe2,
    )
      ? (itemsMaybe2 as Array<{ id: string; title?: string }>)
      : Array.isArray(tripsRes.body)
        ? (tripsRes.body as Array<{ id: string; title?: string }>)
        : [];
    const trip =
      allTrips2.find((t) => t.title === 'Vietnam 2024') ?? allTrips2[0];
    expect(trip).toBeTruthy();

    // Try to create a comment as Wendy
    await request(app.getHttpServer())
      .post(`/trips/${trip.id}/comments`)
      .set('Authorization', `Bearer ${wendyToken}`)
      .send({ content: 'Should Fail' })
      .expect(403);

    // Try to send a message as Wendy to Julian
    await request(app.getHttpServer())
      .post('/chat/message')
      .set('Authorization', `Bearer ${wendyToken}`)
      .send({ receiverId: adminId, content: 'Hello' })
      .expect(403);

    // Unsuspend to restore state
    await request(app.getHttpServer())
      .patch(`/admin/users/${wendyId}/unsuspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('should list audit logs', async () => {
    const logsRes = await request(app.getHttpServer())
      .get('/admin/audit-logs?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const logsBody = logsRes.body as {
      items: unknown[];
      total: number;
      page: number;
      limit: number;
    };
    const { items, total, page, limit } = logsBody;
    expect(Array.isArray(items)).toBe(true);
    expect(typeof total).toBe('number');
    expect(page).toBe(1);
    expect(limit).toBe(10);
  });
});
