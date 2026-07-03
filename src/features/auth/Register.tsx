import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Reveal } from '../../components/Animation/Reveal';
import { UserPlus } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type RegisterInput = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.fullName, data.phone);
      showToast('Registration successful! Verification email sent.', 'success');
      navigate('/verify-email');
    } catch (err: any) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6 pt-28 pb-12">
      <Reveal direction="up" className="max-w-md w-full bg-bg-secondary p-8 rounded-lg border border-border-subtle shadow-premium-lg space-y-6">
        
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
            Create Account
          </span>
          <h1 className="text-3xl font-serif font-black tracking-tight text-text-primary">
            Cafe Iroki Register
          </h1>
          <p className="text-xs text-text-secondary">
            Join us to earn premium coupons, save booking history, and order specialty coffee.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            type="text"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="Email Address"
            placeholder="name@example.com"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Phone Number"
            placeholder="9876543210"
            type="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Password"
            placeholder="Min. 8 characters"
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirm Password"
            placeholder="Re-type password"
            type="password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" className="w-full flex items-center justify-center gap-2" isLoading={isLoading}>
            <UserPlus size={16} />
            Create Account
          </Button>
        </form>

        <div className="text-center text-xs text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-primary hover:underline">
            Log In Here
          </Link>
        </div>

      </Reveal>
    </div>
  );
};

export default Register;
