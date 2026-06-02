import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken, Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { durationToMilliseconds } from '../../common/utils/duration';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';

type UserWithRole = User & { role: Role };

type RefreshRecord = RefreshToken & { user: UserWithRole };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { username: dto.usernameOrEmail },
          { email: dto.usernameOrEmail },
        ],
      },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Username/email atau password salah');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Username/email atau password salah');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.createSession(user);
  }

  async refresh(refreshToken: string) {
    const record = await this.findRefreshRecord(refreshToken);

    if (!record) {
      throw new UnauthorizedException('Refresh token tidak valid');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    if (!record.user.isActive || record.user.deletedAt) {
      throw new UnauthorizedException('User tidak aktif');
    }

    return this.createSession(record.user);
  }

  async logout(refreshToken: string) {
    const record = await this.findRefreshRecord(refreshToken);

    if (record) {
      await this.prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logout berhasil' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, isActive: true },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak aktif');
    }

    return this.toSafeUser(user);
  }

  private async createSession(user: UserWithRole) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        username: user.username,
        role: user.role.name,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ),
      },
    );

    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    const refreshExpiresIn = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + durationToMilliseconds(refreshExpiresIn)),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toSafeUser(user),
    };
  }

  private async findRefreshRecord(
    refreshToken: string,
  ): Promise<RefreshRecord | null> {
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: { role: true },
        },
      },
    });

    for (const token of activeTokens) {
      if (await bcrypt.compare(refreshToken, token.tokenHash)) {
        return token;
      }
    }

    return null;
  }

  private toSafeUser(user: UserWithRole) {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role.name,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
