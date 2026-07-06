import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListReviews, useUpdateReview, useCreateReview, getListReviewsQueryKey, useListClients, getListClientsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating, StarRatingInput } from '@/components/ui/star-rating';
import { useDateFormatter } from '@/lib/utils';
import { MessageSquareQuote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';

function AddFeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const { data: clients } = useListClients(undefined, { query: { queryKey: getListClientsQueryKey() } });
  const createReview = useCreateReview();

  const reset = () => {
    setClientId('');
    setRating(0);
    setComment('');
  };

  const handleSubmit = () => {
    if (!clientId) return;
    createReview.mutate(
      { data: { clientId: Number(clientId), rating: rating || null, comment: comment || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
          setOpen(false);
          reset();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Client Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>
          <div className="space-y-2">
            <Label>Comment</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did the client say?"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!clientId || createReview.isPending}>
            Save Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ReviewsPage() {
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const { data: reviews, isLoading } = useListReviews({ query: { queryKey: getListReviewsQueryKey() } });
  const updateReview = useUpdateReview();

  const validReviews = reviews?.filter(r => r.rating || r.comment) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t('reviews.title')}</h1>
        <AddFeedbackDialog />
      </div>

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
