import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
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
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  getPublic() {
    return this.settingsService.getPublic();
  }

  @Get('app')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  getApp() {
    return this.settingsService.getApp();
  }

  @Put('app')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  updateApp(@Body() dto: UpdateAppSettingDto, @CurrentUser() user: AuthUser) {
    return this.settingsService.updateApp(dto, user);
  }

  @Get('branding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  getBranding() {
    return this.settingsService.getBranding();
  }

  @Put('branding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  updateBranding(@Body() dto: UpdateBrandingSettingDto, @CurrentUser() user: AuthUser) {
    return this.settingsService.updateBranding(dto, user);
  }

  @Get('pharmacy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  getPharmacy() {
    return this.settingsService.getPharmacy();
  }

  @Put('pharmacy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  updatePharmacy(@Body() dto: UpdatePharmacyProfileDto, @CurrentUser() user: AuthUser) {
    return this.settingsService.updatePharmacy(dto, user);
  }

  @Get('localization')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  getLocalization() {
    return this.settingsService.getLocalization();
  }

  @Put('localization')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  updateLocalization(@Body() dto: UpdateLocalizationSettingDto, @CurrentUser() user: AuthUser) {
    return this.settingsService.updateLocalization(dto, user);
  }

  @Get('receipt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  getReceipt() {
    return this.settingsService.getReceipt();
  }

  @Put('receipt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  updateReceipt(@Body() dto: UpdateReceiptSettingDto, @CurrentUser() user: AuthUser) {
    return this.settingsService.updateReceipt(dto, user);
  }

  @Get('security')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  getSecurity() {
    return this.settingsService.getSecurity();
  }

  @Put('security')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  updateSecurity(@Body() dto: UpdateSecuritySettingDto, @CurrentUser() user: AuthUser) {
    return this.settingsService.updateSecurity(dto, user);
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  getPreferences() {
    return this.settingsService.getPreferences();
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  updatePreferences(@Body() dto: UpdatePreferenceSettingDto, @CurrentUser() user: AuthUser) {
    return this.settingsService.updatePreferences(dto, user);
  }

  @Get('global')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  getGlobal() {
    return this.settingsService.getGlobal();
  }

  @Put('global/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  updateGlobal(@Param('key') key: string, @Body() dto: UpdateGlobalSettingDto, @CurrentUser() user: AuthUser) {
    return this.settingsService.updateGlobal(key, dto, user);
  }
}
