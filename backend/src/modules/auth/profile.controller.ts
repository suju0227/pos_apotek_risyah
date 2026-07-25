import { Body, Controller, Get, Put, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/types/auth-user';
import { AuthService } from './auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }

  @Put()
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('avatar')
  async uploadAvatar(@CurrentUser() user: AuthUser, @Body() body: { avatar: string }) {
    if (!body.avatar) {
      throw new BadRequestException('Avatar data is required');
    }
    if (!body.avatar.startsWith('data:image/')) {
      throw new BadRequestException('Invalid image format');
    }
    return this.authService.updateAvatar(user.id, body.avatar);
  }
}
