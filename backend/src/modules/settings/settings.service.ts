import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  UpdateAppSettingDto,
  UpdateBrandingSettingDto,
  UpdateGlobalSettingDto,
  UpdateLocalizationSettingDto,
  UpdatePharmacyProfileDto,
  UpdatePreferenceSettingDto,
  UpdateReceiptSettingDto,
  UpdateSecuritySettingDto,
} from './dto/update-domain-settings.dto';

function cleanDto<T>(dto: T): any {
  if (!dto) return dto;
  const cleaned = { ...dto };
  delete (cleaned as any).id;
  delete (cleaned as any).createdAt;
  delete (cleaned as any).updatedAt;
  return cleaned;
}

@Injectable()
export class SettingsService {
  private readonly cacheKeyPublic = 'settings:public';

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly cacheService: CacheService,
  ) {}

  async getPublic() {
    const cached = await this.cacheService.get<any>(this.cacheKeyPublic);
    if (cached) {
      return cached;
    }

    const app = await this.getApp();
    const branding = await this.getBranding();
    const pharmacy = await this.getPharmacy();

    const response = {
      app: {
        siteName: app?.siteName,
        applicationName: app?.applicationName,
        shortName: app?.shortName,
        tagline: app?.tagline,
        description: app?.description,
        maintenanceMode: app?.maintenanceMode,
        footerCopyright: app?.footerCopyright,
      },
      branding: {
        logoPath: branding?.logoPath,
        sidebarLogoPath: branding?.sidebarLogoPath,
        faviconPath: branding?.faviconPath,
        loginBackgroundPath: branding?.loginBackgroundPath,
        loginIllustrationPath: branding?.loginIllustrationPath,
        darkLogoPath: branding?.darkLogoPath,
        lightLogoPath: branding?.lightLogoPath,
        primaryColor: branding?.primaryColor,
        secondaryColor: branding?.secondaryColor,
        accentColor: branding?.accentColor,
        theme: branding?.theme,
        customCss: branding?.customCss,
      },
      pharmacy: {
        pharmacyName: pharmacy?.pharmacyName,
        address: pharmacy?.address,
        village: pharmacy?.village,
        district: pharmacy?.district,
        city: pharmacy?.city,
        province: pharmacy?.province,
        postalCode: pharmacy?.postalCode,
        phone: pharmacy?.phone,
        whatsapp: pharmacy?.whatsapp,
        openingHours: pharmacy?.openingHours,
      },
    };

    await this.cacheService.set(this.cacheKeyPublic, response, 30 * 60);

    return response;
  }

  // --- APP SETTING ---
  async getApp() {
    const cacheKey = 'settings:app';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    let app = await this.prisma.appSetting.findUnique({ where: { id: 1 } });
    if (!app) {
      app = await this.prisma.appSetting.create({ data: { id: 1 } });
    }
    await this.cacheService.set(cacheKey, app, 30 * 60);
    return app;
  }

  async updateApp(dto: UpdateAppSettingDto, user: AuthUser) {
    const current = await this.getApp();
    const data = cleanDto(dto);
    const updated = await this.prisma.appSetting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_APP_UPDATED',
      entityType: 'APP_SETTINGS',
      oldValue: current as any,
      newValue: updated as any,
    });
    await this.cacheService.del('settings:app');
    await this.cacheService.del(this.cacheKeyPublic);
    return updated;
  }

  // --- BRANDING SETTING ---
  async getBranding() {
    const cacheKey = 'settings:branding';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    let branding = await this.prisma.brandingSetting.findUnique({ where: { id: 1 } });
    if (!branding) {
      branding = await this.prisma.brandingSetting.create({ data: { id: 1 } });
    }
    await this.cacheService.set(cacheKey, branding, 30 * 60);
    return branding;
  }

  async updateBranding(dto: UpdateBrandingSettingDto, user: AuthUser) {
    const current = await this.getBranding();
    const data = cleanDto(dto);
    const updated = await this.prisma.brandingSetting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_BRANDING_UPDATED',
      entityType: 'BRANDING_SETTINGS',
      oldValue: current as any,
      newValue: updated as any,
    });
    await this.cacheService.del('settings:branding');
    await this.cacheService.del(this.cacheKeyPublic);
    return updated;
  }

  // --- PHARMACY PROFILE ---
  async getPharmacy() {
    const cacheKey = 'settings:pharmacy';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    let pharmacy = await this.prisma.pharmacyProfile.findUnique({ where: { id: 1 } });
    if (!pharmacy) {
      pharmacy = await this.prisma.pharmacyProfile.create({ data: { id: 1 } });
    }
    await this.cacheService.set(cacheKey, pharmacy, 30 * 60);
    return pharmacy;
  }

  async updatePharmacy(dto: UpdatePharmacyProfileDto, user: AuthUser) {
    const current = await this.getPharmacy();
    const data = cleanDto(dto);
    const updated = await this.prisma.pharmacyProfile.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_PHARMACY_UPDATED',
      entityType: 'PHARMACY_PROFILE',
      oldValue: current as any,
      newValue: updated as any,
    });
    await this.cacheService.del('settings:pharmacy');
    await this.cacheService.del(this.cacheKeyPublic);
    return updated;
  }

  // --- RECEIPT SETTING ---
  async getReceipt() {
    const cacheKey = 'settings:receipt';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    let receipt = await this.prisma.receiptSetting.findUnique({ where: { id: 1 } });
    if (!receipt) {
      receipt = await this.prisma.receiptSetting.create({ data: { id: 1 } });
    }
    await this.cacheService.set(cacheKey, receipt, 30 * 60);
    return receipt;
  }

  async updateReceipt(dto: UpdateReceiptSettingDto, user: AuthUser) {
    const current = await this.getReceipt();
    const data = cleanDto(dto);
    const updated = await this.prisma.receiptSetting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_RECEIPT_UPDATED',
      entityType: 'RECEIPT_SETTINGS',
      oldValue: current as any,
      newValue: updated as any,
    });
    await this.cacheService.del('settings:receipt');
    return updated;
  }

  // --- SECURITY SETTING ---
  async getSecurity() {
    const cacheKey = 'settings:security';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    let security = await this.prisma.securitySetting.findUnique({ where: { id: 1 } });
    if (!security) {
      security = await this.prisma.securitySetting.create({ data: { id: 1 } });
    }
    await this.cacheService.set(cacheKey, security, 30 * 60);
    return security;
  }

  async updateSecurity(dto: UpdateSecuritySettingDto, user: AuthUser) {
    const current = await this.getSecurity();
    const data = cleanDto(dto);
    const updated = await this.prisma.securitySetting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_SECURITY_UPDATED',
      entityType: 'SECURITY_SETTINGS',
      oldValue: current as any,
      newValue: updated as any,
    });
    await this.cacheService.del('settings:security');
    return updated;
  }

  // --- LOCALIZATION SETTING ---
  async getLocalization() {
    const cacheKey = 'settings:localization';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    let localization = await this.prisma.localizationSetting.findUnique({ where: { id: 1 } });
    if (!localization) {
      localization = await this.prisma.localizationSetting.create({ data: { id: 1 } });
    }
    await this.cacheService.set(cacheKey, localization, 30 * 60);
    return localization;
  }

  async updateLocalization(dto: UpdateLocalizationSettingDto, user: AuthUser) {
    if (dto.timezone && dto.timezone !== 'Asia/Makassar') {
      throw new BadRequestException('Timezone wajib Asia/Makassar');
    }
    const current = await this.getLocalization();
    const data = cleanDto(dto);
    const updated = await this.prisma.localizationSetting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_LOCALIZATION_UPDATED',
      entityType: 'LOCALIZATION_SETTINGS',
      oldValue: current as any,
      newValue: updated as any,
    });
    await this.cacheService.del('settings:localization');
    return updated;
  }

  // --- PREFERENCE SETTING ---
  async getPreferences() {
    const cacheKey = 'settings:preferences';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    let preference = await this.prisma.preferenceSetting.findUnique({ where: { id: 1 } });
    if (!preference) {
      preference = await this.prisma.preferenceSetting.create({ data: { id: 1 } });
    }
    await this.cacheService.set(cacheKey, preference, 30 * 60);
    return preference;
  }

  async updatePreferences(dto: UpdatePreferenceSettingDto, user: AuthUser) {
    const current = await this.getPreferences();
    const data = cleanDto(dto);
    const updated = await this.prisma.preferenceSetting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    
    // Convert bigint for auditing
    const safeOldValue = { ...current, backupSize: current.backupSize?.toString() } as any;
    const safeNewValue = { ...updated, backupSize: updated.backupSize?.toString() } as any;

    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_PREFERENCE_UPDATED',
      entityType: 'PREFERENCE_SETTINGS',
      oldValue: safeOldValue,
      newValue: safeNewValue,
    });
    await this.cacheService.del('settings:preferences');
    return updated;
  }

  // --- GLOBAL SETTING ---
  async getGlobal() {
    const cacheKey = 'settings:global';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const data = await this.prisma.globalSetting.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    await this.cacheService.set(cacheKey, data, 30 * 60);
    return data;
  }

  async updateGlobal(key: string, dto: UpdateGlobalSettingDto, user: AuthUser) {
    const current = await this.prisma.globalSetting.findUnique({ where: { key } });
    
    let updated;
    if (current) {
      updated = await this.prisma.globalSetting.update({
        where: { key },
        data: dto,
      });
    } else {
      updated = await this.prisma.globalSetting.create({
        data: {
          category: dto.category ?? 'GENERAL',
          key: dto.key,
          value: dto.value,
          valueType: dto.valueType,
          isPublic: dto.isPublic,
          isEditable: dto.isEditable,
          sortOrder: dto.sortOrder,
          description: dto.description,
        },
      });
    }

    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_GLOBAL_UPDATED',
      entityType: 'GLOBAL_SETTINGS',
      entityId: updated.id,
      oldValue: current as any,
      newValue: updated as any,
    });
    await this.cacheService.del('settings:global');
    return updated;
  }

  async clearAllSettingsCache() {
    const keys = [
      'settings:app',
      'settings:branding',
      'settings:pharmacy',
      'settings:localization',
      'settings:receipt',
      'settings:security',
      'settings:preferences',
      'settings:global',
      this.cacheKeyPublic,
    ];
    for (const key of keys) {
      await this.cacheService.del(key);
    }
  }
}
