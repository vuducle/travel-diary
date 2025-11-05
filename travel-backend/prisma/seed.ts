import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import e from 'express';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // Create an admin user
  const admin = await prisma.user.upsert({
    where: { email: 'julianguyen@test.com' },
    update: {},
    create: {
      email: 'julianguyen@test.com',
      password,
      name: 'Julian Nguyen',
      role: 'ADMIN',
    },
    select: { id: true, email: true },
  });

  // Create a regular user
  const user = await prisma.user.upsert({
    where: { email: 'wendyredvelvet@test.com' },
    update: {},
    create: {
      email: 'wendyredvelvet@test.com',
      password,
      name: 'Wendy Ameilya',
      role: 'USER',
    },
    select: { id: true, email: true },
  });

  // Create a trip for the user
  const trip = await prisma.trip.create({
    data: {
      title: 'Vietnam 2024',
      description: 'From HCMC to Hanoi',
      userId: user.id,
    },
  });

  // Create a location for that trip
  const location = await prisma.location.create({
    data: {
      name: 'Nguyen Hue Street',
      country: 'Vietnam',
      lat: 12.34,
      lng: 56.78,
      tripId: trip.id,
    },
  });

  // Create an entry linked to the trip and location
  const entry = await prisma.entry.create({
    data: {
      title: 'First day',
      content: 'Arrived and explored the city',
      tripId: trip.id,
      locationId: location.id,
    },
  });

  console.log('Seed finished: ', { admin, user, trip, entry });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
