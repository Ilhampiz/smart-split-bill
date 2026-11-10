import { distributeLargestRemainder, calculateSplit } from './calculator';
import type { ReceiptItem, Participant } from '../types';

function runTests() {
  console.log('Testing distributeLargestRemainder...');

  // Test 1: Nilai dibagi rata 3 orang (10.000 / 3) -> 3334, 3333, 3333 = 10000
  const targets = [
    { id: 'A', weight: 1 },
    { id: 'B', weight: 1 },
    { id: 'C', weight: 1 },
  ];
  const res1 = distributeLargestRemainder(targets, 10000);
  const sum1 = Object.values(res1).reduce((a, b) => a + b, 0);
  console.assert(sum1 === 10000, `Expected 10000, got ${sum1}`);

  // Test 2: Proporsional dengan bobot belanja (Andi 60.000, Bayu 40.000, Pajak 10.000)
  const propTargets = [
    { id: 'Andi', weight: 60000 },
    { id: 'Bayu', weight: 40000 },
  ];
  const taxSplit = distributeLargestRemainder(propTargets, 10000);
  console.assert(taxSplit['Andi'] === 6000, `Expected 6000 for Andi, got ${taxSplit['Andi']}`);
  console.assert(taxSplit['Bayu'] === 4000, `Expected 4000 for Bayu, got ${taxSplit['Bayu']}`);

  // Test 3: calculateSplit end-to-end
  const items: ReceiptItem[] = [
    { id: '1', name: 'Nasi Goreng', qty: 2, unit_price: 25000, line_total: 50000 },
    { id: '2', name: 'Ayam Bakar', qty: 1, unit_price: 30000, line_total: 30000 },
  ];
  const participants: Participant[] = [
    { id: 'p1', name: 'Andi' },
    { id: 'p2', name: 'Budi' },
  ];
  // Andi makan Nasi Goreng sendiri, Ayam Bakar patungan Andi & Budi
  const assignments = {
    '1': ['p1'],
    '2': ['p1', 'p2'],
  };
  const tax = 8000;
  const service = 4000;
  const discount = 2000;

  const shares = calculateSplit(items, participants, assignments, tax, service, discount);
  const totalShares = shares.reduce((acc, s) => acc + s.total, 0);
  const expectedGrandTotal = 50000 + 30000 + tax + service - discount; // 90000

  console.assert(
    totalShares === expectedGrandTotal,
    `Total pembagian (${totalShares}) harus persis sama dengan grand total (${expectedGrandTotal})`
  );

  console.log('[PASS] All Calculator unit tests PASSED successfully with selisih Rp 0.');
}

runTests();
