import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../config/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { Reveal } from '../../components/Animation/Reveal';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string().min(8, 'Password confirmation must match.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        throw error;
      }

      showToast('Password updated successfully. Please log in.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6 pt-24 pb-12">
      <Reveal direction="up" className="max-w-md w-full bg-bg-secondary p-8 rounded-lg border border-border-subtle shadow-premium-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-serif font-bold text-text-primary">Create New Password</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Please enter and confirm your new account password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New Password"
            placeholder="Min. 8 characters"
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm new password"
            type="password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Reset Password
          </Button>
        </form>
      </Reveal>
    </div>
  );
};

export default ResetPassword;
