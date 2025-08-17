"use client";

import { useAudioStore } from "@/lib/store/useAudioStore";
import { Play, Pause, Square } from "lucide-react";
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
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="bg-muted p-3 rounded-lg border space-y-2">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          className="h-8 w-8 p-0 flex items-center justify-center"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          className="h-8 w-8 p-0 flex items-center justify-center"
        >
          <Square className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-xs text-muted-foreground font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Progress bar */}
      <div 
        className="w-full bg-secondary rounded-full h-2 cursor-pointer hover:h-3 transition-all duration-200"
        onClick={handleProgressClick}
      >
        <div
          className="bg-primary h-full rounded-full transition-all duration-100"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

    </div>
  );
}
