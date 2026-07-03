import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Reveal } from '../../components/Animation/Reveal';
import { MapPin, Clock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../config/supabaseClient';

export const TrackOrder: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Poll/Load order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error(err);
        showToast('Failed to retrieve order logs.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, showToast]);

  // Realtime subscription to track order updates from Supabase
  useEffect(() => {
    if (!orderId) return;

    const orderChannel = supabase
      .channel(`order-track-${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders', 
        filter: `id=eq.${orderId}` 
      }, async () => {
        try {
          const updated = await orderService.getOrderById(orderId);
          if (updated) {
            setOrder(updated);
            showToast(`Order status updated: ${updated.orderStatus.replace('-', ' ')}`, 'info');
          }
        } catch (err) {
          console.error('Realtime status sync error', err);
        }
      })
      .subscribe();

    return () => {
      orderChannel.unsubscribe();
    };
  }, [orderId, showToast]);

  if (isLoading) {
    return (
      <div className="pt-28 pb-24 bg-bg-primary max-w-3xl mx-auto px-6">
        <SkeletonCard />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-28 pb-24 bg-bg-primary text-center flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <span className="text-4xl">🔎</span>
        <h2 className="font-serif font-black text-xl text-text-primary">Order Not Found</h2>
        <p className="text-xs text-text-secondary">We could not retrieve order information for ID: {orderId}.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/menu')}>
          Return to Menu
        </Button>
      </div>
    );
  }

  const milestones: { key: Order['orderStatus']; label: string; icon: string; desc: string }[] = [
    { key: 'received', label: 'Order Placed', icon: '📝', desc: 'Kitchen acknowledged receipt.' },
    { key: 'preparing', label: 'Chef Preparing', icon: '🍳', desc: 'Searing patties & brewing tea.' },
    { key: 'out-for-delivery', label: 'Out for Delivery', icon: '🛵', desc: 'Leaving Samarth Nagar Metro base.' },
    { key: 'delivered', label: 'Feast Delivered', icon: '🍱', desc: 'Enjoy your warm Japanese meal!' },
  ];

  const currentStepIndex = milestones.findIndex((m) => m.key === order.orderStatus);

  return (
    <div className="pt-28 pb-24 bg-bg-primary text-text-primary min-h-screen">
      <div className="max-w-4xl mx-auto px-6 flex flex-col gap-8">
        
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
              Live Order Tracker
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight">
              Order ID: {order.id}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-accent-gold bg-brand-dark/10 py-1.5 px-3 rounded select-none uppercase tracking-wider">
            <span>Status: {order.orderStatus.replace('-', ' ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column Left: Tracker Status */}
          <div className="lg:col-span-7 space-y-6">
            <Reveal direction="left">
              <Card variant="premium" className="p-6 md:p-8 space-y-8">
                
                {/* Delivery timing estimation card */}
                {order.orderStatus !== 'delivered' ? (
                  <div className="flex items-center gap-4 p-4 bg-accent-gold/10 border border-accent-gold/20 rounded-md">
                    <Clock className="text-brand-primary animate-pulse h-8 w-8 flex-shrink-0" />
                    <div>
                      <p className="text-xs uppercase tracking-widest text-text-secondary font-bold">Estimated Delivery Time</p>
                      <p className="text-lg font-serif font-bold text-brand-primary">{order.estimatedDeliveryTime} (Nagpur Local)</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-green-600/10 border border-green-600/20 rounded-md text-green-600">
                    <CheckCircle2 className="h-8 w-8 flex-shrink-0" />
                    <div>
                      <p className="text-xs uppercase tracking-widest font-bold">Delivery Completed</p>
                      <p className="text-sm font-semibold">Your meal arrived fresh. Thank you!</p>
                    </div>
                  </div>
                )}

                {/* Milestone stepper lines */}
                <div className="relative border-l-2 border-border-subtle pl-8 space-y-8 ml-3">
                  {milestones.map((milestone, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isActive = idx === currentStepIndex;

                    return (
                      <div key={milestone.key} className="relative">
                        {/* Bullet node */}
                        <div
                          className={`absolute left-[-42px] top-0 h-7 w-7 rounded-full flex items-center justify-center text-xs border ${
                            isCompleted
                              ? 'bg-brand-primary border-brand-primary text-white shadow-glow-gold'
                              : 'bg-bg-primary border-border-subtle text-text-secondary/50'
                          }`}
                        >
                          <span>{milestone.icon}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <h4 className={`text-sm font-sans font-bold ${
                            isActive ? 'text-brand-primary' : isCompleted ? 'text-text-primary' : 'text-text-secondary/50'
                          }`}>
                            {milestone.label}
                          </h4>
                          <p className="text-xs text-text-secondary">{milestone.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </Card>
            </Reveal>
          </div>

          {/* Column Right: Billing & Dispatch summary */}
          <div className="lg:col-span-5 space-y-6">
            <Reveal direction="right">
              <Card variant="outline" className="p-6 space-y-4">
                <h3 className="text-sm font-serif font-bold border-b border-border-subtle pb-2.5">
                  Deliver To
                </h3>
                <div className="space-y-3 text-xs leading-relaxed text-text-secondary">
                  <p>
                    <strong className="text-text-primary">{order.deliveryAddress.fullName}</strong><br />
                    {order.deliveryAddress.phone}
                  </p>
                  <p className="flex items-start gap-1.5">
                    <MapPin size={16} className="text-brand-primary flex-shrink-0 mt-0.5" />
                    <span>
                      {order.deliveryAddress.street}
                      {order.deliveryAddress.landmark && <><br />Landmark: {order.deliveryAddress.landmark}</>}
                    </span>
                  </p>
                </div>
              </Card>
            </Reveal>

            <Reveal direction="right" delay={0.1}>
              <Card variant="outline" className="p-6 space-y-4">
                <h3 className="text-sm font-serif font-bold border-b border-border-subtle pb-2.5">
                  Cart Bill Details
                </h3>
                <div className="space-y-2.5 text-xs text-text-secondary">
                  {order.items.map((it) => (
                    <div key={it.menuItemId} className="flex justify-between">
                      <span>{it.quantity}x {it.name}</span>
                      <span className="font-semibold text-text-primary">
                        {(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-border-subtle/50 pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>GST (5%):</span>
                      <span>₹{order.gst.toFixed(2)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-₹{order.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Charge:</span>
                      <span>{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</span>
                    </div>
                    <div className="flex justify-between text-sm text-text-primary font-bold pt-2 border-t border-border-subtle">
                      <span>Grand Total:</span>
                      <span className="text-brand-primary">₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 justify-center border-t border-border-subtle/30 pt-3 text-[10px] text-text-secondary/70">
                  <ShieldCheck size={14} className="text-green-600" />
                  <span className="capitalize">Payment Method: {order.paymentMethod} ({order.paymentStatus})</span>
                </div>
              </Card>
            </Reveal>

            <Button
              variant="outline"
              size="md"
              className="w-full flex items-center justify-center gap-2 text-xs font-bold py-3"
              onClick={() => navigate('/menu')}
            >
              <span>Explore More Food</span>
              <ArrowRight size={14} />
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
};
export default TrackOrder;
