import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/ui/Form';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useToast } from '../context/ToastContext';

type Bucket = 'gallery' | 'menu-images' | 'banners';

interface StorageFile {
  name: string;
  url: string;
  path: string;
  size?: number;
}

const fetchFiles = async (bucket: Bucket): Promise<StorageFile[]> => {
  const { data, error } = await supabase.storage.from(bucket).list('', { limit: 100 });
  if (error) throw error;
  return (data ?? [])
    .filter(f => !f.name.startsWith('.'))
    .map(f => {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(f.name);
      return { name: f.name, url: urlData.publicUrl, path: f.name, size: f.metadata?.size };
    });
};

const deleteFile = async ({ bucket, path }: { bucket: Bucket; path: string }) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};

const compressImage = async (file: File, maxSizeMB = 1): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (blob) {
            const compressed = new File([blob], file.name, { type: 'image/webp' });
            resolve(compressed.size > maxSizeMB * 1024 * 1024 ? compressed : compressed);
          } else resolve(file);
        }, 'image/webp', 0.82);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const Media: React.FC = () => {
  const [activeBucket, setActiveBucket] = useState<Bucket>('gallery');
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: files, isLoading, isError, refetch } = useQuery({
    queryKey: ['media', activeBucket],
    queryFn: () => fetchFiles(activeBucket),
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => { showToast('File deleted', 'info'); qc.invalidateQueries({ queryKey: ['media', activeBucket] }); },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const compressed = await compressImage(file);
        const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error } = await supabase.storage.from(activeBucket).upload(name, compressed, { upsert: false });
        if (error) throw error;
      }
      showToast(`${files.length} file(s) uploaded`, 'success');
      qc.invalidateQueries({ queryKey: ['media', activeBucket] });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const buckets: Bucket[] = ['gallery', 'menu-images', 'banners'];
  const formatBytes = (b?: number) => b ? `${(b / 1024).toFixed(0)} KB` : '';

  return (
    <AdminLayout title="Media Management">
      <div className="space-y-4">
        {/* Bucket tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {buckets.map(b => (
            <button
              key={b}
              onClick={() => setActiveBucket(b)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${activeBucket === b ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-[--color-text-secondary] hover:bg-white/5'}`}
            >
              {b}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => refetch()} icon={<RefreshCw size={14} />}>Refresh</Button>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
              <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[--radius-btn] bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/25 transition-all cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <Upload size={14} />}
                Upload to {activeBucket}
              </span>
            </label>
          </div>
        </div>

        {/* Drop zone hint */}
        <div className="border-2 border-dashed border-[--color-border] rounded-2xl p-6 text-center">
          <label className="cursor-pointer block">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
            <ImageIcon size={32} className="text-[--color-text-muted] mx-auto mb-2" />
            <p className="text-sm text-[--color-text-secondary]">Click or drag images here to upload to <span className="text-brand-400 font-semibold">{activeBucket}</span></p>
            <p className="text-xs text-[--color-text-muted] mt-1">Images are auto-compressed to WebP before upload</p>
          </label>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton aspect-square rounded-xl" />)}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !files?.length ? (
          <EmptyState title={`No files in ${activeBucket}`} description="Upload images using the button above." icon={<ImageIcon size={40} />} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map(file => (
              <div key={file.path} className="group relative rounded-xl overflow-hidden glass aspect-square">
                <img
                  src={file.url}
                  alt={file.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 p-2">
                  <p className="text-[10px] text-white/80 text-center line-clamp-2">{file.name}</p>
                  {file.size && <p className="text-[10px] text-white/50">{formatBytes(file.size)}</p>}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => remove({ bucket: activeBucket, path: file.path })}
                    icon={<Trash2 size={12} />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Media;
