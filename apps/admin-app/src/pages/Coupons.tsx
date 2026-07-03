import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button, Input, Select, Textarea } from '../components/ui/Form';
import { TableSkeleton, EmptyState, ErrorState } from '../components/ui/States';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@shared/utils/formatters';
import { useToast } from '../context/ToastContext';
import type { Coupon } from '@shared/types/index';

const schema = z.object({
  code: z.string().min(3).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().min(1),
  minOrderValue: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().min(0).optional(),
  expiryDate: z.string().optional(),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});
type FormInput = z.infer<typeof schema>;

const fetchCoupons = async (): Promise<Coupon[]> => {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(c => ({
    id: c.id, code: c.code, discountType: c.discount_type, value: Number(c.value),
    minOrderValue: Number(c.min_order_value), maxUses: c.max_uses,
    usedCount: c.used_count ?? 0, expiryDate: c.expiry_date,
    isActive: c.is_active, description: c.description,
  }));
};

const saveCoupon = async (data: FormInput & { id?: string }) => {
  const payload = {
    code: data.code, discount_type: data.discountType, value: data.value,
    min_order_value: data.minOrderValue, max_uses: data.maxUses || null,
    expiry_date: data.expiryDate || null, is_active: data.isActive,
    description: data.description || null,
  };
  if (data.id) {
    const { error } = await supabase.from('coupons').update(payload).eq('id', data.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('coupons').insert(payload);
    if (error) throw error;
  }
};

const deleteCoupon = async (id: string) => {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) throw error;
};

const Coupons: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: coupons, isLoading, isError, refetch } = useQuery({ queryKey: ['coupons-admin'], queryFn: fetchCoupons });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormInput>({ resolver: zodResolver(schema) as never });
  const discountType = watch('discountType');

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: saveCoupon,
    onSuccess: () => {
      showToast(editId ? 'Coupon updated' : 'Coupon created', 'success');
      qc.invalidateQueries({ queryKey: ['coupons-admin'] });
      setFormOpen(false); setEditId(null); reset();
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => { showToast('Coupon deleted', 'info'); qc.invalidateQueries({ queryKey: ['coupons-admin'] }); },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const openCreate = () => { setEditId(null); reset({ isActive: true, discountType: 'percentage' }); setFormOpen(true); };
  const openEdit = (c: Coupon) => {
    setEditId(c.id ?? null);
    reset({ code: c.code, discountType: c.discountType, value: c.value, minOrderValue: c.minOrderValue, maxUses: c.maxUses, expiryDate: c.expiryDate ?? '', isActive: c.isActive, description: c.description });
    setFormOpen(true);
  };

  const onSubmit = (data: FormInput) => save({ ...data, id: editId ?? undefined });

  return (
    <AdminLayout title="Coupon Management">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openCreate} icon={<Plus size={14} />}>Create Coupon</Button>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          {isLoading ? <TableSkeleton rows={5} cols={6} /> : isError ? <ErrorState onRetry={() => refetch()} /> : !coupons?.length ? (
            <EmptyState title="No coupons yet" icon={<Tag size={40} />} action={<Button onClick={openCreate} icon={<Plus size={14} />}>Create First Coupon</Button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm admin-table">
                <thead>
                  <tr className="border-b border-[--color-border]">
                    {['Code', 'Discount', 'Min Order', 'Usage', 'Expires', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} className="border-b border-[--color-border]/50 last:border-0">
                      <td className="px-4 py-3.5"><span className="font-mono font-bold text-brand-400 text-sm tracking-widest">{c.code}</span></td>
                      <td className="px-4 py-3.5 font-semibold text-[--color-text-primary]">
                        {c.discountType === 'percentage' ? `${c.value}%` : formatCurrency(c.value)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[--color-text-secondary]">{formatCurrency(c.minOrderValue)}</td>
                      <td className="px-4 py-3.5 text-xs text-[--color-text-secondary]">
                        {c.usedCount ?? 0} / {c.maxUses ?? '∞'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[--color-text-secondary]">
                        {c.expiryDate ? formatDate(c.expiryDate) : '—'}
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge label={c.isActive ? 'Active' : 'Inactive'} color={c.isActive ? 'green' : 'zinc'} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)} icon={<Edit size={13} />}>Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => c.id && remove(c.id)} icon={<Trash2 size={13} />}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal open={formOpen} onClose={() => { setFormOpen(false); reset(); }} title={editId ? 'Edit Coupon' : 'Create Coupon'} size="md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Coupon Code" placeholder="IROKI10" error={errors.code?.message} {...register('code')} className="uppercase" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Discount Type" {...register('discountType')}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </Select>
              <Input label={discountType === 'percentage' ? 'Value (%)' : 'Value (₹)'} type="number" step="0.01" error={errors.value?.message} {...register('value')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Min Order Value (₹)" type="number" {...register('minOrderValue')} />
              <Input label="Max Uses (0 = unlimited)" type="number" {...register('maxUses')} />
            </div>
            <Input label="Expiry Date" type="date" {...register('expiryDate')} />
            <Textarea label="Description (optional)" rows={2} {...register('description')} />
            <label className="flex items-center gap-2 text-sm text-[--color-text-secondary]">
              <input type="checkbox" {...register('isActive')} className="rounded accent-brand-500" /> Active
            </label>
            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={saving} className="flex-1">{editId ? 'Update Coupon' : 'Create Coupon'}</Button>
              <Button variant="secondary" type="button" onClick={() => { setFormOpen(false); reset(); }}>Cancel</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Coupons;
