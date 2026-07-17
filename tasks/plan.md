# Implementation Plan: HPP Algorithm Fix

## Overview
Memperbaiki kalkulasi HPP dasar (`hppBase`) obat agar akurat terhadap PPN Excluded dan re-purchase ke batch yang sama menggunakan Weighted Average Cost (WAC).

## Task List

### Phase 1: Purchases Service Refactoring
- [ ] Task 1: Integrasi PPN Excluded ke hppBase di `resolveItems`
- [ ] Task 2: Implementasi Weighted Average Cost di `createOrUpdateBatch`

### Checkpoint: Service Logic Correct
- [ ] Unit/Integration tests berjalan sukses
- [ ] Logika WAC dan PPN terverifikasi
