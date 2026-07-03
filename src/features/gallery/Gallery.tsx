import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Reveal } from '../../components/Animation/Reveal';
import { Maximize2, Sparkles } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

interface GalleryItem {
  id: string;
  category: 'food' | 'coffee' | 'interior' | 'events';
  title: string;
  desc: string;
  image: string;
  span?: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All Vibe' },
  { value: 'food', label: 'Food Items' },
  { value: 'coffee', label: 'Coffee & Matcha' },
  { value: 'interior', label: 'Cozy Interior' },
  { value: 'events', label: 'Events & Culture' },
];

export const Gallery: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);

  // Fetch gallery images from Supabase
  useEffect(() => {
    const fetchGallery = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('gallery_images')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        const items: GalleryItem[] = (data || []).map((db: any) => ({
          id: db.id,
          category: db.category,
          title: db.title,
          desc: db.description,
          image: db.image_url,
          span: db.span_config || 'md:col-span-1 md:row-span-1',
        }));

        setGalleryItems(items);
      } catch (err) {
        console.error('Error fetching gallery images from Supabase database:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredItems = useMemo(() => {
    return galleryItems.filter(
      (item) => selectedCategory === 'all' || item.category === selectedCategory
    );
  }, [galleryItems, selectedCategory]);

  return (
    <div className="pt-28 pb-24 bg-bg-primary text-text-primary min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-10">
        
        {/* Header Title */}
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
            Pinterest Aesthetics
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-tight">
            The Iroki Vibe Gallery
          </h1>
          <p className="text-xs text-text-secondary max-w-md">
            Take a visual tour through our authentic Japanese interiors, fresh craft plates, and brewing workshops.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-center gap-2.5 overflow-x-auto w-full py-2 border-b border-border-subtle select-none scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`text-xs uppercase font-bold tracking-wider px-4 py-2 rounded-full border transition-all flex-shrink-0 cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-brand-primary border-brand-primary text-white'
                  : 'bg-bg-secondary border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Pinterest Masonry Grid / Loading skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">
            <div className="bg-bg-secondary animate-pulse rounded-md md:col-span-2 md:row-span-2" />
            <div className="bg-bg-secondary animate-pulse rounded-md md:col-span-1 md:row-span-1" />
            <div className="bg-bg-secondary animate-pulse rounded-md md:col-span-1 md:row-span-2" />
            <div className="bg-bg-secondary animate-pulse rounded-md md:col-span-1 md:row-span-1" />
            <div className="bg-bg-secondary animate-pulse rounded-md md:col-span-2 md:row-span-1" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-secondary text-sm">No images found in the gallery collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">
            {filteredItems.map((item, idx) => (
              <Reveal
                key={item.id}
                direction="up"
                delay={idx * 0.05}
                className={item.span || 'md:col-span-1 md:row-span-1'}
              >
                <div 
                  className="group relative w-full h-full rounded-md overflow-hidden cursor-pointer border border-border-subtle/30 shadow-premium-sm"
                  onClick={() => setActiveImage(item)}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Subtle dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-end p-4 text-white" />
                  
                  <div className="absolute bottom-4 left-4 right-4 z-20 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 text-white pointer-events-none">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-accent-gold flex items-center gap-1">
                      <Sparkles size={10} />
                      {item.category}
                    </span>
                    <h3 className="text-sm font-serif font-bold mt-1 truncate">{item.title}</h3>
                    <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">{item.desc}</p>
                  </div>

                  <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 rounded-full bg-brand-dark/40 text-white backdrop-blur-sm border border-white/10">
                    <Maximize2 size={12} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* Zoom Lightbox Modal */}
        <Modal
          isOpen={!!activeImage}
          onClose={() => setActiveImage(null)}
          title={activeImage?.title || 'Gallery View'}
        >
          {activeImage && (
            <div className="space-y-4 text-center">
              <div className="rounded-md overflow-hidden border border-border-subtle max-h-[70vh] bg-black">
                <img
                  src={activeImage.image}
                  alt={activeImage.title}
                  className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                />
              </div>
              <div className="space-y-1 text-left px-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-primary">
                  {activeImage.category}
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {activeImage.desc}
                </p>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
};

export default Gallery;
