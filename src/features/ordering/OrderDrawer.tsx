import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/Button';
import { X, Plus, Minus, Trash2, Ticket, ShoppingBag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const {
    cartItems,
    appliedCoupon,
    subtotal,
    discount,
    gst,
    deliveryCharge,
    total,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setCouponError(null);
    const error = await applyCoupon(couponCode);
    if (error) {
      setCouponError(error);
    } else {
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/45 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md h-full bg-bg-primary text-text-primary shadow-premium-lg border-l border-border-subtle flex flex-col z-10"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-subtle bg-bg-secondary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-brand-primary" />
                <h3 className="text-lg font-serif font-semibold">Your Order Cart</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-bold">
                  {cartItems.reduce((acc, ci) => acc + ci.quantity, 0)} Items
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-full hover:bg-border-subtle/30 transition-colors active:scale-95"
                aria-label="Close cart drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-border-subtle/20 flex items-center justify-center text-text-secondary/60">
                    <ShoppingBag size={28} />
                  </div>
                  <div>
                    <p className="font-serif font-medium text-base text-text-primary">Your cart is empty</p>
                    <p className="text-xs text-text-secondary mt-1">Add items from our premium menu to begin dining.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={onClose} className="mt-2">
                    Browse Menu
                  </Button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center gap-4 p-3 bg-bg-secondary/60 rounded-md border border-border-subtle/40 hover:border-brand-primary/20 transition-smooth"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-sans font-semibold text-text-primary truncate">{item.name}</h4>
                      <p className="text-xs text-brand-primary font-bold mt-1">₹{item.price}</p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 bg-bg-primary rounded border border-border-subtle px-1">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        className="p-1 text-text-secondary hover:text-text-primary active:scale-90"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold w-4 text-center select-none">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        className="p-1 text-text-secondary hover:text-text-primary active:scale-90"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Trash */}
                    <button
                      onClick={() => removeItem(item.menuItemId)}
                      className="text-text-secondary hover:text-rose-500 p-1.5 rounded transition-colors active:scale-95"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions & Total summaries */}
            {cartItems.length > 0 && (
              <div className="border-t border-border-subtle p-6 bg-bg-secondary space-y-4">
                {/* Coupon form */}
                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="flex-1 relative">
                      <Ticket size={16} className="absolute left-3 top-3.5 text-text-secondary/50" />
                      <input
                        type="text"
                        placeholder="Enter Promo Coupon (e.g. IROKI10)"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError(null);
                        }}
                        className="w-full pl-9 pr-4 py-2.5 bg-bg-primary border border-border-subtle rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder-text-secondary/40 font-sans"
                      />
                    </div>
                    <Button variant="outline" size="sm" type="submit" className="text-xs py-2 px-4">
                      Apply
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between p-2.5 bg-accent-gold/10 border border-accent-gold/30 rounded-md text-xs text-text-primary">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-accent-gold animate-pulse" />
                      <span>
                        Coupon <strong>{appliedCoupon.code}</strong> Applied ({appliedCoupon.discountPercentage}% Off)
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-rose-500 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {couponError && <p className="text-xs text-rose-500 mt-1">{couponError}</p>}

                {/* Subtotal calculation row */}
                <div className="space-y-2.5 text-xs text-text-secondary pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-text-primary">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-500">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span className="font-medium text-text-primary">₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="font-medium text-text-primary">
                      {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-text-primary font-bold pt-2.5 border-t border-border-subtle">
                    <span>Total Amount</span>
                    <span className="text-brand-primary text-base">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full mt-4 font-bold shadow-glow-orange hover:shadow-premium-md py-3 text-sm bg-accent-warm"
                  onClick={onCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default OrderDrawer;
