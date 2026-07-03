import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Coffee, Lock, Mail, Eye, EyeOff, Shield } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input } from '../components/ui/Form';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormInput = z.infer<typeof schema>;

const AdminLogin: React.FC = () => {
  const { login, isAuthenticated } = useAdminAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormInput>({
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: FormInput) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      // Auth context verifies admin_users table; if not admin it signs out
      // Navigate happens via useEffect when isAuthenticated becomes true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      showToast(msg.includes('Invalid') ? 'Invalid email or password' : msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[--color-surface-900] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand-700/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-2xl shadow-brand-500/30 mb-4"
          >
            <Coffee size={28} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[--color-text-primary]">Cafe Iroki</h1>
          <p className="text-sm text-[--color-text-secondary] mt-1">Enterprise Admin Portal</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={15} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-[--color-text-primary]">Admin Sign In</h2>
            <span className="ml-auto text-[10px] uppercase tracking-widest text-[--color-text-muted] bg-white/5 px-2 py-1 rounded-full">Restricted</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@cafeiroki.com"
              autoComplete="email"
              prefix={<Mail size={15} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]">
                  <Lock size={15} />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full bg-[--color-surface-700] border border-[--color-border] rounded-[--radius-btn] pl-9 pr-10 py-2.5 text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/20 transition-all ${errors.password ? 'border-red-500/50' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full mt-2"
              size="lg"
            >
              Sign In to Admin Portal
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[--color-text-muted]">
            This portal is restricted to authorized administrators only.
            <br />Unauthorized access attempts are logged.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
