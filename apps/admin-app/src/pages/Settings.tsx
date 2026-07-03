import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Globe } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button, Input, Textarea } from '../components/ui/Form';
import { useToast } from '../context/ToastContext';

const schema = z.object({
  cafe_name: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(6),
  email: z.string().email(),
  gst_number: z.string().optional(),
  delivery_charge: z.coerce.number().min(0),
  free_delivery_above: z.coerce.number().min(0),
  gst_percentage: z.coerce.number().min(0).max(100),
  opening_hours: z.string().optional(),
  instagram_url: z.string().url().optional().or(z.literal('')),
  facebook_url: z.string().url().optional().or(z.literal('')),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});
type FormInput = z.infer<typeof schema>;

const fetchSettings = async (): Promise<FormInput> => {
  const { data } = await supabase.from('settings').select('key, value');
  const map: Record<string, string> = {};
  (data ?? []).forEach(r => { map[r.key] = String(r.value); });
  return {
    cafe_name: map['cafe_name'] ?? 'Cafe Iroki',
    address: map['address'] ?? '',
    phone: map['phone'] ?? '',
    email: map['email'] ?? '',
    gst_number: map['gst_number'] ?? '',
    delivery_charge: Number(map['delivery_charge'] ?? 50),
    free_delivery_above: Number(map['free_delivery_above'] ?? 500),
    gst_percentage: Number(map['gst_percentage'] ?? 5),
    opening_hours: map['opening_hours'] ?? '',
    instagram_url: map['instagram_url'] ?? '',
    facebook_url: map['facebook_url'] ?? '',
    meta_title: map['meta_title'] ?? '',
    meta_description: map['meta_description'] ?? '',
  };
};

const saveSettings = async (data: FormInput) => {
  const upserts = Object.entries(data).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('settings').upsert(upserts, { onConflict: 'key' });
  if (error) throw error;
};

const Settings: React.FC = () => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState('business');

  const { data: settings, isLoading } = useQuery({ queryKey: ['settings-admin'], queryFn: fetchSettings });

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormInput>({
    resolver: zodResolver(schema),
    values: settings,
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => { showToast('Settings saved successfully', 'success'); qc.invalidateQueries({ queryKey: ['settings-admin'] }); },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const sections = [
    { id: 'business', label: 'Business Info' },
    { id: 'delivery', label: 'Delivery & GST' },
    { id: 'social', label: 'Social & SEO' },
  ];

  return (
    <AdminLayout title="Settings">
      <form onSubmit={handleSubmit(d => save(d))}>
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-48 flex-shrink-0">
            <div className="glass rounded-2xl p-2 sticky top-24">
              {sections.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === s.id ? 'bg-brand-500/15 text-brand-400' : 'text-[--color-text-secondary] hover:bg-white/5'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            {activeSection === 'business' && (
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-[--color-text-primary] mb-2">Business Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Cafe Name" error={errors.cafe_name?.message} {...register('cafe_name')} />
                  <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
                </div>
                <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
                <Textarea label="Address" rows={2} error={errors.address?.message} {...register('address')} />
                <Input label="GST Number" placeholder="22AAAAA0000A1Z5" {...register('gst_number')} />
                <Textarea label="Opening Hours" rows={3} placeholder="Mon–Fri: 8am–10pm&#10;Sat–Sun: 9am–11pm" {...register('opening_hours')} />
              </div>
            )}

            {activeSection === 'delivery' && (
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-[--color-text-primary] mb-2">Delivery & Tax</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Delivery Charge (₹)" type="number" step="1" error={errors.delivery_charge?.message} {...register('delivery_charge')} />
                  <Input label="Free Delivery Above (₹)" type="number" step="1" error={errors.free_delivery_above?.message} {...register('free_delivery_above')} />
                </div>
                <Input label="GST Percentage (%)" type="number" step="0.5" error={errors.gst_percentage?.message} {...register('gst_percentage')} />
              </div>
            )}

            {activeSection === 'social' && (
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-[--color-text-primary] mb-2">Social Media & SEO</h3>
                <Input label="Instagram URL" type="url" prefix={<Globe size={14} />} error={errors.instagram_url?.message} {...register('instagram_url')} />
                <Input label="Facebook URL" type="url" prefix={<Globe size={14} />} error={errors.facebook_url?.message} {...register('facebook_url')} />
                <Input label="SEO Title" placeholder="Cafe Iroki | Nagpur" {...register('meta_title')} />
                <Textarea label="SEO Description" rows={2} placeholder="Cafe Iroki – Premium Japanese café experience in Nagpur..." {...register('meta_description')} />
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" loading={isPending || isLoading} disabled={!isDirty} icon={<Save size={14} />}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default Settings;
