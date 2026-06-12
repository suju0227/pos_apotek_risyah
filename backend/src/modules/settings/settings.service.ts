import { BadRequestException, Injectable } from '@nestjs/common';
import { AppSetting } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async get() {
    const settings = await this.getOrCreateSettings();
    return this.toResponse(settings);
  }

  async update(dto: UpdateSettingsDto, user: AuthUser) {
    if (dto.timezone && dto.timezone !== 'Asia/Makassar') {
      throw new BadRequestException('Timezone wajib Asia/Makassar');
    }

    const current = await this.getOrCreateSettings();
    const updated = await this.prisma.appSetting.update({
      where: { id: current.id },
      data: {
        pharmacyName: dto.pharmacyName?.trim() || undefined,
        address: dto.address,
        phone: dto.phone,
        expiredAlertDays: dto.expiredAlertDays,
        timezone: dto.timezone,
      },
    });

    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_UPDATED',
      entityType: 'APP_SETTINGS',
      entityId: updated.id,
      oldValue: this.toResponse(current),
      newValue: this.toResponse(updated),
    });

    return this.toResponse(updated);
  }

  private async getOrCreateSettings() {
    const settings = await this.prisma.appSetting.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (settings) return settings;

    return this.prisma.appSetting.create({
      data: {
        pharmacyName: 'Apotek Risyah',
        expiredAlertDays: 30,
        timezone: 'Asia/Makassar',
        currency: 'IDR',
      },
    });
  }

  private toResponse(settings: AppSetting) {
    return {
      id: settings.id,
      pharmacyName: settings.pharmacyName,
      address: settings.address,
      phone: settings.phone,
      expiredAlertDays: settings.expiredAlertDays,
      timezone: settings.timezone,
      currency: settings.currency,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }
}
