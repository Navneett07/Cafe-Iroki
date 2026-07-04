import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Reveal } from '../../components/Animation/Reveal';
import { supabase } from '../../config/supabaseClient';
import { ShoppingBag, ArrowLeft, ShieldCheck, QrCode, CreditCard, Banknote, UtensilsCrossed } from 'lucide-react';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
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
  guestName:   z.string().min(2, 'Name must be at least 2 characters.'),
  guestPhone:  z.string().regex(phoneRegex, 'Enter a valid 10-digit mobile number.'),
  tableNumber: z.string().min(1, 'Table number is required.'),
  notes:       z.string().optional(),
  paymentMethod: z.enum(['upi', 'card', 'counter']),
});

type CheckoutFormInput = z.infer<typeof checkoutSchema>;

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { cartItems, subtotal, discount, gst, total, clearCart, appliedCoupon } = useCart();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [createdOrderPayload, setCreatedOrderPayload] = useState<any>(null);

  // Auto-fill table from QR ?table=12
  const tableFromQR = searchParams.get('table') || '';

  useEffect(() => {
    if (cartItems.length === 0 && !createdOrderPayload) {
      showToast('Your cart is empty.', 'warning');
      navigate('/menu');
    }
  }, [cartItems, navigate, showToast, createdOrderPayload]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      tableNumber: tableFromQR,
      paymentMethod: 'counter',
    },
  });

  const selectedPaymentMethod = watch('paymentMethod');

  const onSubmit = async (data: CheckoutFormInput) => {
    setCheckoutLoading(true);
    try {
      const payload = {
        items: cartItems.map((it) => ({ menuItemId: it.menuItemId, quantity: it.quantity })),
        couponCode: appliedCoupon?.code,
        guest: {
          guestName:   data.guestName,
          guestPhone:  data.guestPhone,
          tableNumber: data.tableNumber,
          notes:       data.notes,
        },
        paymentMethod: data.paymentMethod,
      };

      const { data: result, error: funcErr } = await supabase.functions.invoke('checkout', {
        body: payload,
      });

      if (funcErr || !result || result.error) {
        throw new Error(funcErr?.message || result?.error || 'Checkout failed.');
      }

      setCreatedOrderPayload(result);

      if (data.paymentMethod === 'counter') {
        // Pay at Counter – no gateway needed
        clearCart();
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#8C6239', '#C5A880', '#E07A5F'] });
        showToast('Order placed! Please show this to the counter.', 'success');
        navigate(`/track/${result.orderId}`);
      } else {
        // UPI / Card via Razorpay
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          showToast('Failed to load Razorpay. Please retry.', 'error');
          setCheckoutLoading(false);
          return;
        }

        const { data: rzpData, error: rzpErr } = await supabase.functions.invoke('payments', {
          body: { action: 'create_payment_order', orderId: result.orderId },
        });

        if (rzpErr || !rzpData?.razorpayOrderId) {
          showToast('Failed to initialise payment.', 'error');
          setCheckoutLoading(false);
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY as string,
          amount: Math.round(result.total * 100),
          currency: 'INR',
          name: 'Cafe Iroki',
          description: 'Table Order',
          order_id: rzpData.razorpayOrderId,
          handler: async (response: any) => {
            const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('payments', {
              body: {
                action: 'verify_signature',
                orderId: result.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              },
            });
            if (verifyErr || !verifyData?.success) {
              showToast('Payment verification failed.', 'error');
              return;
            }
            clearCart();
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#8C6239', '#C5A880', '#E07A5F'] });
            showToast('Payment successful! Order confirmed.', 'success');
            navigate(`/track/${result.orderId}`);
          },
          prefill: { name: data.guestName, contact: data.guestPhone },
          theme: { color: '#8C6239' },
          modal: { ondismiss: () => setCheckoutLoading(false) },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Checkout failed. Please try again.', 'error');
      setCheckoutLoading(false);
    }
  };

  if (cartItems.length === 0 && !createdOrderPayload) return null;

  return (
    <div className="pt-28 pb-24 bg-bg-primary text-text-primary min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-8">

        <button
          onClick={() => navigate('/menu')}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-text-secondary hover:text-brand-primary font-bold transition-colors cursor-pointer mr-auto"
        >
          <ArrowLeft size={14} />
          <span>Back to Menu</span>
        </button>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-brand-primary font-bold flex items-center gap-1.5">
            <UtensilsCrossed size={14} /> Dine-In Order
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight leading-tight">
            Complete Your Order
          </h1>
          <p className="text-xs text-text-secondary">No account needed — just your name, mobile, and table number.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-2">

          {/* Left — Guest Info Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 space-y-6">
            <Reveal direction="left">
              <Card variant="premium" className="p-6 md:p-8 space-y-6">
                <h3 className="text-base font-serif font-bold border-b border-border-subtle pb-3">
                  1. Your Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    placeholder="e.g. Rahul Sharma"
                    error={errors.guestName?.message}
                    {...register('guestName')}
                  />
                  <Input
                    label="Mobile Number"
                    type="tel"
                    placeholder="10-digit number"
                    error={errors.guestPhone?.message}
                    {...register('guestPhone')}
                  />
                </div>

                <Input
                  label="Table Number"
                  placeholder="e.g. T-4 or 7"
                  error={errors.tableNumber?.message}
                  {...register('tableNumber')}
                />

                <Input
                  label="Special Instructions (Optional)"
                  multiline={true}
                  rows={2}
                  placeholder="Extra spicy, no onions, lactose-free..."
                  error={errors.notes?.message}
                  {...register('notes')}
                />
              </Card>
            </Reveal>

            <Reveal direction="left" delay={0.15}>
              <Card variant="premium" className="p-6 md:p-8 space-y-5">
                <h3 className="text-base font-serif font-bold border-b border-border-subtle pb-3">
                  2. Payment Option
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* UPI */}
                  <label className={`flex flex-col items-center justify-center p-4 border rounded-md cursor-pointer transition-smooth select-none ${
                    selectedPaymentMethod === 'upi'
                      ? 'border-accent-gold bg-accent-gold/10 text-text-primary'
                      : 'border-border-subtle hover:bg-bg-secondary text-text-secondary'
                  }`}>
                    <input type="radio" value="upi" {...register('paymentMethod')} className="sr-only" />
                    <QrCode size={20} className="mb-2 text-brand-primary" />
                    <span className="text-xs font-bold font-sans">UPI / QR</span>
                  </label>

                  {/* Card */}
                  <label className={`flex flex-col items-center justify-center p-4 border rounded-md cursor-pointer transition-smooth select-none ${
                    selectedPaymentMethod === 'card'
                      ? 'border-accent-gold bg-accent-gold/10 text-text-primary'
                      : 'border-border-subtle hover:bg-bg-secondary text-text-secondary'
                  }`}>
                    <input type="radio" value="card" {...register('paymentMethod')} className="sr-only" />
                    <CreditCard size={20} className="mb-2 text-brand-primary" />
                    <span className="text-xs font-bold font-sans">Card</span>
                  </label>

                  {/* Pay at Counter */}
                  <label className={`flex flex-col items-center justify-center p-4 border rounded-md cursor-pointer transition-smooth select-none ${
                    selectedPaymentMethod === 'counter'
                      ? 'border-accent-gold bg-accent-gold/10 text-text-primary'
                      : 'border-border-subtle hover:bg-bg-secondary text-text-secondary'
                  }`}>
                    <input type="radio" value="counter" {...register('paymentMethod')} className="sr-only" />
                    <Banknote size={20} className="mb-2 text-brand-primary" />
                    <span className="text-xs font-bold font-sans">Pay at Counter</span>
                  </label>
                </div>
              </Card>
            </Reveal>
          </form>

          {/* Right — Order Summary */}
          <div className="lg:col-span-5">
            <Reveal direction="right">
              <Card variant="glow" className="p-6 space-y-6">
                <h3 className="text-base font-serif font-bold border-b border-border-subtle pb-3 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-brand-primary" />
                  <span>Order Summary</span>
                </h3>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                  {cartItems.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between text-xs py-1 border-b border-border-subtle/30">
                      <span className="truncate max-w-[200px]">
                        <strong>{item.quantity}×</strong> {item.name}
                      </span>
                      <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

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
                    <span>Delivery</span>
                    <span className="font-medium text-green-600">FREE (Dine-In)</span>
                  </div>
                  <div className="flex justify-between text-sm text-text-primary font-bold pt-2.5 border-t border-border-subtle">
                    <span>Total</span>
                    <span className="text-brand-primary text-base">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full mt-2 font-bold py-3.5 text-sm bg-accent-warm shadow-glow-orange hover:shadow-premium-md"
                  onClick={handleSubmit(onSubmit)}
                  isLoading={checkoutLoading}
                >
                  Place Order
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-secondary/70">
                  <ShieldCheck size={14} className="text-green-600" />
                  <span>Secure · No account required</span>
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
