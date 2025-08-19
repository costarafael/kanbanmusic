"use client";

import { useAudioStore } from "@/lib/store/useAudioStore";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface CompactPlayerProps {
  audioUrl: string;
  cardId: string;
}

export function CompactPlayer({ audioUrl, cardId }: CompactPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playing, actions } = useAudioStore();
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const isPlaying = playing?.cardId === cardId && playing?.playerId === 'compact';

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(console.error);
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying]);

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
      actions.stop();
      setCurrentTime(0);
    };

    const handleError = () => {
      console.error("Audio failed to load");
      actions.stop();
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
  }, [actions, audioUrl]);

  const handlePlay = () => {
    if (isPlaying) {
      actions.pause();
    } else {
      actions.play(cardId, 'compact');
    }
  };

  const handleStop = () => {
    actions.stop();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * (duration || 100); // Allow clicking even without duration
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className={`relative overflow-hidden ${
      isPlaying 
        ? 'bg-gradient-to-r from-purple-900/80 via-blue-800/80 to-pink-800/80 animate-gradient-x' 
        : 'bg-slate-700'
    }`} style={{ borderRadius: '0 0 8px 8px' }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Horizontal layout with controls, timeline and time */}
      <div className="flex items-center gap-2 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          className="h-6 w-6 p-0 flex items-center justify-center text-slate-100 hover:text-white rounded-md flex-shrink-0"
          style={{ backgroundColor: isPlaying ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }}
        >
          {isPlaying ? (
            // Filled Pause Icon
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            // Filled Play Icon  
            <svg className="h-4 w-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          className="h-6 w-6 p-0 flex items-center justify-center text-slate-100 hover:text-white rounded-md flex-shrink-0"
          style={{ backgroundColor: 'transparent' }}
        >
          {/* Filled Square Icon */}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h12v12H6z"/>
          </svg>
        </Button>

        <div 
          className="flex-1 bg-slate-600 rounded-full h-2 cursor-pointer mx-1"
          onClick={handleProgressClick}
        >
          <div
            className="bg-slate-100 h-full rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Time display inline */}
        <div className="text-xs text-slate-300 font-mono text-center leading-none whitespace-nowrap">
          {formatTime(currentTime)} / {formatTime(duration || 0)}
        </div>
      </div>
    </div>
  );
}