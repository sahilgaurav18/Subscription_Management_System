import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Card } from '../components/Card';
import { AlertCircle, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isExpired = searchParams.get('expired') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data = await api.post<{ access_token: string; refresh_token: string; user: any }>('/auth/login', {
        email,
        password,
      });

      login(data);
      if (data.user.role === 'customer') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (role: 'admin' | 'staff' | 'customer') => {
    if (role === 'admin') {
      setEmail('admin@brightloop.io');
      setPassword('Password123!');
    } else if (role === 'staff') {
      setEmail('staff@brightloop.io');
      setPassword('Password123!');
    } else {
      setEmail('customer@brightloop.io');
      setPassword('Password123!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5F7] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#F1EAF1] selection:text-[#6B4A6B]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Simple geometric SVG mark */}
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B] rounded-md p-1">
          <div className="w-10 h-10 rounded-lg bg-[#6B4A6B] flex items-center justify-center text-white shadow-xs group-hover:bg-[#593B59] transition-colors">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </div>
          <span className="text-[22px] font-bold text-[#1F1A21] tracking-tight">Brightloop</span>
        </Link>
        <h1 className="text-[24px] font-semibold tracking-tight text-[#1F1A21]">
          Sign in to Back Office
        </h1>
        <p className="mt-1 text-[13px] text-[#6D6572]">
          Subscription Management, Billing & Invoicing Engine
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8">
          {isExpired && (
            <div className="mb-4 p-3 bg-[#FEF6E7] border border-[#FADDA8] rounded-md text-[12px] text-[#B7791F] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B7791F]" />
              <span>Your session has expired or was revoked. Please log in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#F8D2D0] rounded-md text-[12px] text-[#C0392B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#C0392B]" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Credentials */}
          <div className="mb-5 p-3 bg-[#F6F5F7] rounded-md border border-[#E3DFE5]">
            <p className="text-[11px] font-semibold text-[#6D6572] mb-2 uppercase tracking-wider">
              Quick Demo Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="min-h-[36px] px-2 py-1 text-[12px] font-medium rounded-md border border-[#E1D4E1] bg-[#F1EAF1] text-[#6B4A6B] hover:bg-[#6B4A6B] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('staff')}
                className="min-h-[36px] px-2 py-1 text-[12px] font-medium rounded-md border border-[#C2DCF2] bg-[#EBF3FB] text-[#2B6CB0] hover:bg-[#2B6CB0] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0]"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => fillDemo('customer')}
                className="min-h-[36px] px-2 py-1 text-[12px] font-medium rounded-md border border-[#C6E8D2] bg-[#EAF6EE] text-[#1E8E5A] hover:bg-[#1E8E5A] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E8E5A]"
              >
                Customer
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField label="Email Address" htmlFor="email" required>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6D6572]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="erp-input pl-9"
                  placeholder="name@example.com"
                />
              </div>
            </FormField>

            <FormField label="Password" htmlFor="password" required>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6D6572]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="erp-input pl-9"
                  placeholder="••••••••"
                />
              </div>
            </FormField>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-[12px] font-medium text-[#6B4A6B] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full mt-2"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center text-[13px] text-[#6D6572]">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#6B4A6B] hover:underline">
              Create customer account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
