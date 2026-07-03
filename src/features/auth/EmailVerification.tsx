import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Mail } from 'lucide-react';
import { Reveal } from '../../components/Animation/Reveal';

export const EmailVerification: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6 pt-24 pb-12">
      <Reveal direction="up" className="max-w-md w-full text-center bg-bg-secondary p-8 rounded-lg border border-border-subtle shadow-premium-lg space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-brand-primary/10 text-brand-primary animate-pulse">
            <Mail size={40} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-text-primary">Verify Your Email</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            We have sent a verification link to your registered email address. 
            Please check your inbox and spam folders, and click the link to activate your account.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={() => navigate('/login')} className="w-full">
            Proceed to Login
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Back to Home
          </Button>
        </div>
      </Reveal>
    </div>
  );
};

export default EmailVerification;
