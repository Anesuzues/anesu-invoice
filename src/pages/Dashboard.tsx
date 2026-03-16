import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import type { Database } from '../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  clients: { name: string } | null;
};

export default function Dashboard() {
  const { company } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company) {
      loadData();
    }
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

      const updatedInvoices = data?.map((invoice: any) => {
        if (
          invoice.status === 'sent' &&
          isAfter(new Date(), parseISO(invoice.due_date))
        ) {
          supabase
            .from('invoices')
            .update({ status: 'overdue' } as any)
            .eq('id', invoice.id);
          return { ...invoice, status: 'overdue' as const };
        }
        return invoice;
      }) || [];

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
      .filter(inv => inv.status === 'paid' && inv.paid_at &&
        isAfter(parseISO(inv.paid_at), subDays(new Date(), 30)))
      .reduce((sum, inv) => sum + inv.total, 0);

    return { totalRevenue, outstanding, overdue, recentPaid };
  };

  const getRecentInvoices = () => {
    return invoices.slice(0, 5);
  };

  const getStatusCounts = () => {
    return {
      draft: invoices.filter(inv => inv.status === 'draft').length,
      sent: invoices.filter(inv => inv.status === 'sent').length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!company) {
    return (
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: 'var(--spacing-md)' }}>
          Welcome
        </h1>
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-md)' }}>
            Please set up your company information to get started.
          </p>
          <Link to="/settings" className="btn btn-primary">
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
        <div className="loading"></div>
      </div>
    );
  }

  const stats = calculateStats();
  const statusCounts = getStatusCounts();
  const recentInvoices = getRecentInvoices();

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--color-gray-600)' }}>
          Welcome back, here's an overview of your invoicing activity
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          description="All time"
          color="var(--color-success)"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstanding)}
          description="Awaiting payment"
          color="var(--color-primary)"
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(stats.overdue)}
          description="Past due date"
          color="var(--color-error)"
        />
        <StatCard
          title="Last 30 Days"
          value={formatCurrency(stats.recentPaid)}
          description="Paid this month"
          color="var(--color-gray-700)"
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <StatusCard
          status="Draft"
          count={statusCounts.draft}
          badgeClass="badge-draft"
        />
        <StatusCard
          status="Sent"
          count={statusCounts.sent}
          badgeClass="badge-sent"
        />
        <StatusCard
          status="Paid"
          count={statusCounts.paid}
          badgeClass="badge-paid"
        />
        <StatusCard
          status="Overdue"
          count={statusCounts.overdue}
          badgeClass="badge-overdue"
        />
      </div>

      <div className="card">
        <div style={{
          padding: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--color-gray-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Recent Invoices</h2>
          <Link to="/invoices" className="btn btn-sm btn-secondary">
            View All
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-md)' }}>
              No invoices yet
            </p>
            <Link to="/invoices/new" className="btn btn-primary">
              Create your first invoice
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <Link
                      to={`/invoices/${invoice.id}`}
                      style={{ fontWeight: '600' }}
                    >
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td>{invoice.clients?.name || 'N/A'}</td>
                  <td>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</td>
                  <td style={{ fontWeight: '600' }}>{formatCurrency(invoice.total)}</td>
                  <td>
                    <span className={`badge badge-${invoice.status}`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, description, color }: {
  title: string;
  value: string;
  description: string;
  color: string;
}) {
  return (
    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{
        fontSize: '13px',
        fontWeight: '600',
        color: 'var(--color-gray-600)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 'var(--spacing-sm)'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        color: color,
        marginBottom: 'var(--spacing-xs)'
      }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--color-gray-500)' }}>
        {description}
      </div>
    </div>
  );
}

function StatusCard({ status, count, badgeClass }: {
  status: string;
  count: number;
  badgeClass: string;
}) {
  return (
    <div className="card" style={{
      padding: 'var(--spacing-lg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <span className={`badge ${badgeClass}`}>{status}</span>
      <span style={{ fontSize: '24px', fontWeight: '700' }}>{count}</span>
    </div>
  );
}
