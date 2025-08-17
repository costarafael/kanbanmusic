import { create } from 'zustand';

interface AudioState {
  playingCardId: string | null;
  actions: {
    play: (id: string) => void;
    pause: () => void;
    stop: () => void;
  };
}

export const useAudioStore = create<AudioState>((set) => ({
  playingCardId: null,
  actions: {
    play: (id: string) => set({ playingCardId: id }),
    pause: () => set({ playingCardId: null }),
    stop: () => set({ playingCardId: null }),
  },
}));
