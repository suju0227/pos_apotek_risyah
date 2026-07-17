# Todo List: HPP Algorithm Fix

## Phase 1: Purchases Service Refactoring
- [ ] Task 1: Integrasi PPN Excluded ke hppBase di `resolveItems`
  - [ ] Perbarui parameter `resolveItems` di `purchases.service.ts`
  - [ ] Kalikan HPP dengan faktor PPN jika `PPN_EXCLUDED`
- [ ] Task 2: Implementasi Weighted Average Cost di `createOrUpdateBatch`
  - [ ] Hitung WAC jika `qtyBefore > 0`
  - [ ] Perbarui `hppBase` batch menggunakan WAC

## Checkpoint: Service Logic Correct
- [ ] Integration tests purchases pass
- [ ] Seluruh backend tests pass
