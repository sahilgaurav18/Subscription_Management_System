import React, { useState, useEffect, useCallback } from 'react';
import type { AuditLog, PaginatedResponse } from '../types/models';
import { api } from '../services/api';
import { Pagination } from '../components/Pagination';
import { LoadingState, EmptyState, ErrorState } from '../components/UIStates';
import { formatDateTime } from '../utils/format';
import { Card } from '../components/Card';
import { History, ChevronDown, ChevronRight, Filter } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [data, setData] = useState<PaginatedResponse<AuditLog>>({
    items: [],
    total: 0,
    page: 1,
    page_size: 15,
    total_pages: 1,
  });
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<AuditLog>>('/audit-logs', {
        page,
        page_size: pageSize,
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit trail');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, entityFilter, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const renderJsonPretty = (jsonString?: string | null) => {
    if (!jsonString) return <span className="text-[#6D6572] italic text-[12px]">None</span>;
    try {
      const parsed = JSON.parse(jsonString);
      return (
        <pre className="p-3 bg-[#2E2330] text-[#D9CFDA] rounded-lg text-[11px] overflow-x-auto font-mono leading-relaxed border border-[#E3DFE5]/20">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <span className="font-mono text-[12px] text-[#1F1A21]">{jsonString}</span>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-[#EDFDF5] text-[#1E8E5A] border-[#C6F6D5]';
      case 'UPDATE':
        return 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8]';
      case 'DELETE':
        return 'bg-[#FDF2F2] text-[#C0392B] border-[#F8D2D0]';
      case 'STATUS_CHANGE':
        return 'bg-[#F1EAF1] text-[#6B4A6B] border-[#E3DFE5]';
      default:
        return 'bg-[#F6F5F7] text-[#6D6572] border-[#E3DFE5]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-[#6B4A6B]" />
          <span>Audit Log Trail</span>
        </h1>
        <p className="text-[13px] text-[#6D6572] mt-1">
          Immutable event log tracking price changes, plan modifications, tax updates and security events
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4 text-[13px]">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-[#6D6572]" />
            <span className="text-[12px] font-medium text-[#6D6572]">Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="erp-select text-[13px] py-1.5"
            >
              <option value="">All Entities</option>
              <option value="product">Product</option>
              <option value="product_variant">Product Variant</option>
              <option value="plan">Plan</option>
              <option value="tax">Tax</option>
              <option value="discount">Discount</option>
              <option value="customer">Customer</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[12px] font-medium text-[#6D6572]">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="erp-select text-[13px] py-1.5"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card noPadding className="overflow-hidden">
        {error && (
          <div className="p-4 bg-[#FDF2F2] text-[13px] text-[#C0392B] border-b border-[#F8D2D0]">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="bg-[#F6F5F7] text-[12px] font-medium text-[#6D6572] border-b border-[#E3DFE5]">
              <tr>
                <th className="py-3 px-3 w-8"></th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4 text-right">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6">
                    <LoadingState message="Loading immutable audit trail..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-6 px-4">
                    <ErrorState message={error} onRetry={fetchLogs} />
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 px-4">
                    <EmptyState
                      title="No Audit Records"
                      description="No audit events matched your entity or action filter parameters."
                    />
                  </td>
                </tr>
              ) : (
                data.items.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className="hover:bg-[#F6F5F7] transition cursor-pointer select-none"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <td className="py-3 px-3 text-center">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#6B4A6B]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#6D6572]" />
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-[12px] text-[#6D6572]">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1F1A21]">
                          {log.actor_email || (log.actor_id ? `User #${log.actor_id}` : 'System Automation')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-semibold text-[11px] px-2 py-0.5 rounded border uppercase tracking-wider ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1F1A21] capitalize">
                          {log.entity.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#6D6572]">
                          #{log.entity_id}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#F6F5F7]/60 border-b border-[#E3DFE5]">
                          <td colSpan={6} className="p-4 pl-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-[12px] font-semibold text-[#1F1A21] mb-1.5">
                                  State Before:
                                </h4>
                                {renderJsonPretty(log.before)}
                              </div>
                              <div>
                                <h4 className="text-[12px] font-semibold text-[#1F1A21] mb-1.5">
                                  State After:
                                </h4>
                                {renderJsonPretty(log.after)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={data.page}
          pageSize={data.page_size}
          total={data.total}
          totalPages={data.total_pages}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </Card>
    </div>
  );
};
