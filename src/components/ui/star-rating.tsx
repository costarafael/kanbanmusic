"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ rating, onRatingChange, readonly = false, size = "sm" }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  const starSize = sizeClasses[size];

  const handleStarClick = (starIndex: number) => {
    if (!readonly && onRatingChange) {
      // If clicking the same star that's already selected, set to 0 (no rating)
      const newRating = rating === starIndex ? 0 : starIndex;
      onRatingChange(newRating);
    }
  };

  const handleStarHover = (starIndex: number) => {
    if (!readonly) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(null);
    }
  };

  const getStarColor = (starIndex: number) => {
    const currentRating = hoverRating !== null ? hoverRating : rating;
    
    if (starIndex <= currentRating) {
      return "text-slate-400 fill-slate-400"; // Filled star - neutral color
    }
    return "text-slate-200"; // Empty star - very light
  };

  return (
    <div 
      className="flex items-center gap-0.5"
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <button
          key={starIndex}
          type="button"
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform duration-150`}
          onClick={() => handleStarClick(starIndex)}
          onMouseEnter={() => handleStarHover(starIndex)}
        >
          <Star 
            className={`${starSize} ${getStarColor(starIndex)} transition-colors duration-150`}
          />
        </button>
      ))}
      {!readonly && (
        <span className="ml-1 text-xs text-muted-foreground">
          {rating > 0 ? rating : ''}
        </span>
      )}
    </div>
  );
}