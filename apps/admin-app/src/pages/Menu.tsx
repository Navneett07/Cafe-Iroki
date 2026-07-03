import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button, Input, Select, Textarea } from '../components/ui/Form';
import { TableSkeleton, EmptyState, ErrorState } from '../components/ui/States';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency } from '@shared/utils/formatters';
import { useToast } from '../context/ToastContext';
import type { MenuItem } from '@shared/types/index';

const schema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(2, 'Name required'),
  description: z.string().min(10, 'Description required'),
  price: z.coerce.number().min(1),
  category: z.string().min(1, 'Category required'),
  stock: z.coerce.number().min(0).default(50),
  isVegetarian: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  available: z.boolean().default(true),
  tags: z.string().default(''),
  image: z.string().default(''),
});
type FormInput = z.infer<typeof schema>;

const CATEGORIES = [
  'hot-coffee','cold-coffee','matcha','cold-brew','tea',
  'shakes','coolers','small-plates','bowl','ufo-burgers','taiyaki'
];

const fetchMenuItems = async (search: string, category: string): Promise<MenuItem[]> => {
  let q = supabase.from('menu_items').select('*').order('category').order('name');
  if (search.trim()) q = q.ilike('name', `%${search}%`);
  if (category !== 'all') q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    price: Number(m.price),
    category: m.category,
    image: m.image_url ?? '',
    tags: m.tags ?? [],
    isVegetarian: m.is_vegetarian ?? false,
    isPopular: m.is_popular ?? false,
    stock: m.stock ?? 0,
    available: m.available ?? true,
  }));
};

const saveMenuItem = async (input: FormInput & { id?: string }) => {
  const payload = {
    name: input.name,
    description: input.description,
    price: input.price,
    category: input.category,
    stock: input.stock,
    is_vegetarian: input.isVegetarian,
    is_popular: input.isPopular,
    available: input.available,
    tags: input.tags.split(',').map(t => t.trim()).filter(Boolean),
    image_url: input.image,
  };

  if (input.id) {
    const { error } = await supabase.from('menu_items').update(payload).eq('id', input.id);
    if (error) throw error;
  } else {
    const id = input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { error } = await supabase.from('menu_items').insert({ id, ...payload });
    if (error) throw error;
  }
};

const deleteMenuItem = async (id: string) => {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
};

const Menu: React.FC = () => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: items, isLoading, isError, refetch } = useQuery({
    queryKey: ['menu-items-admin', search, catFilter],
    queryFn: () => fetchMenuItems(search, catFilter),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInput>({
    resolver: zodResolver(schema) as never,
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: saveMenuItem,
    onSuccess: () => {
      showToast(editingItem ? 'Item updated' : 'Item created', 'success');
      qc.invalidateQueries({ queryKey: ['menu-items-admin'] });
      setFormOpen(false);
      setEditingItem(null);
      reset();
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const { mutate: deleteItem } = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      showToast('Item deleted', 'info');
      qc.invalidateQueries({ queryKey: ['menu-items-admin'] });
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const openCreate = () => { setEditingItem(null); reset({}); setFormOpen(true); };
  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    reset({
      id: item.id, name: item.name, description: item.description,
      price: item.price, category: item.category, stock: item.stock ?? 50,
      isVegetarian: item.isVegetarian, isPopular: item.isPopular ?? false,
      available: item.available ?? true, tags: (item.tags ?? []).join(', '),
      image: item.image,
    });
    setFormOpen(true);
  };

  const onSubmit = (data: FormInput) => save({ ...data, id: editingItem?.id });

  return (
    <AdminLayout title="Menu Management">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} prefix={<Search size={15} />} className="max-w-xs" />
          <Select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="max-w-[180px]">
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <div className="ml-auto">
            <Button onClick={openCreate} icon={<Plus size={14} />}>Add Item</Button>
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !items?.length ? (
            <EmptyState title="No menu items" icon={<Package size={40} />} action={<Button onClick={openCreate} icon={<Plus size={14} />}>Add First Item</Button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm admin-table">
                <thead>
                  <tr className="border-b border-[--color-border]">
                    {['Item', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-[--color-border]/50 last:border-0">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {item.image && <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />}
                          <div>
                            <p className="font-medium text-[--color-text-primary] text-xs">{item.name}</p>
                            <p className="text-[--color-text-muted] text-[10px] truncate max-w-[200px]">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-xs text-[--color-text-secondary]">{item.category}</span></td>
                      <td className="px-4 py-3.5 font-semibold text-[--color-text-primary] text-sm">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium ${(item.stock ?? 0) < 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {item.stock ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge label={item.available ? 'Available' : 'Unavailable'} color={item.available ? 'green' : 'red'} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)} icon={<Edit size={13} />}>Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => deleteItem(item.id)} icon={<Trash2 size={13} />}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Modal */}
        <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditingItem(null); reset(); }} title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'} size="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Item Name" error={errors.name?.message} {...register('name')} />
              <Select label="Category" error={errors.category?.message} {...register('category')}>
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <Textarea label="Description" rows={2} error={errors.description?.message} {...register('description')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (₹)" type="number" step="0.01" error={errors.price?.message} {...register('price')} />
              <Input label="Stock Count" type="number" error={errors.stock?.message} {...register('stock')} />
            </div>
            <Input label="Image URL" placeholder="https://..." error={errors.image?.message} {...register('image')} />
            <Input label="Tags (comma-separated)" placeholder="popular, spicy, veg" {...register('tags')} />
            <div className="flex flex-wrap gap-4">
              {(['isVegetarian', 'isPopular', 'available'] as const).map(field => (
                <label key={field} className="flex items-center gap-2 text-sm text-[--color-text-secondary] cursor-pointer">
                  <input type="checkbox" {...register(field)} className="rounded accent-brand-500" />
                  {field === 'isVegetarian' ? 'Vegetarian' : field === 'isPopular' ? 'Popular' : 'Available'}
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={saving} className="flex-1">{editingItem ? 'Update Item' : 'Create Item'}</Button>
              <Button variant="secondary" type="button" onClick={() => { setFormOpen(false); reset(); }}>Cancel</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Menu;
