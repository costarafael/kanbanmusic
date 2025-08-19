import { create } from 'zustand';

interface PlayingAudio {
  cardId: string;
  playerId: string; // 'compact' or 'detail'
}

interface AudioState {
  playing: PlayingAudio | null;
  actions: {
    play: (cardId: string, playerId: string) => void;
    pause: () => void;
    stop: () => void;
  };
}

export const useAudioStore = create<AudioState>((set) => ({
  playing: null,
  actions: {
    play: (cardId: string, playerId: string) => set({ playing: { cardId, playerId } }),
    pause: () => set({ playing: null }),
    stop: () => set({ playing: null }),
  },
}));
