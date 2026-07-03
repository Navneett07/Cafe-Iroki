import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Reveal } from '../../components/Animation/Reveal';
import { ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setIsSent(true);
      showToast('Password reset link sent to your email.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send reset link.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6 pt-24 pb-12">
      <Reveal direction="up" className="max-w-md w-full bg-bg-secondary p-8 rounded-lg border border-border-subtle shadow-premium-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-serif font-bold text-text-primary">Forgot Password</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Enter your registered email and we will send you a secure link to reset your password.
          </p>
        </div>

        {isSent ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-md bg-emerald-500/10 text-emerald-500 text-xs border border-emerald-500/20">
              A recovery link has been dispatched to your inbox.
            </div>
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-brand-primary hover:underline">
              <ArrowLeft size={14} />
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              placeholder="name@example.com"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send Recovery Link
            </Button>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors">
                <ArrowLeft size={14} />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </Reveal>
    </div>
  );
};

export default ForgotPassword;
