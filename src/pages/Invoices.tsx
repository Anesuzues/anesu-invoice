import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import type { Database } from '../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  clients: { name: string } | null;
};

export default function Invoices() {
  const { company } = useCompany();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (company) loadInvoices();
  }, [company, filter]);

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filter]);

  const loadInvoices = async () => {
    if (!company) return;
    setLoading(true);
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

  const handleMarkPaid = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await supabase
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() } as any)
        .eq('id', id);
      loadInvoices();
    } catch (error) {
      console.error('Error marking paid:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    return <span className={`badge badge-${status}`}>{status}</span>;
  };

  if (!company) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🏢</span>
        <h3>Company Required</h3>
        <p>Please set up your company information before creating invoices.</p>
        <Link to="/settings" className="btn btn-primary">Go to Settings</Link>
      </div>
    );
  }

  // Client-side search
  const filteredInvoices = invoices.filter(inv => {
    const term = searchQuery.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(term) ||
      (inv.clients?.name || '').toLowerCase().includes(term)
    );
  });

  // Client-side pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const maxPage = Math.max(1, totalPages);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const currencyCode = (company as any)?.currency || 'ZAR';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Manage and track your sent invoices</p>
        </div>
        <div className="page-actions">
          <Link to="/invoices/new" className="btn btn-primary">
            <span>+</span> New Invoice
          </Link>
        </div>
      </div>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)',
        justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <div className="filter-tabs">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="input search-input"
            placeholder="Search invoice # or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <div className="loading loading-dark"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>No invoices found</h3>
            <p>{searchQuery ? 'Try adjusting your search or filters' : 'Create your first invoice to get started'}</p>
            {!searchQuery && <Link to="/invoices/new" className="btn btn-primary" style={{ marginTop: 16 }}>Create Invoice</Link>}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((invoice) => (
                  <tr 
                    key={invoice.id} 
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
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
                    <td>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                      {formatCurrency(invoice.total, currencyCode)}
                    </td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                          <button
                            onClick={(e) => handleMarkPaid(e, invoice.id)}
                            className="btn btn-sm btn-ghost"
                            title="Mark as Paid"
                            style={{ color: 'var(--color-success)', padding: '4px 8px' }}
                          >
                            ✓ Pay
                          </button>
                        )}
                        <span 
                          className="btn btn-sm btn-secondary"
                          onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${invoice.id}`); }}
                        >
                          View
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="btn btn-sm btn-secondary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </button>
                <div className="page-info">
                  Page {currentPage} of {maxPage}
                </div>
                <button 
                  className="btn btn-sm btn-secondary" 
                  disabled={currentPage === maxPage}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
