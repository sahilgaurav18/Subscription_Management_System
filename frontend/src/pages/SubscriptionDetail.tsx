import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Subscription } from '../types/models';
import { api } from '../services/api';
import { formatMoney, formatDate } from '../utils/format';
import { StatusBadge } from '../components/StatusBadge';
import { Stepper } from '../components/Stepper';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingState, ErrorState } from '../components/UIStates';
import statusTransitionsConfig from '@shared/config/status_transitions.json';
import {
  Building,
  MapPin,
  CheckCircle,
  Play,
  Pause,
  RotateCw,
  XCircle,
  ArrowLeft,
  AlertCircle,
  Tag,
} from 'lucide-react';

export const SubscriptionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [sub, setSub] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [now] = useState(() => Date.now());

  const fetchSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Subscription>(`/subscriptions/${id}`);
      setSub(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleTransition = async (action: string) => {
    if (!sub) return;
    if (action === 'close' && !confirm('Are you sure you want to close this subscription?')) return;

    setActionLoading(true);
    setError(null);
    try {
      const updated = await api.post<Subscription>(`/subscriptions/${sub.id}/transition`, {
        action,
      });
      setSub(updated);
    } catch (err: any) {
      setError(err.message || `Failed to execute action ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Check allowed status transitions from shared config
  const allowedMoves: string[] = (statusTransitionsConfig.subscriptions as Record<string, string[]>)[sub?.status || ''] || [];

  const isQuotationExpired = useMemo(() => {
    if (!sub || sub.status !== 'quotation' || !sub.expiry_date) return false;
    return new Date(sub.expiry_date).getTime() < now;
  }, [sub, now]);

  if (isLoading) {
    return (
      <Card>
        <LoadingState message="Loading subscription lifecycle and commitment details..." />
      </Card>
    );
  }

  if (!sub) {
    return (
      <Card>
        <ErrorState
          title="Subscription Not Found"
          message={error || 'Subscription could not be found or access is denied.'}
          onRetry={fetchSubscription}
        />
        <div className="text-center mt-3">
          <Button
            variant="link"
            onClick={() => navigate('/subscriptions')}
          >
            ← Back to Subscriptions
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/subscriptions')}
            className="p-2 rounded-md border border-[#E3DFE5] text-[#1F1A21] hover:bg-[#F6F5F7] min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
            aria-label="Back to subscriptions list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-semibold font-mono text-[#1F1A21] tracking-tight">
                {sub.number}
              </h1>
              <StatusBadge status={sub.status} type="subscription" />
            </div>
            <p className="text-[12px] text-[#6D6572] mt-0.5">
              Created {formatDate(sub.created_at)}
            </p>
          </div>
        </div>

        {/* Transition Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {sub.status === 'draft' && (
            <>
              {allowedMoves.includes('quotation') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTransition('quotation')}
                  isLoading={actionLoading}
                >
                  Send as Quotation
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleTransition('confirm')}
                isLoading={actionLoading}
              >
                Confirm Subscription
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleTransition('close')}
                isLoading={actionLoading}
              >
                Cancel / Close
              </Button>
            </>
          )}

          {sub.status === 'quotation' && (
            <>
              {allowedMoves.includes('confirmed') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleTransition('confirm')}
                  isLoading={actionLoading}
                  disabled={Boolean(isQuotationExpired)}
                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                >
                  Confirm Subscription
                </Button>
              )}
              {allowedMoves.includes('closed') && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleTransition('close')}
                  isLoading={actionLoading}
                >
                  Reject / Close
                </Button>
              )}
            </>
          )}

          {sub.status === 'confirmed' && (
            <>
              {allowedMoves.includes('active') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleTransition('activate')}
                  isLoading={actionLoading}
                  icon={<Play className="w-3.5 h-3.5" />}
                >
                  Activate Subscription
                </Button>
              )}
              {allowedMoves.includes('closed') && sub.plan_closable && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleTransition('close')}
                  isLoading={actionLoading}
                >
                  Close
                </Button>
              )}
            </>
          )}

          {sub.status === 'active' && (
            <>
              {allowedMoves.includes('paused') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTransition('pause')}
                  isLoading={actionLoading}
                  disabled={!sub.plan_pausable}
                  icon={<Pause className="w-3.5 h-3.5" />}
                  title={sub.plan_pausable ? 'Pause subscription' : 'Plan is not pausable'}
                >
                  Pause
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTransition('renew')}
                isLoading={actionLoading}
                disabled={!sub.plan_renewable}
                icon={<RotateCw className="w-3.5 h-3.5" />}
                title={sub.plan_renewable ? 'Renew subscription period' : 'Plan is not renewable'}
              >
                Renew
              </Button>

              {allowedMoves.includes('closed') && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleTransition('close')}
                  isLoading={actionLoading}
                  disabled={!sub.plan_closable}
                  icon={<XCircle className="w-3.5 h-3.5" />}
                  title={sub.plan_closable ? 'Close early' : 'Plan is not closable'}
                >
                  Close
                </Button>
              )}
            </>
          )}

          {sub.status === 'paused' && (
            <>
              {allowedMoves.includes('active') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleTransition('resume')}
                  isLoading={actionLoading}
                  icon={<Play className="w-3.5 h-3.5" />}
                >
                  Resume Subscription
                </Button>
              )}
              {allowedMoves.includes('closed') && sub.plan_closable && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleTransition('close')}
                  isLoading={actionLoading}
                >
                  Close
                </Button>
              )}
            </>
          )}

          {sub.status === 'closed' && allowedMoves.includes('renew') && sub.plan_renewable && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleTransition('renew')}
              isLoading={actionLoading}
              icon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Reopen / Renew Subscription
            </Button>
          )}
        </div>
      </Card>

      {/* Stepper Statusbar */}
      <Card className="py-3 px-6">
        <Stepper currentStatus={sub.status} />
      </Card>

      {error && (
        <div className="p-4 bg-[#FDF2F2] border border-[#F8D2D0] rounded-lg text-[13px] text-[#C0392B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#C0392B]" />
          <span>{error}</span>
        </div>
      )}

      {isQuotationExpired && (
        <div className="p-4 bg-[#FEF6E7] border border-[#FADDA8] rounded-lg text-[13px] text-[#B7791F] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#B7791F]" />
          <span>
            This quotation expired on {formatDate(sub.expiry_date)}. Per system billing rules, expired quotations cannot be confirmed.
          </span>
        </div>
      )}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
        {/* Customer Info */}
        <Card className="space-y-2">
          <span className="font-semibold text-[#6D6572] uppercase tracking-wider text-[11px]">
            Customer Details
          </span>
          <p className="font-semibold text-[15px] text-[#1F1A21]">{sub.customer_name}</p>
          {sub.customer_company && (
            <p className="text-[#6D6572] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#6D6572]" />
              <span>{sub.customer_company}</span>
            </p>
          )}
          {sub.customer_billing_address && (
            <p className="text-[#6D6572] flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#6D6572] shrink-0" />
              <span>{sub.customer_billing_address}</span>
            </p>
          )}
          {sub.customer_tax_id && (
            <p className="text-[#6D6572] font-mono text-[11px]">
              Tax ID: {sub.customer_tax_id}
            </p>
          )}
        </Card>

        {/* Plan Info */}
        <Card className="space-y-2">
          <span className="font-semibold text-[#6D6572] uppercase tracking-wider text-[11px]">
            Plan & Billing Rules
          </span>
          <p className="font-semibold text-[15px] text-[#1F1A21]">{sub.plan_name}</p>
          <p className="text-[#6B4A6B] font-medium capitalize">
            Billing: {sub.plan_billing_period}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                sub.plan_pausable
                  ? 'bg-[#EAF6EE] text-[#1E8E5A]'
                  : 'bg-[#F1EFF2] text-[#6D6572]'
              }`}
            >
              Pausable: {sub.plan_pausable ? 'Yes' : 'No'}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                sub.plan_renewable
                  ? 'bg-[#EAF6EE] text-[#1E8E5A]'
                  : 'bg-[#F1EFF2] text-[#6D6572]'
              }`}
            >
              Renewable: {sub.plan_renewable ? 'Yes' : 'No'}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                sub.plan_closable
                  ? 'bg-[#EAF6EE] text-[#1E8E5A]'
                  : 'bg-[#F1EFF2] text-[#6D6572]'
              }`}
            >
              Closable: {sub.plan_closable ? 'Yes' : 'No'}
            </span>
          </div>
        </Card>

        {/* Dates & Terms */}
        <Card className="space-y-2">
          <span className="font-semibold text-[#6D6572] uppercase tracking-wider text-[11px]">
            Schedule & Terms
          </span>
          <div className="space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[#6D6572]">Start Date:</span>
              <span className="font-medium text-[#1F1A21]">{formatDate(sub.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6D6572]">Expiry Date:</span>
              <span className="font-medium text-[#1F1A21]">{formatDate(sub.expiry_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6D6572]">Next Invoice Date:</span>
              <span className="font-semibold text-[#6B4A6B]">
                {formatDate(sub.next_invoice_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6D6572]">Payment Terms:</span>
              <span className="font-medium text-[#1F1A21]">{sub.payment_terms}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscription Lines Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E3DFE5] flex items-center justify-between">
          <h3 className="font-semibold text-[15px] text-[#1F1A21] flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#6B4A6B]" />
            <span>Subscription Line Items</span>
          </h3>
          <span className="text-[12px] text-[#6D6572]">
            {sub.status === 'confirmed' || sub.status === 'active' || sub.status === 'paused' || sub.status === 'closed'
              ? 'Prices snapshotted at confirmation'
              : 'Draft quotation prices'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead className="bg-[#F6F5F7] text-[12px] font-medium text-[#6D6572] border-b border-[#E3DFE5]">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Variant Attribute</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {sub.lines.map((l) => (
                <tr key={l.id} className="hover:bg-[#F6F5F7]/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#1F1A21]">{l.product_name}</td>
                  <td className="py-3 px-4">
                    {l.variant_value ? (
                      <span className="bg-[#F1EFF2] px-2 py-0.5 rounded text-[12px] text-[#1F1A21] font-medium border border-[#E3DFE5]">
                        {l.variant_attribute}: {l.variant_value}
                      </span>
                    ) : (
                      <span className="text-[#6D6572]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-medium tabular-nums">{l.quantity}</td>
                  <td className="py-3 px-4 text-right font-medium tabular-nums">{formatMoney(l.unit_price)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-[#1F1A21] tabular-nums">
                    {formatMoney(l.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#F6F5F7] font-semibold border-t border-[#E3DFE5] text-[#1F1A21]">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-right text-[13px]">
                  Total Recurring Commitment:
                </td>
                <td className="py-3 px-4 text-right text-[15px] text-[#6B4A6B] tabular-nums">
                  {formatMoney(sub.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
};
