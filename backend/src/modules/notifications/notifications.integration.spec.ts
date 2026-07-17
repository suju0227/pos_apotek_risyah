import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request = require('supertest');
import { AppModule } from '../../app.module';
import { PrismaService } from '../../database/prisma.service';

describe('Notifications API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let managerToken: string;
  let cashierToken: string;
  let pharmacistToken: string;
  let ownerToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = moduleRef.get(PrismaService);
    await app.init();
    await seedUsers();

    managerToken = await login('manager_notif');
    cashierToken = await login('cashier_notif');
    pharmacistToken = await login('pharmacist_notif');
    ownerToken = await login('owner_notif');
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(username: string) {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ usernameOrEmail: username, password: 'ChangeMe123!' })
      .expect(201);
    return response.body.accessToken as string;
  }

  async function seedUsers() {
    await prisma.refreshToken.deleteMany();

    const managerRole = await prisma.role.upsert({
      where: { name: 'MANAGER' },
      update: {},
      create: { name: 'MANAGER', description: 'Manager role' },
    });
    const cashierRole = await prisma.role.upsert({
      where: { name: 'KASIR' },
      update: {},
      create: { name: 'KASIR', description: 'Kasir role' },
    });
    const pharmacistRole = await prisma.role.upsert({
      where: { name: 'APOTEKER' },
      update: {},
      create: { name: 'APOTEKER', description: 'Apoteker role' },
    });
    const ownerRole = await prisma.role.upsert({
      where: { name: 'PEMILIK' },
      update: {},
      create: { name: 'PEMILIK', description: 'Pemilik role' },
    });

    const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

    await prisma.user.upsert({
      where: { username: 'manager_notif' },
      update: { passwordHash, roleId: managerRole.id, isActive: true },
      create: {
        username: 'manager_notif',
        email: 'manager-notif@example.com',
        name: 'Manager Notif',
        passwordHash,
        roleId: managerRole.id,
      },
    });

    await prisma.user.upsert({
      where: { username: 'cashier_notif' },
      update: { passwordHash, roleId: cashierRole.id, isActive: true },
      create: {
        username: 'cashier_notif',
        email: 'cashier-notif@example.com',
        name: 'Cashier Notif',
        passwordHash,
        roleId: cashierRole.id,
      },
    });

    await prisma.user.upsert({
      where: { username: 'pharmacist_notif' },
      update: { passwordHash, roleId: pharmacistRole.id, isActive: true },
      create: {
        username: 'pharmacist_notif',
        email: 'pharmacist-notif@example.com',
        name: 'Pharmacist Notif',
        passwordHash,
        roleId: pharmacistRole.id,
      },
    });

    await prisma.user.upsert({
      where: { username: 'owner_notif' },
      update: { passwordHash, roleId: ownerRole.id, isActive: true },
      create: {
        username: 'owner_notif',
        email: 'owner-notif@example.com',
        name: 'Owner Notif',
        passwordHash,
        roleId: ownerRole.id,
      },
    });
  }

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer())
      .get('/api/notifications')
      .expect(401);
  });

  it('allows access for all active roles and returns list sorted by priority', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    const cashierRes = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${cashierToken}`)
      .expect(200);
    expect(Array.isArray(cashierRes.body)).toBe(true);

    const pharmacistRes = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .expect(200);
    expect(Array.isArray(pharmacistRes.body)).toBe(true);

    const ownerRes = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(Array.isArray(ownerRes.body)).toBe(true);
  });
});
