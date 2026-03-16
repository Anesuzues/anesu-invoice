import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import { format } from 'date-fns';
import type { Database } from '../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  clients: { name: string } | null;
};

export default function Invoices() {
  const { company } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (company) {
      loadInvoices();
    }
  }, [company, filter]);

  const loadInvoices = async () => {
    if (!company) return;

    try {
      let query = supabase
        .from('invoices')
        .select('*, clients(name)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return <span className={`badge badge-${status}`}>{status}</span>;
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
          Invoices
        </h1>
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-md)' }}>
            Please set up your company information in Settings before creating invoices.
          </p>
          <Link to="/settings" className="btn btn-primary">
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Invoices</h1>
        <Link to="/invoices/new" className="btn btn-primary">
          + New Invoice
        </Link>
      </div>

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className="btn"
              style={{
                backgroundColor: filter === status ? 'var(--color-primary)' : 'white',
                color: filter === status ? 'white' : 'var(--color-gray-700)',
                border: '1px solid var(--color-gray-300)',
                textTransform: 'capitalize'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <div className="loading"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-md)' }}>
              No invoices found
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
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={{ fontWeight: '600' }}>{invoice.invoice_number}</td>
                  <td>{invoice.clients?.name || 'N/A'}</td>
                  <td>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</td>
                  <td>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</td>
                  <td style={{ fontWeight: '600' }}>{formatCurrency(invoice.total)}</td>
                  <td>{getStatusBadge(invoice.status)}</td>
                  <td>
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="btn btn-sm btn-secondary"
                      style={{ marginRight: 'var(--spacing-xs)' }}
                    >
                      View
                    </Link>
                    {invoice.status === 'draft' && (
                      <Link
                        to={`/invoices/${invoice.id}/edit`}
                        className="btn btn-sm btn-secondary"
                      >
                        Edit
                      </Link>
                    )}
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
