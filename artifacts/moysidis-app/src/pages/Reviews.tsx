import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListReviews, useUpdateReview, getListReviewsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { useDateFormatter } from '@/lib/utils';
import { MessageSquareQuote } from 'lucide-react';

export default function ReviewsPage() {
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const { data: reviews, isLoading } = useListReviews({ query: { queryKey: getListReviewsQueryKey() } });
  const updateReview = useUpdateReview();

  const validReviews = reviews?.filter(r => r.rating || r.comment) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-primary">{t('reviews.title')}</h1>
      
      {isLoading ? (
        <div className="text-muted-foreground">Loading reviews...</div>
      ) : validReviews.length === 0 ? (
        <div className="p-12 text-center border rounded-lg bg-card">
          <MessageSquareQuote className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No reviews received yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {validReviews.map(review => (
            <Card key={review.id} className="overflow-hidden flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-base">{review.clientName || 'Anonymous'}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(review.createdAt)}</p>
                  </div>
                  {review.rating && <StarRating rating={review.rating} />}
                </div>
                
                {review.comment ? (
                  <p className="text-sm italic text-muted-foreground leading-relaxed flex-1">
                    "{review.comment}"
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground/50 flex-1">No comment provided.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
