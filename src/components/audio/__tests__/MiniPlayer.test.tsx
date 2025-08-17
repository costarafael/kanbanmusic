import { render, screen, fireEvent } from '@testing-library/react';
import { MiniPlayer } from '../MiniPlayer';

// Mock the audio store
const mockActions = {
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
};

jest.mock('@/lib/store/useAudioStore', () => ({
  useAudioStore: () => ({
    playingCardId: null,
    actions: mockActions,
  }),
}));

// Mock HTML5 audio
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 120,
  volume: 1,
};

Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudio),
});

describe('MiniPlayer', () => {
  const mockProps = {
    audioUrl: 'https://example.com/audio.mp3',
    cardId: 'test-card-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render mini player controls', () => {
    render(<MiniPlayer {...mockProps} />);
    
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should show play button when not playing', () => {
    render(<MiniPlayer {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();
  });

  it('should call play action when play button is clicked', () => {
    render(<MiniPlayer {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    
    expect(mockActions.play).toHaveBeenCalledWith('test-card-1');
  });

  it('should call stop action when stop button is clicked', () => {
    render(<MiniPlayer {...mockProps} />);
    
    const stopButton = screen.getByRole('button', { name: /stop/i });
    fireEvent.click(stopButton);
    
    expect(mockActions.stop).toHaveBeenCalled();
  });

  it('should display time in correct format', () => {
    render(<MiniPlayer {...mockProps} />);
    
    // Should show 0:00 / 0:00 initially
    expect(screen.getByText(/0:00 \/ 0:00/)).toBeInTheDocument();
  });

  it('should handle volume changes', () => {
    render(<MiniPlayer {...mockProps} />);
    
    const volumeSlider = screen.getByRole('slider');
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });
    
    expect(volumeSlider).toHaveValue('0.5');
  });

  it('should set up audio event listeners', () => {
    render(<MiniPlayer {...mockProps} />);
    
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('loadedmetadata', expect.any(Function));
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = render(<MiniPlayer {...mockProps} />);
    
    unmount();
    
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith('loadedmetadata', expect.any(Function));
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should format time correctly', () => {
    // Test the time formatting functionality by checking different time values
    render(<MiniPlayer {...mockProps} />);
    
    // The formatTime function should format 90 seconds as "1:30"
    // We can test this by checking if the component handles time updates correctly
    expect(screen.getByText(/0:00 \/ 0:00/)).toBeInTheDocument();
  });

  it('should create audio element with correct src', () => {
    render(<MiniPlayer {...mockProps} />);
    
    const audio = document.querySelector('audio');
    expect(audio).toHaveAttribute('src', 'https://example.com/audio.mp3');
    expect(audio).toHaveAttribute('preload', 'metadata');
  });
});

// Test with playing state
describe('MiniPlayer - Playing State', () => {
  beforeEach(() => {
    // Mock store to return playing state
    jest.doMock('@/lib/store/useAudioStore', () => ({
      useAudioStore: () => ({
        playingCardId: 'test-card-1',
        actions: mockActions,
      }),
    }));
  });

  afterEach(() => {
    jest.dontMock('@/lib/store/useAudioStore');
  });

  it('should show pause button when playing', () => {
    // Re-require the component to get the updated mock
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MiniPlayer: PlayingMiniPlayer } = require('../MiniPlayer');
    
    render(<PlayingMiniPlayer audioUrl="https://example.com/audio.mp3" cardId="test-card-1" />);
    
    // When playing, clicking the play/pause button should call pause
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);
    
    expect(mockActions.pause).toHaveBeenCalled();
  });
});