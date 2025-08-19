"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Play, Pause, Square, SkipForward, SkipBack } from "lucide-react";
import { useAudioStore } from "@/lib/store/useAudioStore";

interface PlaylistItem {
  cardId: string;
  order: number;
  title?: string;
  audioUrl?: string;
  coverUrl?: string;
}

interface PlaylistPlayerProps {
  playlistItems: PlaylistItem[];
  cardId: string; // For the audio store
  onCardClick?: (cardId: string) => void; // To open referenced cards
  boardId?: string; // For generating card URLs
}

export function PlaylistPlayer({ playlistItems, cardId, onCardClick, boardId }: PlaylistPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { playing, actions } = useAudioStore();
  const playerId = 'playlist';
  const isThisPlayerPlaying = playing?.cardId === cardId && playing?.playerId === playerId;

  const currentTrack = playlistItems[currentTrackIndex];
  const hasAudio = currentTrack?.audioUrl;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      // Auto play next track
      if (currentTrackIndex < playlistItems.length - 1) {
        setCurrentTrackIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setCurrentTrackIndex(0);
      }
    };

    const handleError = () => {
      console.error("Audio failed to load");
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [currentTrackIndex, playlistItems.length]);

  useEffect(() => {
    if (isPlaying && hasAudio) {
      audioRef.current?.play().catch(console.error);
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex, hasAudio]);

  const handlePlay = () => {
    if (!hasAudio) return;
    
    if (isPlaying) {
      setIsPlaying(false);
      actions.pause();
    } else {
      // Stop any other playing audio
      actions.stop();
      setIsPlaying(true);
      actions.play(cardId, playerId);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    actions.stop();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Stop this player if another one starts playing
  useEffect(() => {
    if (playing && !isThisPlayerPlaying && isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [playing, isThisPlayerPlaying, isPlaying]);

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
      setCurrentTime(0);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < playlistItems.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
      setCurrentTime(0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !hasAudio) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * (duration || 100);
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const generateCardUrl = (cardId: string) => {
    if (!boardId) return '#';
    const baseUrl = window.location.origin;
    return `${baseUrl}/b/${boardId}?card=${cardId}`;
  };

  if (playlistItems.length === 0) {
    return null;
  }

  return (
    <div className={`p-3 rounded-lg space-y-3 relative overflow-hidden ${
      isThisPlayerPlaying && isPlaying 
        ? 'bg-gradient-to-r from-purple-900/80 via-blue-800/80 to-pink-800/80 animate-gradient-x' 
        : 'bg-slate-700'
    }`}>
      {hasAudio && (
        <audio ref={audioRef} src={currentTrack.audioUrl} preload="metadata" />
      )}
      
      {/* Current track info */}
      <div className="flex items-center gap-3">
        {currentTrack?.coverUrl ? (
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title || 'Track'}
            className="w-10 h-10 rounded object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-slate-600 rounded flex items-center justify-center">
            <Music className="h-5 w-5 text-slate-300" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100 truncate">
            {currentTrack?.title || `Track ${currentTrackIndex + 1}`}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {currentTrackIndex + 1} of {playlistItems.length}
            </Badge>
            {hasAudio && duration > 0 && (
              <span className="text-xs text-slate-300 font-mono">
                {formatTime(duration)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          disabled={currentTrackIndex === 0}
          className="h-8 w-8 p-0 text-slate-100 hover:text-white hover:bg-slate-600 disabled:opacity-50"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          disabled={!hasAudio}
          className="h-10 w-10 p-0 text-slate-100 hover:text-white hover:bg-slate-600 disabled:opacity-50"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          disabled={!hasAudio}
          className="h-8 w-8 p-0 text-slate-100 hover:text-white hover:bg-slate-600 disabled:opacity-50"
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          disabled={currentTrackIndex === playlistItems.length - 1}
          className="h-8 w-8 p-0 text-slate-100 hover:text-white hover:bg-slate-600 disabled:opacity-50"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline - only show if current track has audio and duration > 0 */}
      {hasAudio && duration > 0 && (
        <div className="space-y-2">
          <div 
            className="w-full bg-slate-600 rounded-full h-2 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="bg-slate-100 h-full rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-300 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Track list */}
      {playlistItems.length > 1 && (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {playlistItems.map((track, index) => (
            <div
              key={`${track.cardId}-${index}`}
              className={`flex items-center gap-2 p-2 rounded text-xs ${
                index === currentTrackIndex
                  ? 'bg-slate-600 text-slate-100'
                  : 'text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              <span 
                className="w-4 text-center cursor-pointer"
                onClick={() => setCurrentTrackIndex(index)}
              >
                {index + 1}
              </span>
              <a
                href={generateCardUrl(track.cardId)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate cursor-pointer hover:text-slate-100 transition-colors hover:underline"
                title="Click to open card in new tab"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent playlist item selection
                }}
              >
                {track.title || `Track ${index + 1}`}
              </a>
              {!track.audioUrl && (
                <Badge variant="outline" className="text-xs border-slate-500 text-slate-400">
                  No audio
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}