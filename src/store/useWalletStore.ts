import { create } from 'zustand';

interface WalletState {
  coins: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  coins: 0,
  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
  spendCoins: (amount) => {
    if (get().coins >= amount) {
      set((state) => ({ coins: state.coins - amount }));
      return true;
    }
    return false;
  },
}));