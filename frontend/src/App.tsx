import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { Plans } from './pages/Plans';
import { Taxes } from './pages/Taxes';
import { Discounts } from './pages/Discounts';
import { Staff } from './pages/Staff';
import { AuditLogs } from './pages/AuditLogs';
import { CustomerPortal } from './pages/CustomerPortal';
import { Subscriptions } from './pages/Subscriptions';
import { QuotationBuilder } from './pages/QuotationBuilder';
import { SubscriptionDetail } from './pages/SubscriptionDetail';
import { QuotationTemplates } from './pages/QuotationTemplates';
import { Invoices } from './pages/Invoices';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { InvoicePrint } from './pages/InvoicePrint';
import { LandingPage } from './pages/LandingPage';

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Public Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Staff & Admin Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/subscriptions/new" element={<QuotationBuilder />} />
                  <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
                  <Route path="/quotation-templates" element={<QuotationTemplates />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/invoices/:id" element={<InvoiceDetail />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/plans" element={<Plans />} />
                  <Route path="/taxes" element={<Taxes />} />
                  <Route path="/discounts" element={<Discounts />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                </Route>
              </Route>

              {/* Admin Only Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<Layout />}>
                  <Route path="/staff" element={<Staff />} />
                </Route>
              </Route>

              {/* Customer Only Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
                <Route element={<Layout />}>
                  <Route path="/portal" element={<CustomerPortal />} />
                </Route>
              </Route>

              {/* Standalone Printable Invoice */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'staff', 'customer']} />}>
                <Route path="/invoices/:id/print" element={<InvoicePrint />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
