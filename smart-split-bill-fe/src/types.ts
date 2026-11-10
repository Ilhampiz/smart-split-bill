export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
  discount?: number; // Diskon khusus untuk item ini (Rupiah)
}

export interface Participant {
  id: string;
  name: string;
}

export interface PersonShare {
  participantId: string;
  name: string;
  subtotal: number;
  taxShare: number;
  serviceShare: number;
  discountShare: number;
  total: number;
  items: {
    name: string;
    portionQty: number;
    portionPrice: number;
  }[];
}

export interface OCRResponse {
  items: {
    name: string;
    qty: number;
    unit_price: number;
    line_total: number;
  }[];
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  total: number;
  confidence: number;
  warnings: string[];
}

export type BackendStatus = 'checking' | 'ready' | 'cold-starting' | 'error';

