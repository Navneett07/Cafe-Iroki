import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, List, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button, Input } from '../components/ui/Form';
import { TableSkeleton, EmptyState, ErrorState } from '../components/ui/States';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { formatDate } from '@shared/utils/formatters';
import { useToast } from '../context/ToastContext';
import type { Reservation } from '@shared/types/index';

const fetchReservations = async (status: string, date: string): Promise<Reservation[]> => {
  let q = supabase.from('reservations').select('*').order('date', { ascending: false }).order('time');
  if (status !== 'all') q = q.eq('status', status);
  if (date) q = q.eq('date', date);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id, guestName: r.guest_name, email: r.email, phone: r.phone,
    date: r.date, time: r.time, guests: r.guests, location: r.location,
    specialRequests: r.special_requests, status: r.status,
    tableNumber: r.table_number, userId: r.user_id, createdAt: r.created_at,
  }));
};

const updateReservationStatus = async ({ id, status }: { id: string; status: Reservation['status'] }) => {
  const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
  if (error) throw error;
};

const Reservations: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selected, setSelected] = useState<Reservation | null>(null);
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: reservations, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-reservations', statusFilter, dateFilter],
    queryFn: () => fetchReservations(statusFilter, dateFilter),
    refetchInterval: 30000,
  });

  const { mutate: changeStatus, isPending } = useMutation({
    mutationFn: updateReservationStatus,
    onSuccess: () => {
      showToast('Reservation updated', 'success');
      qc.invalidateQueries({ queryKey: ['admin-reservations'] });
      setSelected(null);
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const statusColor = (s: Reservation['status']) =>
    s === 'confirmed' ? 'green' : s === 'cancelled' ? 'red' : 'yellow';

  return (
    <AdminLayout title="Reservation Management">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="max-w-[180px]" />
          <div className="flex gap-2">
            {(['all','pending','confirmed','cancelled'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-[--color-text-secondary] hover:bg-white/5'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="ml-auto">Refresh</Button>
        </div>

        {/* Stats row */}
        {reservations && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pending', count: reservations.filter(r => r.status === 'pending').length, icon: Clock, color: 'text-yellow-400' },
              { label: 'Confirmed', count: reservations.filter(r => r.status === 'confirmed').length, icon: CheckCircle, color: 'text-emerald-400' },
              { label: 'Cancelled', count: reservations.filter(r => r.status === 'cancelled').length, icon: XCircle, color: 'text-red-400' },
            ].map(({ label, count, icon: Icon, color }) => (
              <div key={label} className="glass rounded-2xl p-4 flex items-center gap-3">
                <Icon size={20} className={color} />
                <div>
                  <p className="text-xl font-bold text-[--color-text-primary]">{count}</p>
                  <p className="text-xs text-[--color-text-muted]">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !reservations?.length ? (
            <EmptyState title="No reservations" icon={<Calendar size={40} />} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm admin-table">
                <thead>
                  <tr className="border-b border-[--color-border]">
                    {['Guest', 'Date & Time', 'Party', 'Location', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(res => (
                    <tr key={res.id} className="border-b border-[--color-border]/50 last:border-0">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[--color-text-primary] text-xs">{res.guestName}</p>
                        <p className="text-[--color-text-muted] text-[10px]">{res.email}</p>
                        <p className="text-[--color-text-muted] text-[10px]">{res.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-medium text-[--color-text-primary]">{formatDate(res.date)}</p>
                        <p className="text-xs text-[--color-text-secondary]">{res.time}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[--color-text-primary] font-medium">{res.guests} guests</td>
                      <td className="px-4 py-3.5"><span className="text-xs capitalize text-[--color-text-secondary]">{res.location}</span></td>
                      <td className="px-4 py-3.5"><StatusBadge label={res.status} color={statusColor(res.status)} /></td>
                      <td className="px-4 py-3.5">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(res)} icon={<List size={13} />}>Manage</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Manage Modal */}
        <Modal open={!!selected} onClose={() => setSelected(null)} title={`Reservation – ${selected?.guestName}`} size="md">
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-[--color-text-muted] text-xs mb-0.5">Date & Time</p><p className="text-[--color-text-primary] font-medium">{formatDate(selected.date)} at {selected.time}</p></div>
                <div><p className="text-[--color-text-muted] text-xs mb-0.5">Party Size</p><p className="text-[--color-text-primary] font-medium">{selected.guests} guests</p></div>
                <div><p className="text-[--color-text-muted] text-xs mb-0.5">Location</p><p className="text-[--color-text-primary] font-medium capitalize">{selected.location}</p></div>
                <div><p className="text-[--color-text-muted] text-xs mb-0.5">Phone</p><p className="text-[--color-text-primary] font-medium">{selected.phone}</p></div>
              </div>
              {selected.specialRequests && (
                <div className="bg-white/3 rounded-xl p-3">
                  <p className="text-xs text-[--color-text-muted] mb-1">Special Requests</p>
                  <p className="text-sm text-[--color-text-secondary]">{selected.specialRequests}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {selected.status !== 'confirmed' && (
                  <Button loading={isPending} onClick={() => changeStatus({ id: selected.id, status: 'confirmed' })} icon={<CheckCircle size={14} />} className="flex-1">
                    Confirm
                  </Button>
                )}
                {selected.status !== 'cancelled' && (
                  <Button variant="danger" loading={isPending} onClick={() => changeStatus({ id: selected.id, status: 'cancelled' })} icon={<XCircle size={14} />} className="flex-1">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Reservations;
