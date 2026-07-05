import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/components/ui/button';

export function StarRating({ rating, className }: { rating: number, className?: string }) {
  return (
    <div className={cn("flex items-center space-x-1 text-yellow-400", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn("h-4 w-4", star <= rating ? "fill-current" : "text-gray-300")}
        />
      ))}
    </div>
  );
}

export function StarRatingInput({ value, onChange, className }: { value: number, onChange: (rating: number) => void, className?: string }) {
  return (
    <div className={cn("flex items-center space-x-1 text-yellow-400", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={cn("h-6 w-6 cursor-pointer transition-colors", star <= value ? "fill-current" : "text-gray-300")}
          />
        </button>
      ))}
    </div>
  );
}
