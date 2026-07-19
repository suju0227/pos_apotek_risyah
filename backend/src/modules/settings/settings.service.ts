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
    let app = await this.prisma.appSetting.findUnique({ where: { id: 1 } });
    if (!app) {
      app = await this.prisma.appSetting.create({ data: { id: 1 } });
    }
    return app;
  }

  async updateApp(dto: UpdateAppSettingDto, user: AuthUser) {
    const current = await this.getApp();
    const updated = await this.prisma.appSetting.upsert({
      where: { id: 1 },
      update: dto,
      create: { id: 1, ...dto },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_APP_UPDATED',
      entityType: 'APP_SETTINGS',
      entityId: '1',
      oldValue: current as any,
      newValue: updated as any,
    });
    await this.cacheService.del(this.cacheKeyPublic);
    return updated;
  }

  // --- BRANDING SETTING ---
  async getBranding() {
    let branding = await this.prisma.brandingSetting.findUnique({ where: { id: 1 } });
    if (!branding) {
      branding = await this.prisma.brandingSetting.create({ data: { id: 1 } });
    }
    return branding;
  }

  async updateBranding(dto: UpdateBrandingSettingDto, user: AuthUser) {
    const current = await this.getBranding();
    const updated = await this.prisma.brandingSetting.upsert({
      where: { id: 1 },
      update: dto,
      create: { id: 1, ...dto },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_BRANDING_UPDATED',
      entityType: 'BRANDING_SETTINGS',
      entityId: '1',
      oldValue: current as any,
      newValue: updated as any,
    });
    await this.cacheService.del(this.cacheKeyPublic);
    return updated;
  }

  // --- PHARMACY PROFILE ---
  async getPharmacy() {
    let pharmacy = await this.prisma.pharmacyProfile.findUnique({ where: { id: 1 } });
    if (!pharmacy) {
      pharmacy = await this.prisma.pharmacyProfile.create({ data: { id: 1 } });
    }
    return pharmacy;
  }

  async updatePharmacy(dto: UpdatePharmacyProfileDto, user: AuthUser) {
    const current = await this.getPharmacy();
    const updated = await this.prisma.pharmacyProfile.upsert({
      where: { id: 1 },
      update: dto,
      create: { id: 1, ...dto },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_PHARMACY_UPDATED',
      entityType: 'PHARMACY_PROFILE',
      entityId: '1',
      oldValue: current as any,
      newValue: updated as any,
    });
    await this.cacheService.del(this.cacheKeyPublic);
    return updated;
  }

  // --- RECEIPT SETTING ---
  async getReceipt() {
    let receipt = await this.prisma.receiptSetting.findUnique({ where: { id: 1 } });
    if (!receipt) {
      receipt = await this.prisma.receiptSetting.create({ data: { id: 1 } });
    }
    return receipt;
  }

  async updateReceipt(dto: UpdateReceiptSettingDto, user: AuthUser) {
    const current = await this.getReceipt();
    const updated = await this.prisma.receiptSetting.upsert({
      where: { id: 1 },
      update: dto,
      create: { id: 1, ...dto },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_RECEIPT_UPDATED',
      entityType: 'RECEIPT_SETTINGS',
      entityId: '1',
      oldValue: current as any,
      newValue: updated as any,
    });
    return updated;
  }

  // --- SECURITY SETTING ---
  async getSecurity() {
    let security = await this.prisma.securitySetting.findUnique({ where: { id: 1 } });
    if (!security) {
      security = await this.prisma.securitySetting.create({ data: { id: 1 } });
    }
    return security;
  }

  async updateSecurity(dto: UpdateSecuritySettingDto, user: AuthUser) {
    const current = await this.getSecurity();
    const updated = await this.prisma.securitySetting.upsert({
      where: { id: 1 },
      update: dto,
      create: { id: 1, ...dto },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_SECURITY_UPDATED',
      entityType: 'SECURITY_SETTINGS',
      entityId: '1',
      oldValue: current as any,
      newValue: updated as any,
    });
    return updated;
  }

  // --- LOCALIZATION SETTING ---
  async getLocalization() {
    let localization = await this.prisma.localizationSetting.findUnique({ where: { id: 1 } });
    if (!localization) {
      localization = await this.prisma.localizationSetting.create({ data: { id: 1 } });
    }
    return localization;
  }

  async updateLocalization(dto: UpdateLocalizationSettingDto, user: AuthUser) {
    if (dto.timezone && dto.timezone !== 'Asia/Makassar') {
      throw new BadRequestException('Timezone wajib Asia/Makassar');
    }
    const current = await this.getLocalization();
    const updated = await this.prisma.localizationSetting.upsert({
      where: { id: 1 },
      update: dto,
      create: { id: 1, ...dto },
    });
    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_LOCALIZATION_UPDATED',
      entityType: 'LOCALIZATION_SETTINGS',
      entityId: '1',
      oldValue: current as any,
      newValue: updated as any,
    });
    return updated;
  }

  // --- PREFERENCE SETTING ---
  async getPreferences() {
    let preference = await this.prisma.preferenceSetting.findUnique({ where: { id: 1 } });
    if (!preference) {
      preference = await this.prisma.preferenceSetting.create({ data: { id: 1 } });
    }
    return preference;
  }

  async updatePreferences(dto: UpdatePreferenceSettingDto, user: AuthUser) {
    const current = await this.getPreferences();
    const updated = await this.prisma.preferenceSetting.upsert({
      where: { id: 1 },
      update: dto,
      create: { id: 1, ...dto },
    });
    
    // Convert bigint for auditing
    const safeOldValue = { ...current, backupSize: current.backupSize?.toString() } as any;
    const safeNewValue = { ...updated, backupSize: updated.backupSize?.toString() } as any;

    await this.auditLogsService.record({
      userId: user.id,
      action: 'SETTINGS_PREFERENCE_UPDATED',
      entityType: 'PREFERENCE_SETTINGS',
      entityId: '1',
      oldValue: safeOldValue,
      newValue: safeNewValue,
    });
    return updated;
  }

  // --- GLOBAL SETTING ---
  async getGlobal() {
    return this.prisma.globalSetting.findMany({
      orderBy: { sortOrder: 'asc' },
    });
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
    return updated;
  }
}
