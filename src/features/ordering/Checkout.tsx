import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Reveal } from '../../components/Animation/Reveal';
import { ShoppingBag, ArrowLeft, ShieldCheck, QrCode, CreditCard } from 'lucide-react';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const phoneRegex = /^[6-9]\d{9}$/;

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit mobile number.'),
  street: z.string().min(6, 'Please enter a complete street address.'),
  landmark: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['upi', 'card', 'cod']),
});

type CheckoutFormInput = z.infer<typeof checkoutSchema>;

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { cartItems, subtotal, discount, gst, deliveryCharge, total, clearCart } = useCart();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [createdOrderPayload, setCreatedOrderPayload] = useState<any>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && !createdOrderPayload) {
      showToast('Your shopping cart is empty.', 'warning');
      navigate('/menu');
    }
  }, [cartItems, navigate, showToast, createdOrderPayload]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'upi',
    },
  });

  const selectedPaymentMethod = watch('paymentMethod');

  const onSubmit = async (data: CheckoutFormInput) => {
    setCheckoutLoading(true);
    try {
      const orderPayload = {
        items: cartItems,
        subtotal,
        discount,
        gst,
        deliveryCharge,
        total,
        deliveryAddress: {
          fullName: data.fullName,
          phone: data.phone,
          street: data.street,
          landmark: data.landmark,
          notes: data.notes,
        },
        paymentMethod: data.paymentMethod,
      };

      setCreatedOrderPayload(orderPayload);

      // If COD: Proceed directly
      if (data.paymentMethod === 'cod') {
        const orderData = {
          ...orderPayload,
          paymentStatus: 'pending' as const,
        };
        await finalizeOrder(orderData);
      } else {
        // UPI / Card: Open Razorpay checkout portal
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          showToast('Failed to load Razorpay checkout SDK. Please retry.', 'error');
          setCheckoutLoading(false);
          return;
        }

        const options = {
          key: (import.meta.env.VITE_RAZORPAY_KEY as string) || 'rzp_test_placeholder_key',
          amount: Math.round(total * 100), // amount in paise
          currency: 'INR',
          name: 'Cafe Iroki',
          description: 'Nagpur Premium Japanese Experience',
          image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100&auto=format&fit=crop&q=80',
          handler: async function (response: any) {
            const paidOrderData = {
              ...orderPayload,
              paymentId: response.razorpay_payment_id,
              paymentStatus: 'paid' as const,
            };
            await finalizeOrder(paidOrderData);
          },
          prefill: {
            name: data.fullName,
            contact: data.phone,
            email: user?.email || '',
          },
          theme: {
            color: '#8C6239',
          },
          modal: {
            ondismiss: function() {
              setCheckoutLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to checkout. Please check form parameters.', 'error');
      setCheckoutLoading(false);
    }
  };

  const finalizeOrder = async (orderData: any) => {
    try {
      const order = await orderService.createOrder(orderData);
      clearCart();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#8C6239', '#C5A880', '#E07A5F'],
      });
      showToast('Order placed successfully!', 'success');
      navigate(`/track/${order.id}`);
    } catch (err) {
      console.error(err);
      showToast('Order finalization failed.', 'error');
    }
  };

  if (cartItems.length === 0 && !createdOrderPayload) return null;

  return (
    <div className="pt-28 pb-24 bg-bg-primary text-text-primary min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-8">
        
        {/* Back button */}
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-text-secondary hover:text-brand-primary font-bold transition-colors cursor-pointer mr-auto"
        >
          <ArrowLeft size={14} />
          <span>Back to Menu</span>
        </button>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
            Secure Checkouts
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight leading-tight">
            Checkout Your Feast
          </h1>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-4">
          
          {/* Left Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 space-y-6">
            <Reveal direction="left">
              <Card variant="premium" className="p-6 md:p-8 space-y-6">
                <h3 className="text-base font-serif font-bold border-b border-border-subtle pb-3 flex items-center gap-2">
                  <span>1. Delivery Coordinates</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="Recipient name"
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                  <Input
                    label="Mobile Number"
                    type="tel"
                    placeholder="10-digit mobile"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>

                <Input
                  label="Street Address (Nagpur Area)"
                  placeholder="Apartment name, building number, street name"
                  error={errors.street?.message}
                  {...register('street')}
                />

                <Input
                  label="Landmark (Optional)"
                  placeholder="Near metro station, circle, gate..."
                  error={errors.landmark?.message}
                  {...register('landmark')}
                />

                <Input
                  label="Delivery Instructions (Optional)"
                  multiline={true}
                  rows={2}
                  placeholder="Leave at gate, ring bell..."
                  error={errors.notes?.message}
                  {...register('notes')}
                />
              </Card>
            </Reveal>

            <Reveal direction="left" delay={0.15}>
              <Card variant="premium" className="p-6 md:p-8 space-y-6">
                <h3 className="text-base font-serif font-bold border-b border-border-subtle pb-3 flex items-center gap-2">
                  <span>2. Payment Option</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className={`flex flex-col items-center justify-center p-4 border rounded-md cursor-pointer transition-smooth select-none ${
                    selectedPaymentMethod === 'upi'
                      ? 'border-accent-gold bg-accent-gold/10 text-text-primary'
                      : 'border-border-subtle hover:bg-bg-secondary text-text-secondary'
                  }`}>
                    <input type="radio" value="upi" {...register('paymentMethod')} className="sr-only" />
                    <QrCode size={20} className="mb-2 text-brand-primary" />
                    <span className="text-xs font-bold font-sans">UPI QR Code</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-4 border rounded-md cursor-pointer transition-smooth select-none ${
                    selectedPaymentMethod === 'card'
                      ? 'border-accent-gold bg-accent-gold/10 text-text-primary'
                      : 'border-border-subtle hover:bg-bg-secondary text-text-secondary'
                  }`}>
                    <input type="radio" value="card" {...register('paymentMethod')} className="sr-only" />
                    <CreditCard size={20} className="mb-2 text-brand-primary" />
                    <span className="text-xs font-bold font-sans">Debit / Card</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-4 border rounded-md cursor-pointer transition-smooth select-none ${
                    selectedPaymentMethod === 'cod'
                      ? 'border-accent-gold bg-accent-gold/10 text-text-primary'
                      : 'border-border-subtle hover:bg-bg-secondary text-text-secondary'
                  }`}>
                    <input type="radio" value="cod" {...register('paymentMethod')} className="sr-only" />
                    <span className="text-xl mb-1.5 leading-none">💵</span>
                    <span className="text-xs font-bold font-sans">Cash on Delivery</span>
                  </label>
                </div>
              </Card>
            </Reveal>
          </form>

          {/* Right Summary */}
          <div className="lg:col-span-5">
            <Reveal direction="right">
              <Card variant="glow" className="p-6 space-y-6">
                <h3 className="text-base font-serif font-bold border-b border-border-subtle pb-3 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-brand-primary" />
                  <span>Order Summary</span>
                </h3>

                {/* Items loop */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                  {cartItems.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between text-xs py-1 border-b border-border-subtle/30">
                      <span className="truncate max-w-[200px]">
                        <strong>{item.quantity}x</strong> {item.name}
                      </span>
                      <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals panel */}
                <div className="space-y-2.5 text-xs text-text-secondary pt-2 border-t border-border-subtle/50">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-text-primary">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
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

                {/* Submit button */}
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full mt-2 font-bold py-3.5 text-sm bg-accent-warm shadow-glow-orange hover:shadow-premium-md"
                  onClick={handleSubmit(onSubmit)}
                  isLoading={checkoutLoading}
                >
                  Confirm Order & Pay
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-secondary/70">
                  <ShieldCheck size={14} className="text-green-600" />
                  <span>Secure 256-bit SSL encrypted payments</span>
                </div>
              </Card>
            </Reveal>
          </div>

        </div>
      </div>
    </div>
  );
};
export default Checkout;
