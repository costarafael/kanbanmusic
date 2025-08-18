"use client";

import { useAudioStore } from "@/lib/store/useAudioStore";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface MiniPlayerProps {
  audioUrl: string;
  cardId: string;
}

export function MiniPlayer({ audioUrl, cardId }: MiniPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playingCardId, actions } = useAudioStore();
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const isPlaying = playingCardId === cardId;

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
      actions.play(cardId);
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
    <div className="bg-slate-700 p-3 rounded-lg border border-slate-600 space-y-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Progress bar - Always visible at top */}
      <div 
        className="w-full bg-slate-600 rounded-full h-2 cursor-pointer hover:h-3 transition-all duration-200 group"
        onClick={handleProgressClick}
      >
        <div
          className="bg-slate-100 h-full rounded-full transition-all duration-100 group-hover:bg-white"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          className="h-8 w-8 p-0 flex items-center justify-center text-slate-100 hover:text-white hover:bg-slate-600"
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
          className="h-8 w-8 p-0 flex items-center justify-center text-slate-100 hover:text-white hover:bg-slate-600"
        >
          {/* Filled Square Icon */}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h12v12H6z"/>
          </svg>
        </Button>

        <div className="flex-1 text-xs text-slate-100 font-mono">
          {formatTime(currentTime)} / {formatTime(duration || 0)}
        </div>
      </div>

    </div>
  );
}
