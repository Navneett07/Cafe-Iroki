import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { menuService } from '../../services/menuService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import type { MenuItem } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Reveal } from '../../components/Animation/Reveal';
import { Search, Heart, ShoppingCart, Leaf, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'Full Menu' },
  { value: 'hot-coffee', label: 'Hot Coffee' },
  { value: 'cold-coffee', label: 'Iced Coffee' },
  { value: 'cold-brew', label: 'Cold Brew' },
  { value: 'matcha', label: 'Matcha Uji' },
  { value: 'small-plates', label: 'Small Plates' },
  { value: 'bowl', label: 'Bowls & Ramen' },
  { value: 'ufo-burgers', label: 'UFO Burgers' },
  { value: 'taiyaki', label: 'Taiyaki Waffles' },
];

export const Menu: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { addItem, toggleFavorite, isFavorite } = useCart();
  const { showToast } = useToast();

  const fetchMenu = useCallback(async () => {
    try {
      const menuData = await menuService.getMenuItems();
      setItems(menuData);
    } catch (err) {
      console.error('Error fetching menu items', err);
      showToast('Failed to load menu. Please retry.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Realtime: admin add/remove/price/stock changes reflect instantly (public read RLS).
  useRealtimeChannel({
    channel: 'menu-items-public',
    table: 'menu_items',
    event: '*',
    onChange: fetchMenu,
    onResync: fetchMenu,
  });

  // Memoized filtering logic
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      
      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [items, selectedCategory, searchQuery]);

  const handleQtyChange = (itemId: string, val: number) => {
    if (val < 1) return;
    setQuantities((prev) => ({ ...prev, [itemId]: val }));
  };

  const handleAddToCart = (item: MenuItem) => {
    const qty = quantities[item.id] || 1;
    addItem(item, qty);
    showToast(`Added ${qty}x ${item.name} to cart.`, 'success');
    // Reset local quantity count
    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
  };

  return (
    <div className="pt-28 pb-24 bg-bg-primary text-text-primary min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-10">
        
        {/* Header Title */}
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
            Curated Taste of Japan
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-tight">
            Our Premium Menu
          </h1>
          <p className="text-xs text-text-secondary max-w-md">
            Freshly prepared Pan-Asian delights, signature sealed burgers, and Kyoto ceremonial green tea.
          </p>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border-b border-border-subtle pb-6">
          {/* Scrollable Categories List */}
          <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto py-2 scrollbar-none select-none">
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

          {/* Search bar */}
          <div className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3.5 top-3.5 text-text-secondary/50" />
            <input
              type="text"
              placeholder="Search dishes or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 placeholder-text-secondary/40 font-sans"
            />
          </div>
        </div>

        {/* Dynamic Items Render */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-lg text-text-secondary">No dishes match your criteria.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-xs uppercase tracking-wider font-bold text-brand-primary hover:underline mt-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredItems.map((item) => {
              const currentQty = quantities[item.id] || 1;
              const isFavoriteItem = isFavorite(item.id);
              const soldOut = item.isInStock === false;

              return (
                <Reveal key={item.id} direction="up" duration={0.6}>
                  <Card
                    variant={item.isPopular ? 'glow' : 'premium'}
                    hover3dTilt={true}
                    className="flex flex-col gap-4 p-4 h-full relative group hover:border-accent-gold/45"
                  >
                    {/* Media Slot */}
                    <div className="aspect-[4/3] rounded overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${soldOut ? 'grayscale opacity-60' : ''}`}
                        loading="lazy"
                      />

                      {/* Sold out overlay (realtime stock) */}
                      {soldOut && (
                        <span className="absolute inset-0 flex items-center justify-center bg-brand-dark/50">
                          <span className="bg-rose-600 text-white text-[10px] uppercase tracking-widest font-extrabold px-3 py-1.5 rounded shadow-premium-sm">
                            Sold Out
                          </span>
                        </span>
                      )}

                      {/* Popular ribbon */}
                      {item.isPopular && (
                        <span className="absolute top-3 left-3 bg-accent-gold text-bg-primary text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded shadow-premium-sm flex items-center gap-1">
                          <Sparkles size={10} className="animate-pulse" />
                          <span>Popular</span>
                        </span>
                      )}

                      {/* Favorite Button Overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                          showToast(
                            isFavoriteItem ? `Removed ${item.name} from favorites.` : `Saved ${item.name} to favorites.`,
                            'info'
                          );
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 hover:scale-105 border ${
                          isFavoriteItem
                            ? 'bg-rose-500/80 border-rose-500 text-white shadow-glow-orange'
                            : 'bg-brand-dark/40 border-white/20 text-white/80 hover:text-white'
                        }`}
                        aria-label={isFavoriteItem ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
                      >
                        <Heart size={14} fill={isFavoriteItem ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* Information */}
                    <div className="flex flex-col gap-2 pt-1 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif font-bold text-base leading-snug group-hover:text-brand-primary transition-colors">
                          {item.name}
                        </h3>
                        {item.isVegetarian && (
                          <span className="flex-shrink-0 mt-0.5 p-0.5 rounded border border-green-600/40 text-[9px] font-bold text-green-600 flex items-center gap-1 scale-90">
                            <Leaf size={10} fill="currentColor" />
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed flex-1">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 bg-border-subtle/30 text-text-secondary rounded">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Footer buying actions */}
                      <div className="flex items-center justify-between border-t border-border-subtle/40 pt-4 mt-2">
                        <span className="text-sm font-serif font-black text-brand-primary">
                          ₹{item.price}
                        </span>

                        {soldOut ? (
                          <span className="text-[10px] uppercase tracking-widest font-bold text-rose-600">
                            Unavailable
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                            {/* Qty controls */}
                            <div className="flex items-center gap-2 border border-border-subtle rounded px-1.5 py-0.5 bg-bg-primary text-xs">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(item.id, currentQty - 1)}
                                className="text-text-secondary hover:text-text-primary px-1 font-bold cursor-pointer"
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                -
                              </button>
                              <span className="w-4 text-center font-bold">{currentQty}</span>
                              <button
                                type="button"
                                onClick={() => handleQtyChange(item.id, currentQty + 1)}
                                className="text-text-secondary hover:text-text-primary px-1 font-bold cursor-pointer"
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                +
                              </button>
                            </div>

                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1.5 font-bold"
                              onClick={() => handleAddToCart(item)}
                            >
                              <ShoppingCart size={12} />
                              <span>Add</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
export default Menu;
