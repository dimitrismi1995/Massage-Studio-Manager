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
