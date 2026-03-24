import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import type { Database } from '../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  clients: { name: string } | null;
};

export default function Dashboard() {
  const { company } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company) loadData();
  }, [company]);

  const loadData = async () => {
    if (!company) return;
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(name)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ensure overdue updates are awaited
      const updates: any[] = [];
      const updatedInvoices = data?.map((invoice: any) => {
        if (invoice.status === 'sent' && isAfter(new Date(), parseISO(invoice.due_date))) {
          updates.push(
            supabase.from('invoices').update({ status: 'overdue' } as any).eq('id', invoice.id)
          );
          return { ...invoice, status: 'overdue' as const };
        }
        return invoice;
      }) || [];

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      setInvoices(updatedInvoices);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    const outstanding = invoices
      .filter(inv => ['sent', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.total, 0);

    const overdue = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0);

    const recentPaid = invoices
      .filter(inv => inv.status === 'paid' && inv.paid_at && isAfter(parseISO(inv.paid_at), subDays(new Date(), 30)))
      .reduce((sum, inv) => sum + inv.total, 0);

    return { totalRevenue, outstanding, overdue, recentPaid };
  };

  if (!company) {
    return (
      <div className="empty-state">
        <span className="empty-icon">👋</span>
        <h3>Welcome to InvoiceApp</h3>
        <p>Please set up your company information to get started.</p>
        <Link to="/settings" className="btn btn-primary">Go to Settings</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <div className="loading loading-dark"></div>
      </div>
    );
  }

  const stats = calculateStats();
  const recentInvoices = invoices.slice(0, 6);

  // Status counts for pills
  const counts = {
    draft: invoices.filter(inv => inv.status === 'draft').length,
    sent: invoices.filter(inv => inv.status === 'sent').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length
  };

  // Safe currency reference
  const currencyCode = (company as any)?.currency || 'USD';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Here's an overview of your invoicing activity</p>
        </div>
        <div className="page-actions">
          <Link to="/invoices/new" className="btn btn-primary">
            <span>+</span> New Invoice
          </Link>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)'
      }}>
        <StatCard
          title="Total Revenue" value={formatCurrency(stats.totalRevenue, currencyCode)}
          description="All time" icon="💰" color="var(--color-success)"
        />
        <StatCard
          title="Outstanding" value={formatCurrency(stats.outstanding, currencyCode)}
          description="Awaiting payment" icon="⏳" color="var(--color-primary)"
        />
        <StatCard
          title="Overdue" value={formatCurrency(stats.overdue, currencyCode)}
          description="Past due date" icon="⚠️" color="var(--color-error)"
        />
        <StatCard
          title="Last 30 Days" value={formatCurrency(stats.recentPaid, currencyCode)}
          description="Paid this month" icon="📅" color="var(--color-gray-800)"
        />
      </div>

      <div style={{
        display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', marginBottom: 'var(--spacing-xl)'
      }}>
        <StatusPill status="draft" count={counts.draft} label="Drafts" />
        <StatusPill status="sent" count={counts.sent} label="Awaiting Payment" />
        <StatusPill status="paid" count={counts.paid} label="Paid" />
        <StatusPill status="overdue" count={counts.overdue} label="Overdue" />
      </div>

      <div className="card">
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--color-gray-200)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent Invoices</h2>
          <Link to="/invoices" className="btn btn-sm btn-secondary">View All</Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📄</span>
            <h3>No invoices yet</h3>
            <p>Create your first invoice to get started</p>
            <Link to="/invoices/new" className="btn btn-primary">Create Invoice</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/invoices/${invoice.id}`}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                        {invoice.invoice_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar">
                          {invoice.clients?.name?.charAt(0) || '?'}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--color-gray-700)' }}>
                          {invoice.clients?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                      {formatCurrency(invoice.total, currencyCode)}
                    </td>
                    <td>
                      <span className={`badge badge-${invoice.status}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon, color }: any) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: 'var(--color-gray-500)',
          textTransform: 'uppercase', letterSpacing: '0.04em'
        }}>{title}</div>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-md)',
          background: `${color}15`, color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>
        {description}
      </div>
    </div>
  );
}

function StatusPill({ status, count, label }: { status: string, count: number, label: string }) {
  if (count === 0) return null;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 'var(--radius-full)',
      background: 'white', border: '1px solid var(--color-gray-200)',
      boxShadow: 'var(--shadow-xs)', fontSize: 13, fontWeight: 500
    }}>
      <span className={`badge badge-${status}`} style={{ padding: '2px 8px' }}>{count}</span>
      <span style={{ color: 'var(--color-gray-600)' }}>{label}</span>
    </div>
  );
}
