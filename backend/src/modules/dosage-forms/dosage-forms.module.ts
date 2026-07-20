import { Module } from '@nestjs/common';
import { DosageFormsController } from './dosage-forms.controller';
import { DosageFormsService } from './dosage-forms.service';

@Module({
  controllers: [DosageFormsController],
  providers: [DosageFormsService],
  exports: [DosageFormsService],
})
export class DosageFormsModule {}
