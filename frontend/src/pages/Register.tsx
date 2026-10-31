import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { validatePassword } from '../utils/validation';
import { PasswordRequirements } from '../components/PasswordRequirements';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Card } from '../components/Card';
import { AlertCircle, Lock, Mail, Building, User, MapPin } from 'lucide-react';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError('Please ensure your password meets all complexity requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.post<{ access_token: string; refresh_token: string; user: any }>(
        '/auth/register',
        {
          email,
          password,
          name,
          company,
          billing_address: billingAddress,
          tax_id: taxId,
        }
      );

      login(data);
      navigate('/portal');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
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
          Create Customer Account
        </h1>
        <p className="mt-1 text-[13px] text-[#6D6572]">
          Manage your software subscriptions, invoices and payments
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#F8D2D0] rounded-md text-[12px] text-[#C0392B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#C0392B]" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField label="Full Name" htmlFor="name" required>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6D6572]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="erp-input pl-9"
                  placeholder="Jane Doe"
                />
              </div>
            </FormField>

            <FormField label="Work Email" htmlFor="email" required>
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
                  placeholder="jane@company.com"
                />
              </div>
            </FormField>

            <FormField label="Company Name" htmlFor="company">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6D6572]">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="erp-input pl-9"
                  placeholder="Acme Inc."
                />
              </div>
            </FormField>

            <FormField label="Billing Address" htmlFor="address">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6D6572]">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  id="address"
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="erp-input pl-9"
                  placeholder="123 Tech Way, Suite 100"
                />
              </div>
            </FormField>

            <FormField label="Tax ID / VAT Number" htmlFor="taxId">
              <input
                id="taxId"
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="erp-input"
                placeholder="US-12-3456789"
              />
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
                  placeholder="••••••••••••"
                />
              </div>
              <div className="mt-2">
                <PasswordRequirements password={password} />
              </div>
            </FormField>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full mt-4"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-[13px] text-[#6D6572]">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#6B4A6B] hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
