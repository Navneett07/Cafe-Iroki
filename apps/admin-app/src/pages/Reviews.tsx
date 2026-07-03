import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/ui/Form';
import { EmptyState, ErrorState } from '../components/ui/States';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatDateTime } from '@shared/utils/formatters';
import { useToast } from '../context/ToastContext';
import type { Review } from '@shared/types/index';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

const fetchReviews = async (status: ReviewStatus | 'all'): Promise<Review[]> => {
  let q = supabase.from('reviews').select('*').order('created_at', { ascending: false });
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id, authorName: r.author_name, avatar: r.avatar_url,
    rating: r.rating, relativeTime: r.created_at, text: r.text,
    tags: r.tags, status: r.status, createdAt: r.created_at, userId: r.user_id,
  }));
};

const updateReview = async ({ id, status }: { id: string; status: ReviewStatus }) => {
  const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
  if (error) throw error;
};

const deleteReview = async (id: string) => {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
};

const Reviews: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: reviews, isLoading, isError, refetch } = useQuery({
    queryKey: ['reviews-admin', statusFilter],
    queryFn: () => fetchReviews(statusFilter),
    refetchInterval: 30000,
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: updateReview,
    onSuccess: () => { showToast('Review updated', 'success'); qc.invalidateQueries({ queryKey: ['reviews-admin'] }); },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => { showToast('Review deleted', 'info'); qc.invalidateQueries({ queryKey: ['reviews-admin'] }); },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const StarRow: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'} />
      ))}
    </div>
  );

  return (
    <AdminLayout title="Review Management">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${statusFilter === s ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-[--color-text-secondary] hover:bg-white/5'}`}
            >
              {s}
            </button>
          ))}
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="ml-auto">Refresh</Button>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !reviews?.length ? (
          <EmptyState title="No reviews" description="Reviews will appear here once customers submit them." icon={<Star size={40} />} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(review => (
              <div key={review.id} className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-500/15 flex items-center justify-center text-brand-400 text-sm font-bold flex-shrink-0">
                      {review.authorName?.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[--color-text-primary]">{review.authorName}</p>
                      <p className="text-xs text-[--color-text-muted]">{formatDateTime(review.createdAt ?? '')}</p>
                    </div>
                  </div>
                  <StatusBadge
                    label={review.status ?? 'pending'}
                    color={review.status === 'approved' ? 'green' : review.status === 'rejected' ? 'red' : 'yellow'}
                  />
                </div>
                <StarRow rating={review.rating} />
                <p className="text-sm text-[--color-text-secondary] leading-relaxed line-clamp-3">{review.text}</p>
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {review.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-1 border-t border-[--color-border]">
                  {review.status !== 'approved' && (
                    <Button variant="ghost" size="sm" onClick={() => changeStatus({ id: review.id, status: 'approved' })} icon={<CheckCircle size={13} />} className="text-emerald-400 hover:bg-emerald-500/10">Approve</Button>
                  )}
                  {review.status !== 'rejected' && (
                    <Button variant="ghost" size="sm" onClick={() => changeStatus({ id: review.id, status: 'rejected' })} icon={<XCircle size={13} />} className="text-yellow-400 hover:bg-yellow-500/10">Reject</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => remove(review.id)} icon={<Trash2 size={13} />} className="text-red-400 hover:bg-red-500/10 ml-auto">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Reviews;
