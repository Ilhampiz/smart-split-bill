import { create } from 'zustand';
import type { ReceiptItem, Participant, BackendStatus, OCRResponse } from '../types';

interface BillState {
  currentStep: number;
  backendStatus: BackendStatus;
  isProcessing: boolean;
  statusMessage: string;
  errorMessage: string | null;

  // Struk Data
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
  confidence: number;
  warnings: string[];

  // Peserta & Penugasan
  participants: Participant[];
  assignments: Record<string, string[]>; // itemId -> participantId[]

  // Actions
  setStep: (step: number) => void;
  setBackendStatus: (status: BackendStatus) => void;
  setProcessing: (isProcessing: boolean, message?: string) => void;
  setError: (err: string | null) => void;
  applyOCRResult: (data: OCRResponse) => void;

  // Item Actions
  addItem: (item: Omit<ReceiptItem, 'id'>) => void;
  updateItem: (id: string, updated: Partial<ReceiptItem>) => void;
  removeItem: (id: string) => void;
  updateBillSummary: (summary: {
    tax?: number;
    serviceCharge?: number;
    discount?: number;
    total?: number;
  }) => void;

  // Participant Actions
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  toggleAssignment: (itemId: string, participantId: string) => void;
  assignAllToItem: (itemId: string) => void;

  // Reset & Share
  resetAll: () => void;
  loadFromSharedPayload: (payload: {
    items: ReceiptItem[];
    participants: Participant[];
    assignments: Record<string, string[]>;
    tax: number;
    serviceCharge: number;
    discount: number;
    total: number;
  }) => void;
}

export const useBillStore = create<BillState>((set, get) => ({
  currentStep: 1,
  backendStatus: 'checking',
  isProcessing: false,
  statusMessage: '',
  errorMessage: null,

  items: [],
  subtotal: 0,
  tax: 0,
  serviceCharge: 0,
  discount: 0,
  total: 0,
  confidence: 1.0,
  warnings: [],

  participants: [
    { id: 'p1', name: 'Saya' },
    { id: 'p2', name: 'Teman 1' },
  ],
  assignments: {},

  setStep: (step) => set({ currentStep: step }),
  setBackendStatus: (status) => set({ backendStatus: status }),
  setProcessing: (isProcessing, message = '') =>
    set({ isProcessing, statusMessage: message, errorMessage: null }),
  setError: (errorMessage) => set({ errorMessage, isProcessing: false }),

  applyOCRResult: (data) => {
    const formattedItems: ReceiptItem[] = data.items.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      name: it.name,
      qty: it.qty,
      unit_price: it.unit_price,
      line_total: it.line_total,
    }));

    // Otomatis assign semua item ke semua peserta awal sebagai default
    const initialAssignments: Record<string, string[]> = {};
    const participantIds = get().participants.map((p) => p.id);
    formattedItems.forEach((it) => {
      initialAssignments[it.id] = [...participantIds];
    });

    set({
      items: formattedItems,
      subtotal: data.subtotal,
      tax: data.tax,
      serviceCharge: data.service_charge,
      discount: data.discount,
      total: data.total,
      confidence: data.confidence,
      warnings: data.warnings,
      assignments: initialAssignments,
      currentStep: 2,
      isProcessing: false,
      statusMessage: '',
    });
  },

  addItem: (item) => {
    const newItem: ReceiptItem = {
      ...item,
      discount: item.discount || 0,
      id: `item-${Date.now()}`,
    };
    const updatedItems = [...get().items, newItem];
    const newSubtotal = updatedItems.reduce(
      (acc, it) => acc + Math.max(0, it.line_total - (it.discount || 0)),
      0
    );

    // Default assign ke semua peserta saat ini
    const currentAssignments = { ...get().assignments };
    currentAssignments[newItem.id] = get().participants.map((p) => p.id);

    set({
      items: updatedItems,
      subtotal: newSubtotal,
      assignments: currentAssignments,
    });
  },

  updateItem: (id, updated) => {
    const updatedItems = get().items.map((it) => {
      if (it.id === id) {
        const item = { ...it, ...updated };
        item.line_total = item.qty * item.unit_price;
        return item;
      }
      return it;
    });
    const newSubtotal = updatedItems.reduce(
      (acc, it) => acc + Math.max(0, it.line_total - (it.discount || 0)),
      0
    );
    set({ items: updatedItems, subtotal: newSubtotal });
  },

  removeItem: (id) => {
    const updatedItems = get().items.filter((it) => it.id !== id);
    const newSubtotal = updatedItems.reduce(
      (acc, it) => acc + Math.max(0, it.line_total - (it.discount || 0)),
      0
    );
    const newAssignments = { ...get().assignments };
    delete newAssignments[id];
    set({ items: updatedItems, subtotal: newSubtotal, assignments: newAssignments });
  },

  updateBillSummary: (summary) => {
    set((state) => ({
      tax: summary.tax !== undefined ? summary.tax : state.tax,
      serviceCharge: summary.serviceCharge !== undefined ? summary.serviceCharge : state.serviceCharge,
      discount: summary.discount !== undefined ? summary.discount : state.discount,
      total: summary.total !== undefined ? summary.total : state.total,
    }));
  },

  addParticipant: (name) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const newParticipant: Participant = {
      id: `p-${Date.now()}`,
      name: cleanName,
    };
    set((state) => ({
      participants: [...state.participants, newParticipant],
    }));
  },

  removeParticipant: (id) => {
    const remaining = get().participants.filter((p) => p.id !== id);
    const newAssignments: Record<string, string[]> = {};
    Object.entries(get().assignments).forEach(([itemId, pIds]) => {
      newAssignments[itemId] = pIds.filter((pId) => pId !== id);
    });
    set({ participants: remaining, assignments: newAssignments });
  },

  toggleAssignment: (itemId, participantId) => {
    const current = get().assignments[itemId] || [];
    const exists = current.includes(participantId);
    const updated = exists ? current.filter((id) => id !== participantId) : [...current, participantId];

    set({
      assignments: {
        ...get().assignments,
        [itemId]: updated,
      },
    });
  },

  assignAllToItem: (itemId) => {
    const allIds = get().participants.map((p) => p.id);
    set({
      assignments: {
        ...get().assignments,
        [itemId]: allIds,
      },
    });
  },

  loadFromSharedPayload: (payload) => {
    const subtotal = payload.items.reduce(
      (acc, it) => acc + Math.max(0, it.line_total - (it.discount || 0)),
      0
    );
    set({
      currentStep: 4,
      items: payload.items,
      participants: payload.participants,
      assignments: payload.assignments,
      subtotal,
      tax: payload.tax,
      serviceCharge: payload.serviceCharge,
      discount: payload.discount,
      total: payload.total || subtotal + payload.tax + payload.serviceCharge - payload.discount,
      confidence: 1.0,
      warnings: [],
      errorMessage: null,
      isProcessing: false,
    });
  },

  resetAll: () => {
    // Bersihkan juga hash jika ada
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    set({
      currentStep: 1,
      items: [],
      subtotal: 0,
      tax: 0,
      serviceCharge: 0,
      discount: 0,
      total: 0,
      confidence: 1.0,
      warnings: [],
      assignments: {},
      errorMessage: null,
      isProcessing: false,
    });
  },
}));

