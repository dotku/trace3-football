import { create } from 'zustand';

interface AnalyticsState {
  attendance: number;
  concessions: {
    sales: number;
    inventory: Record<string, number>;
  };
  parking: {
    available: number;
    occupied: number;
  };
  setAttendance: (value: number) => void;
  updateConcessions: (sales: number, inventory: Record<string, number>) => void;
  updateParking: (available: number, occupied: number) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  attendance: 55390,
  concessions: {
    sales: 238131.00,
    inventory: {
      'Hot Dogs': 1500,
      'Beverages': 2500,
      'Snacks': 3000,
    },
  },
  parking: {
    available: 750,    // 5% of total capacity (15,000)
    occupied: 14250,   // 95% of total capacity
  },
  setAttendance: (value) => set({ attendance: value }),
  updateConcessions: (sales, inventory) => set({ concessions: { sales, inventory } }),
  updateParking: (available, occupied) => set({ parking: { available, occupied } }),
}));
