import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Reveal } from '../../components/Animation/Reveal';
import { LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginInput = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      showToast('Logged in successfully.', 'success');
      navigate(from, { replace: true });
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6 pt-28 pb-12">
      <Reveal direction="up" className="max-w-md w-full bg-bg-secondary p-8 rounded-lg border border-border-subtle shadow-premium-lg space-y-6">
        
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
            Welcome Back
          </span>
          <h1 className="text-3xl font-serif font-black tracking-tight text-text-primary">
            Cafe Iroki Login
          </h1>
          <p className="text-xs text-text-secondary">
            Log in to manage reservations, check your active orders, and save favorites.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            placeholder="name@example.com"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary select-none">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[10px] font-bold text-brand-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <Input
              placeholder="Enter password"
              type="password"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <Button type="submit" className="w-full flex items-center justify-center gap-2" isLoading={isLoading}>
            <LogIn size={16} />
            Log In
          </Button>
        </form>

        <div className="text-center text-xs text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-brand-primary hover:underline">
            Register Here
          </Link>
        </div>

      </Reveal>
    </div>
  );
};

export default Login;
