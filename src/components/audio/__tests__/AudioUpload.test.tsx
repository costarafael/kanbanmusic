import { render, screen, fireEvent } from '@testing-library/react';
import { AudioUpload } from '../AudioUpload';

describe('AudioUpload', () => {
  const mockOnAudioUrlChange = jest.fn();

  beforeEach(() => {
    mockOnAudioUrlChange.mockClear();
  });

  it('should render audio upload input', () => {
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} />);
    
    expect(screen.getByLabelText('Audio URL')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://example.com/audio.mp3')).toBeInTheDocument();
  });

  it('should render with current URL', () => {
    const currentUrl = 'https://example.com/test.mp3';
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} currentUrl={currentUrl} />);
    
    const input = screen.getByDisplayValue(currentUrl);
    expect(input).toBeInTheDocument();
  });

  it('should validate valid mp3 URL', () => {
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'https://example.com/audio.mp3' } });
    
    expect(mockOnAudioUrlChange).toHaveBeenCalledWith('https://example.com/audio.mp3');
    expect(screen.queryByText(/Please enter a valid audio URL/)).not.toBeInTheDocument();
  });

  it('should validate valid wav URL', () => {
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'https://example.com/audio.wav' } });
    
    expect(mockOnAudioUrlChange).toHaveBeenCalledWith('https://example.com/audio.wav');
  });

  it('should validate SoundCloud URL', () => {
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} />);
    
    const input = screen.getByRole('textbox');
    const soundcloudUrl = 'https://soundcloud.com/user/track';
    fireEvent.change(input, { target: { value: soundcloudUrl } });
    
    expect(mockOnAudioUrlChange).toHaveBeenCalledWith(soundcloudUrl);
  });

  it('should validate Spotify URL', () => {
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} />);
    
    const input = screen.getByRole('textbox');
    const spotifyUrl = 'https://open.spotify.com/track/123';
    fireEvent.change(input, { target: { value: spotifyUrl } });
    
    expect(mockOnAudioUrlChange).toHaveBeenCalledWith(spotifyUrl);
  });

  it('should validate YouTube URL', () => {
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} />);
    
    const input = screen.getByRole('textbox');
    const youtubeUrl = 'https://youtube.com/watch?v=123';
    fireEvent.change(input, { target: { value: youtubeUrl } });
    
    expect(mockOnAudioUrlChange).toHaveBeenCalledWith(youtubeUrl);
  });

  it('should show error for invalid URL format', () => {
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'invalid-url' } });
    
    expect(screen.getByText(/Please enter a valid audio URL/)).toBeInTheDocument();
    expect(mockOnAudioUrlChange).not.toHaveBeenCalled();
  });

  it('should show error for non-audio URL', () => {
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'https://example.com/document.pdf' } });
    
    expect(screen.getByText(/Please enter a valid audio URL/)).toBeInTheDocument();
    expect(mockOnAudioUrlChange).not.toHaveBeenCalled();
  });

  it('should allow empty URL', () => {
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    
    expect(mockOnAudioUrlChange).toHaveBeenCalledWith('');
    expect(screen.queryByText(/Please enter a valid audio URL/)).not.toBeInTheDocument();
  });

  it('should show clear button when URL is present', () => {
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} currentUrl="https://example.com/audio.mp3" />);
    
    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();
  });

  it('should clear URL when clear button is clicked', () => {
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} currentUrl="https://example.com/audio.mp3" />);
    
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);
    
    expect(mockOnAudioUrlChange).toHaveBeenCalledWith('');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('should validate all supported audio extensions', () => {
    const extensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    render(<AudioUpload onAudioUrlChange={mockOnAudioUrlChange} />);
    
    const input = screen.getByRole('textbox');
    
    extensions.forEach(ext => {
      fireEvent.change(input, { target: { value: `https://example.com/audio${ext}` } });
      expect(mockOnAudioUrlChange).toHaveBeenCalledWith(`https://example.com/audio${ext}`);
    });
  });
});