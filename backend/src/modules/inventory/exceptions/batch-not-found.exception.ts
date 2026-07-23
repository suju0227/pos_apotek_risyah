import { NotFoundException } from '@nestjs/common';

export class BatchNotFoundException extends NotFoundException {
  constructor(batchId: string) {
    super(`Batch dengan ID ${batchId} tidak ditemukan atau tidak aktif`);
  }
}
