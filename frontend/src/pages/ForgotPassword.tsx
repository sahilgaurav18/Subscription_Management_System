import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Card } from '../components/Card';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await api.post<{ message: string }>('/auth/forgot-password', { email });
      setResponseMsg(data.message);
      setIsSubmitted(true);
    } catch {
      // Always show success state for security/timing reasons
      setResponseMsg('If an account with that email exists, a password reset link has been dispatched.');
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5F7] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#F1EAF1] selection:text-[#6B4A6B]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
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
          Reset Password
        </h1>
        <p className="mt-1 text-[13px] text-[#6D6572]">
          Enter your registered email address to receive a secure reset link
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-[#EAF6EE] text-[#1E8E5A] border border-[#C6E8D2] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-[14px] font-medium text-[#1F1A21]">{responseMsg}</p>
              <p className="text-[12px] text-[#6D6572] leading-[1.6]">
                Please check your email inbox. In development mode, the reset link is logged directly to the backend terminal.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FormField label="Account Email" htmlFor="email" required>
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

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="w-full mt-2"
              >
                Send Reset Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B4A6B] hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
