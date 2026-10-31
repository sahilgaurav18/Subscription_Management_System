import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { validatePassword } from '../utils/validation';
import { PasswordRequirements } from '../components/PasswordRequirements';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Card } from '../components/Card';
import { AlertCircle, CheckCircle, Lock, ArrowLeft } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing reset token. Please check your reset link.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError('Password does not meet complexity requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The token may be expired or already used.');
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
          Choose New Password
        </h1>
        <p className="mt-1 text-[13px] text-[#6D6572]">
          Your new password must satisfy all security rules
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-[#EAF6EE] text-[#1E8E5A] border border-[#C6E8D2] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-[18px] font-semibold text-[#1F1A21]">Password Reset Complete</h2>
              <p className="text-[13px] text-[#6D6572]">
                Your password has been updated and all prior sessions were revoked. You can now sign in with your new password.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="primary" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-[#FDF2F2] border border-[#F8D2D0] rounded-md text-[12px] text-[#C0392B] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#C0392B]" />
                  <span>{error}</span>
                </div>
              )}

              <FormField label="New Password" htmlFor="newPassword" required>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6D6572]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="erp-input pl-9"
                    placeholder="••••••••••••"
                  />
                </div>
                <div className="mt-2">
                  <PasswordRequirements password={newPassword} />
                </div>
              </FormField>

              <FormField label="Confirm New Password" htmlFor="confirmPassword" required>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6D6572]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="erp-input pl-9"
                    placeholder="••••••••••••"
                  />
                </div>
              </FormField>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="w-full mt-4"
              >
                Reset Password
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
