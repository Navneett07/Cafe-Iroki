import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import confetti from 'canvas-confetti';
import { reservationService } from '../../services/reservationService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Reveal } from '../../components/Animation/Reveal';
import { Calendar, Users, CheckCircle2 } from 'lucide-react';

// Indian Phone Regex (exactly 10 digits starting with 6-9)
const phoneRegex = /^[6-9]\d{9}$/;

const reservationSchema = z.object({
  guestName: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit mobile number (e.g. 9876543210).'),
  date: z.string().min(1, 'Please select a date.'),
  time: z.string().min(1, 'Please select a time slot.'),
  guests: z.coerce.number().min(1, 'At least 1 guest required.').max(12, 'For groups larger than 12, please call us directly.'),
  location: z.enum(['indoor', 'outdoor', 'balcony']),
  specialRequests: z.string().optional(),
});

interface SeatingTable {
  id: string;
  name: string;
  capacity: number;
  status: 'available' | 'reserved';
}

export const Reserve: React.FC = () => {
  const { showToast } = useToast();
  const [selectedZone, setSelectedZone] = useState<'indoor' | 'outdoor' | 'balcony'>('indoor');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);

  // Seating tables mock lists grouped by zone
  const tablesByZone: Record<'indoor' | 'outdoor' | 'balcony', SeatingTable[]> = {
    indoor: [
      { id: 'T-IN1', name: 'Book Nook 1', capacity: 2, status: 'available' },
      { id: 'T-IN2', name: 'Tatami Zone 2', capacity: 4, status: 'reserved' },
      { id: 'T-IN3', name: 'Fireside 3', capacity: 2, status: 'available' },
      { id: 'T-IN4', name: 'Workstation 4', capacity: 1, status: 'available' },
      { id: 'T-IN5', name: 'Family Booth 5', capacity: 6, status: 'available' },
      { id: 'T-IN6', name: 'Window Bay 6', capacity: 4, status: 'reserved' },
    ],
    outdoor: [
      { id: 'T-OUT1', name: 'Garden Nest 1', capacity: 2, status: 'available' },
      { id: 'T-OUT2', name: 'Bonsai Terrace 2', capacity: 4, status: 'available' },
      { id: 'T-OUT3', name: 'Lantern Alley 3', capacity: 2, status: 'reserved' },
      { id: 'T-OUT4', name: 'Bamboo Deck 4', capacity: 6, status: 'available' },
    ],
    balcony: [
      { id: 'T-BAL1', name: 'Metro View 1', capacity: 2, status: 'available' },
      { id: 'T-BAL2', name: 'Metro View 2', capacity: 2, status: 'reserved' },
      { id: 'T-BAL3', name: 'Sunset Deck 3', capacity: 4, status: 'available' },
    ],
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      location: 'indoor',
      guests: 2,
    },
  });

  const onSubmit = async (data: any) => {
    if (!selectedTable) {
      showToast('Please select a specific table on the floor seating grid.', 'warning');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await reservationService.createReservation({
        guestName: data.guestName,
        email: data.email,
        phone: data.phone,
        date: data.date,
        time: data.time,
        guests: data.guests,
        location: data.location,
        specialRequests: `${data.specialRequests || ''} [Table Pick: ${selectedTable}]`,
      });

      // Seeding success receipt & trigger party confetti
      setSuccessBooking(res);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8C6239', '#C5A880', '#E07A5F', '#556b2f'],
      });
      showToast('Table Reserved successfully! See receipt.', 'success');
      reset();
      setSelectedTable(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to create reservation. Please try again.', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const activeTablesList = tablesByZone[selectedZone];

  return (
    <div className="pt-28 pb-24 bg-bg-primary text-text-primary min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col gap-10">
        
        {/* Page Title */}
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
            Fine Seating Bookings
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-tight">
            Reserve Your Sanctuary
          </h1>
          <p className="text-xs text-text-secondary max-w-md">
            Choose your preferred dining setting and lock in your table coordinates at Samarth Nagar.
          </p>
        </div>

        {/* Content columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Column Left: Booking Form */}
          <div className="lg:col-span-5">
            <Reveal direction="left">
              <Card variant="premium" className="p-4 sm:p-6 md:p-8 space-y-6">
                <h3 className="text-lg font-serif font-bold border-b border-border-subtle pb-3.5 flex items-center gap-2">
                  <Calendar size={18} className="text-brand-primary animate-pulse" />
                  <span>Reservation Details</span>
                </h3>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Guest Name"
                    placeholder="Enter your full name"
                    error={errors.guestName?.message ? String(errors.guestName.message) : undefined}
                    {...register('guestName')}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@example.com"
                      error={errors.email?.message ? String(errors.email.message) : undefined}
                      {...register('email')}
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      error={errors.phone?.message ? String(errors.phone.message) : undefined}
                      {...register('phone')}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Date"
                      type="date"
                      error={errors.date?.message ? String(errors.date.message) : undefined}
                      min={new Date().toISOString().split('T')[0]}
                      {...register('date')}
                    />
                    
                    <Input
                      label="Time Slot"
                      options={[
                        { value: '', label: 'Select' },
                        { value: '11:00', label: '11:00 AM' },
                        { value: '12:30', label: '12:30 PM' },
                        { value: '14:00', label: '02:00 PM' },
                        { value: '17:00', label: '05:00 PM' },
                        { value: '18:30', label: '06:30 PM' },
                        { value: '20:00', label: '08:00 PM' },
                        { value: '21:30', label: '09:30 PM' },
                      ]}
                      error={errors.time?.message ? String(errors.time.message) : undefined}
                      {...register('time')}
                    />

                    <Input
                      label="Guests Count"
                      type="number"
                      error={errors.guests?.message ? String(errors.guests.message) : undefined}
                      {...register('guests')}
                    />
                  </div>

                  <Input
                    label="Cafe Dining Zone"
                    options={[
                      { value: 'indoor', label: 'Indoor Minimalist (Reading Nooks & Workspace)' },
                      { value: 'outdoor', label: 'Outdoor Garden Deck' },
                      { value: 'balcony', label: 'Balcony Ajni Metro View' },
                    ]}
                    error={errors.location?.message ? String(errors.location.message) : undefined}
                    {...register('location', {
                      onChange: (e) => {
                        setSelectedZone(e.target.value as any);
                        setSelectedTable(null);
                      }
                    })}
                  />

                  <Input
                    label="Special Requests (Optional)"
                    multiline={true}
                    rows={2}
                    placeholder="E.g., high chair, anniversary setup, quiet zone..."
                    error={errors.specialRequests?.message ? String(errors.specialRequests.message) : undefined}
                    {...register('specialRequests')}
                  />

                  <Button
                    variant="secondary"
                    size="lg"
                    type="submit"
                    isLoading={bookingLoading}
                    className="w-full mt-4 font-bold bg-brand-primary"
                  >
                    Confirm Table Booking
                  </Button>
                </form>
              </Card>
            </Reveal>
          </div>

          {/* Column Right: Interactive Seating Floorplan Grid */}
          <div className="lg:col-span-7">
            <Reveal direction="right">
              <Card variant="premium" className="p-4 sm:p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
                  <h3 className="text-lg font-serif font-bold flex items-center gap-2">
                    <Users size={18} className="text-brand-primary" />
                    <span>Select Seating Table</span>
                  </h3>
                  <span className="text-xs text-text-secondary capitalize font-bold bg-border-subtle/30 px-3 py-1 rounded">
                    Zone: {selectedZone}
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  Click on an available table below to link it to your booking. Red tables are currently occupied or reserved.
                </p>

                {/* Legend Row */}
                <div className="flex gap-4 text-xs font-semibold select-none pt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-green-500/20 border border-green-500" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-rose-500/20 border border-rose-500" />
                    <span>Reserved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-accent-gold border border-accent-gold shadow-glow-gold" />
                    <span>Selected</span>
                  </div>
                </div>

                {/* Seating Layout Map Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 pt-4">
                  {activeTablesList.map((tab) => {
                    const isPicked = selectedTable === tab.id;
                    const isReserved = tab.status === 'reserved';

                    let tableColorStyle = 'border-green-500 bg-green-500/10 hover:bg-green-500/20';
                    if (isReserved) {
                      tableColorStyle = 'border-rose-500 bg-rose-500/10 opacity-60 cursor-not-allowed';
                    }
                    if (isPicked) {
                      tableColorStyle = 'border-accent-gold bg-accent-gold text-bg-primary shadow-glow-gold scale-[1.02]';
                    }

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        disabled={isReserved}
                        onClick={() => setSelectedTable(tab.id)}
                        className={`flex flex-col items-center justify-center p-2.5 sm:p-4 border rounded-md transition-smooth select-none cursor-pointer ${tableColorStyle}`}
                        aria-label={`Table ${tab.name}, capacity: ${tab.capacity} guests. Status: ${isReserved ? 'Reserved' : isPicked ? 'Currently Selected' : 'Available for booking'}`}
                        aria-pressed={isPicked}
                      >
                        <span className="text-xs font-bold font-serif">{tab.name}</span>
                        <span className="text-[10px] opacity-80 mt-1 font-sans">{tab.capacity} Guests Cap</span>
                      </button>
                    );
                  })}
                </div>

                {/* Map blueprint backdrop design representation */}
                <div className="mt-8 border border-dashed border-border-subtle/50 p-4 rounded text-center bg-bg-secondary/40 text-[10px] text-text-secondary select-none font-mono">
                  <span>🍣 [ JAPANESE CAFE MAIN KITCHEN COUNTER AREA ] 🍵</span>
                </div>
              </Card>
            </Reveal>
          </div>

        </div>

        {/* Success Modal Receipt */}
        <Modal
          isOpen={!!successBooking}
          onClose={() => setSuccessBooking(null)}
          title={
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={20} />
              <span>Table Booking Confirmed</span>
            </div>
          }
        >
          {successBooking && (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">🏮</span>
                <h4 className="font-serif font-black text-xl text-text-primary uppercase tracking-wider">
                  Reservation Receipt
                </h4>
                <p className="text-[10px] uppercase font-bold tracking-widest text-accent-gold">
                  Booking ID: {successBooking.id}
                </p>
              </div>

              <div className="border-t border-b border-dashed border-border-subtle py-4 text-xs text-text-secondary space-y-3 max-w-sm mx-auto text-left font-sans leading-relaxed">
                <div className="flex justify-between">
                  <span>Guest Name:</span>
                  <strong className="text-text-primary">{successBooking.guestName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Date / Time:</span>
                  <strong className="text-text-primary">{successBooking.date} at {successBooking.time}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Guests:</span>
                  <strong className="text-text-primary">{successBooking.guests} Person(s)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Zone Placement:</span>
                  <strong className="text-text-primary uppercase">{successBooking.location}</strong>
                </div>
                {successBooking.specialRequests && (
                  <div className="border-t border-border-subtle/40 pt-2.5">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-text-primary">Requests / Placement:</p>
                    <p className="text-[11px] mt-1">{successBooking.specialRequests}</p>
                  </div>
                )}
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                Thank you for choosing Iroki! A SMS confirmation has been dispatched to {successBooking.phone}. We look forward to welcoming you soon.
              </p>

              <Button
                variant="primary"
                size="md"
                onClick={() => setSuccessBooking(null)}
                className="w-full max-w-xs mt-2 bg-brand-primary text-white"
              >
                Done
              </Button>
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
};
export default Reserve;
