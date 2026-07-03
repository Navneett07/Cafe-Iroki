import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, AlertTriangle, Key } from 'lucide-react';
import { Reveal } from '../../components/Animation/Reveal';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6">
      <Reveal direction="up" className="max-w-md w-full text-center space-y-6 bg-bg-secondary p-8 rounded-lg border border-border-subtle shadow-premium-lg">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-red-500/10 text-red-500">
            <Key size={40} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-text-primary">Unauthorized Access (401)</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            You must be logged in to view this section. Please log in with your credentials to authenticate.
          </p>
        </div>
        <Button onClick={() => navigate('/login')} className="w-full">
          Go to Login
        </Button>
      </Reveal>
    </div>
  );
};

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6">
      <Reveal direction="up" className="max-w-md w-full text-center space-y-6 bg-bg-secondary p-8 rounded-lg border border-border-subtle shadow-premium-lg">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-orange-500/10 text-orange-500">
            <ShieldAlert size={40} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-text-primary">Access Forbidden (403)</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            You do not have the required permissions or roles to view this directory page.
          </p>
        </div>
        <Button onClick={() => navigate('/')} className="w-full">
          Return Home
        </Button>
      </Reveal>
    </div>
  );
};

export const SessionExpired: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6">
      <Reveal direction="up" className="max-w-md w-full text-center space-y-6 bg-bg-secondary p-8 rounded-lg border border-border-subtle shadow-premium-lg">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-yellow-500/10 text-yellow-500">
            <AlertTriangle size={40} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-text-primary">Session Expired</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Your login token has expired or is no longer valid. Please log in again to establish a new session.
          </p>
        </div>
        <Button onClick={() => navigate('/login')} className="w-full">
          Log In Again
        </Button>
      </Reveal>
    </div>
  );
};
