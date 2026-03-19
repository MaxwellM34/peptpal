import { create } from 'zustand';

interface AppState {
  disclaimerAcknowledged: boolean;
  setDisclaimerAcknowledged: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  disclaimerAcknowledged: false,
  setDisclaimerAcknowledged: (v) => set({ disclaimerAcknowledged: v }),
}));
