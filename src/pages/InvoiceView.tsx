import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import type { Database } from '../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  clients: Database['public']['Tables']['clients']['Row'];
  companies: Database['public']['Tables']['companies']['Row'];
  invoice_items: Database['public']['Tables']['invoice_items']['Row'][];
};

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(*), companies(*), invoice_items(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (invoice) {
      generateInvoicePDF(invoice);
    }
  };

  const handleMarkPaid = async () => {
    if (!id) return;

    try {
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        } as any)
        .eq('id', id);

      setShowPaymentModal(false);
      loadInvoice();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!id || !invoice?.clients.email) {
      alert('Client email is required to send invoice');
      return;
    }

    setSendingEmail(true);
    try {
      // Use the anon key instead of session token for Edge Functions
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: id,
          sendReminder: false,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Invoice sent successfully!');
        // Update invoice status to 'sent'
        await supabase
          .from('invoices')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          } as any)
          .eq('id', id);
        
        loadInvoice(); // Refresh to show updated status
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Failed to send invoice email: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await supabase.from('invoices').delete().eq('id', id);
      navigate('/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
        <div className="loading"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: 'var(--spacing-md)' }}>
          Invoice Not Found
        </h1>
        <Link to="/invoices" className="btn btn-primary">
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
          Invoice {invoice.invoice_number}
        </h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button onClick={handleDownloadPDF} className="btn btn-secondary">
            Download PDF
          </button>
          {invoice.clients.email && (
            <button 
              onClick={handleSendEmail} 
              className="btn btn-primary"
              disabled={sendingEmail}
            >
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </button>
          )}
          {invoice.status !== 'paid' && (
            <button onClick={() => setShowPaymentModal(true)} className="btn btn-success">
              Mark as Paid
            </button>
          )}
          {invoice.status === 'draft' && (
            <Link to={`/invoices/${id}/edit`} className="btn btn-primary">
              Edit
            </Link>
          )}
          <button onClick={handleDelete} className="btn btn-danger">
            Delete
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2xl)' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: 'var(--spacing-sm)' }}>
              {invoice.companies.name}
            </h2>
            {invoice.companies.address && (
              <p style={{ color: 'var(--color-gray-600)', fontSize: '14px' }}>
                {invoice.companies.address}<br />
                {invoice.companies.city}, {invoice.companies.state} {invoice.companies.zip}
              </p>
            )}
            {invoice.companies.email && (
              <p style={{ color: 'var(--color-gray-600)', fontSize: '14px' }}>
                {invoice.companies.email}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge badge-${invoice.status}`} style={{ fontSize: '14px' }}>
              {invoice.status}
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-2xl)',
          paddingBottom: 'var(--spacing-xl)',
          borderBottom: '1px solid var(--color-gray-200)'
        }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-sm)' }}>
              BILL TO
            </h3>
            <p style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
              {invoice.clients.name}
            </p>
            {invoice.clients.address && (
              <p style={{ color: 'var(--color-gray-600)', fontSize: '14px' }}>
                {invoice.clients.address}<br />
                {invoice.clients.city}, {invoice.clients.state} {invoice.clients.zip}
              </p>
            )}
            {invoice.clients.email && (
              <p style={{ color: 'var(--color-gray-600)', fontSize: '14px' }}>
                {invoice.clients.email}
              </p>
            )}
          </div>

          <div>
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <span style={{ fontSize: '14px', color: 'var(--color-gray-600)' }}>Invoice Number: </span>
              <span style={{ fontWeight: '600' }}>{invoice.invoice_number}</span>
            </div>
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <span style={{ fontSize: '14px', color: 'var(--color-gray-600)' }}>Issue Date: </span>
              <span>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</span>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-gray-600)' }}>Due Date: </span>
              <span>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
            </div>
          </div>
        </div>

        <table className="table" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>Tax</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_items.map((item) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                <td style={{ textAlign: 'right' }}>{item.tax_rate}%</td>
                <td style={{ textAlign: 'right', fontWeight: '600' }}>
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-sm)',
              paddingBottom: 'var(--spacing-sm)'
            }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-sm)',
              paddingBottom: 'var(--spacing-sm)'
            }}>
              <span>Tax:</span>
              <span>{formatCurrency(invoice.tax_amount)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-sm)',
                paddingBottom: 'var(--spacing-sm)',
                color: 'var(--color-success)'
              }}>
                <span>Discount:</span>
                <span>-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '20px',
              fontWeight: '700',
              paddingTop: 'var(--spacing-sm)',
              borderTop: '2px solid var(--color-gray-300)'
            }}>
              <span>Total:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div style={{
            marginTop: 'var(--spacing-xl)',
            paddingTop: 'var(--spacing-xl)',
            borderTop: '1px solid var(--color-gray-200)'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
              Notes
            </h3>
            <p style={{ color: 'var(--color-gray-600)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
              {invoice.notes}
            </p>
          </div>
        )}

        {invoice.terms && (
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
              Terms & Conditions
            </h3>
            <p style={{ color: 'var(--color-gray-600)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
              {invoice.terms}
            </p>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 'var(--spacing-xl)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: 'var(--spacing-md)' }}>
                Mark Invoice as Paid
              </h2>
              <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-lg)' }}>
                Are you sure you want to mark this invoice as paid?
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleMarkPaid} className="btn btn-success">
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
