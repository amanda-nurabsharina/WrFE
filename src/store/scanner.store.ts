import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ScannerState {
  scannerGapMs: number;
  setScannerGapMs: (gap: number) => void;
}

export const useScannerStore = create<ScannerState>()(
  persist(
    (set) => ({
      scannerGapMs: 100,
      setScannerGapMs: (gap) => set({ scannerGapMs: gap }),
    }),
    {
      name: 'wms-scanner-settings',
    }
  )
);
