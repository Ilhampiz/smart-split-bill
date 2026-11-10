import type { ReceiptItem, Participant, PersonShare } from '../types';

/**
 * Mendistribusikan sisa integer (Rupiah) menggunakan metode Largest Remainder (Hare-Niemeyer).
 * Memastikan jumlah integer tepat sama dengan targetTotal tanpa ada selisih Rp 1 pun.
 */
export function distributeLargestRemainder(
  targets: { id: string; weight: number }[],
  totalAmount: number
): Record<string, number> {
  const result: Record<string, number> = {};
  if (targets.length === 0 || totalAmount === 0) {
    targets.forEach((t) => (result[t.id] = 0));
    return result;
  }

  const sumWeights = targets.reduce((acc, t) => acc + t.weight, 0);
  if (sumWeights === 0) {
    // Jika semua bobot 0, bagi rata
    const base = Math.floor(totalAmount / targets.length);
    let remainder = totalAmount % targets.length;
    targets.forEach((t) => {
      result[t.id] = base + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);
    });
    return result;
  }

  // Hitung bagian floating point & integer base
  const allocations = targets.map((t) => {
    const exact = (t.weight / sumWeights) * totalAmount;
    const floor = Math.floor(exact);
    const fraction = exact - floor;
    return { id: t.id, floor, fraction };
  });

  const allocatedSum = allocations.reduce((acc, a) => acc + a.floor, 0);
  let remainder = totalAmount - allocatedSum;

  // Urutkan sisa pecahan terbesar
  allocations.sort((a, b) => b.fraction - a.fraction);

  // Bagikan remainder ke pemilik pecahan terbesar
  allocations.forEach((a) => {
    let bonus = 0;
    if (remainder > 0) {
      bonus = 1;
      remainder--;
    }
    result[a.id] = a.floor + bonus;
  });

  return result;
}

/**
 * Menghitung rincian pembagian tagihan per orang secara proporsional.
 */
export function calculateSplit(
  items: ReceiptItem[],
  participants: Participant[],
  assignments: Record<string, string[]>, // itemId -> participantId[]
  tax: number,
  serviceCharge: number,
  discount: number
): PersonShare[] {
  if (participants.length === 0) return [];

  // Inisialisasi rincian tiap peserta
  const shares: Record<
    string,
    {
      subtotal: number;
      items: { name: string; portionQty: number; portionPrice: number }[];
    }
  > = {};

  participants.forEach((p) => {
    shares[p.id] = { subtotal: 0, items: [] };
  });

  // 1. Alokasi Item Belanjaan
  items.forEach((item) => {
    const assignedIds = assignments[item.id] || [];
    if (assignedIds.length === 0) return;

    // Hitung harga bersih item setelah diskon khusus item (jika ada)
    const itemDiscount = item.discount || 0;
    const netItemTotal = Math.max(0, item.line_total - itemDiscount);

    // Bagi harga bersih item ke semua peserta yang ditugaskan dengan largest remainder
    const itemTargets = assignedIds.map((id) => ({ id, weight: 1 }));
    const distributed = distributeLargestRemainder(itemTargets, netItemTotal);

    assignedIds.forEach((pId) => {
      if (shares[pId]) {
        const portionCost = distributed[pId] || 0;
        shares[pId].subtotal += portionCost;
        const displayName =
          itemDiscount > 0
            ? `${item.name} [Diskon item -Rp ${itemDiscount.toLocaleString('id-ID')}]`
            : item.name;

        shares[pId].items.push({
          name: displayName,
          portionQty: Number((item.qty / assignedIds.length).toFixed(2)),
          portionPrice: portionCost,
        });
      }
    });
  });

  // 2. Alokasi Pajak, Service Charge, dan Diskon Proporsional
  const participantTargets = participants.map((p) => ({
    id: p.id,
    weight: shares[p.id].subtotal,
  }));

  const distributedTax = distributeLargestRemainder(participantTargets, tax);
  const distributedService = distributeLargestRemainder(participantTargets, serviceCharge);
  const distributedDiscount = distributeLargestRemainder(participantTargets, discount);

  // 3. Gabungkan Total Akhir per Peserta
  return participants.map((p) => {
    const s = shares[p.id];
    const pTax = distributedTax[p.id] || 0;
    const pService = distributedService[p.id] || 0;
    const pDiscount = distributedDiscount[p.id] || 0;
    const pTotal = Math.max(0, s.subtotal + pTax + pService - pDiscount);

    return {
      participantId: p.id,
      name: p.name,
      subtotal: s.subtotal,
      taxShare: pTax,
      serviceShare: pService,
      discountShare: pDiscount,
      total: pTotal,
      items: s.items,
    };
  });
}

