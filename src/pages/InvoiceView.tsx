import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils/currency';
import { useCompany } from '../contexts/CompanyContext';
import type { Database } from '../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  clients: Database['public']['Tables']['clients']['Row'];
  companies: Database['public']['Tables']['companies']['Row'];
  invoice_items: Database['public']['Tables']['invoice_items']['Row'][];
};

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useCompany();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (id) loadInvoice();
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

  const generateInvoiceNumber = async () => {
    if (!company) return 'INV-0001';
    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('company_id', company.id)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && data.invoice_number) {
      const match = data.invoice_number.match(/\d+$/);
      if (match) {
        const lastNumber = parseInt(match[0], 10);
        return `INV-${String(lastNumber + 1).padStart(4, '0')}`;
      }
    }
    return 'INV-0001';
  };

  const handleDuplicate = async () => {
    if (!invoice || !company) return;
    setDuplicating(true);
    
    try {
      const newInvoiceNumber = await generateInvoiceNumber();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: newInvoice, error: invError } = await supabase.from('invoices').insert({
        invoice_number: newInvoiceNumber,
        company_id: company.id,
        client_id: invoice.client_id,
        issue_date: today,
        due_date: invoice.due_date, // Keep original due date length logic could be better, but copying verbatim is fine
        status: 'draft',
        subtotal: invoice.subtotal,
        tax_amount: invoice.tax_amount,
        discount_amount: invoice.discount_amount,
        total: invoice.total,
        notes: invoice.notes,
        terms: invoice.terms
      } as any).select().single();

      if (invError) throw invError;

      if (invoice.invoice_items && invoice.invoice_items.length > 0) {
        const itemsToInsert = invoice.invoice_items.map(item => ({
          invoice_id: newInvoice.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          amount: item.amount
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert as any);
        if (itemsError) throw itemsError;
      }

      showSuccess('Invoice Duplicated', `Created draft ${newInvoiceNumber}`);
      navigate(`/invoices/${newInvoice.id}/edit`);
    } catch (err: any) {
      console.error('Error duplicating:', err);
      showError('Duplication Failed', err.message || 'Could not duplicate invoice.');
    } finally {
      setDuplicating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (invoice) generateInvoicePDF(invoice);
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    try {
      await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() } as any).eq('id', id);
      setShowPaymentModal(false);
      loadInvoice();
      showSuccess('Payment Recorded', 'Invoice marked as paid.');
    } catch (error) {
      console.error('Error marking paid:', error);
      showError('Update Failed', 'Could not record payment.');
    }
  };

  const handleSendEmail = async () => {
    if (!id || !invoice?.clients.email) {
      showError('Email Required', 'Client email is required to send invoice');
      return;
    }

    setSendingEmail(true);
    showInfo('Sending Email', 'Your invoice is being sent...');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: id, sendReminder: false }),
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('Invoice Sent Successfully!', `Emailed to ${invoice.clients.email}`);
        await supabase.from('invoices').update({ status: 'sent', sent_at: new Date().toISOString() } as any).eq('id', id);
        loadInvoice();
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      showError('Failed to Send', error.message || 'Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await supabase.from('invoices').delete().eq('id', id);
      showSuccess('Invoice Deleted', 'Invoice has been removed.');
      navigate('/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showError('Deletion Failed', 'Could not delete invoice.');
    }
  };

  if (loading) return (
    <div style={{ padding: '64px', display: 'flex', justifyContent: 'center' }}>
      <div className="loading loading-dark"></div>
    </div>
  );

  if (!invoice) return (
    <div className="empty-state">
      <span className="empty-icon">📄</span>
      <h3>Invoice Not Found</h3>
      <p>The invoice you're looking for doesn't exist or has been deleted.</p>
      <Link to="/invoices" className="btn btn-primary">Back to Invoices</Link>
    </div>
  );

  const currencyCode = (company as any)?.currency || 'USD';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 48 }}>
      <div className="page-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <Link to="/invoices" style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 4, display: 'inline-block' }}>
            ← Back to Invoices
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title">Invoice {invoice.invoice_number}</h1>
            <span className={`badge badge-${invoice.status}`} style={{ fontSize: 14 }}>
              {invoice.status.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {invoice.status === 'draft' && (
            <Link to={`/invoices/${id}/edit`} className="btn btn-sm btn-secondary">
              ✎ Edit
            </Link>
          )}
          
          <button onClick={handleDuplicate} className="btn btn-sm btn-secondary" disabled={duplicating}>
            {duplicating ? 'Duplicating...' : '⧉ Duplicate'}
          </button>
          
          <button onClick={handleDownloadPDF} className="btn btn-sm btn-secondary">
            ⬇ PDF
          </button>
          
          {invoice.clients.email && (
            <button onClick={handleSendEmail} className="btn btn-sm btn-primary" disabled={sendingEmail}>
              {sendingEmail ? 'Sending...' : '📨 Send'}
            </button>
          )}
          
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <button onClick={() => setShowPaymentModal(true)} className="btn btn-sm btn-success">
              ✓ Mark Paid
            </button>
          )}
          
          <button onClick={handleDelete} className="btn btn-sm btn-danger" style={{ background: 'transparent' }}>
            🗑
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '48px 56px', background: 'white', position: 'relative' }}>
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 64 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-gray-900)', marginBottom: 8 }}>
              {invoice.companies.name}
            </h2>
            <div style={{ color: 'var(--color-gray-500)', fontSize: 14, lineHeight: 1.6 }}>
              {invoice.companies.address && <div>{invoice.companies.address}</div>}
              {(invoice.companies.city || invoice.companies.state) && (
                <div>{invoice.companies.city}, {invoice.companies.state} {invoice.companies.zip}</div>
              )}
              {invoice.companies.country && <div>{invoice.companies.country}</div>}
              {invoice.companies.email && <div style={{ marginTop: 4 }}>{invoice.companies.email}</div>}
              {invoice.companies.phone && <div>{invoice.companies.phone}</div>}
              {invoice.companies.tax_id && <div style={{ marginTop: 4 }}>Tax ID: {invoice.companies.tax_id}</div>}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-gray-200)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 }}>
              Invoice
            </div>
            <table style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 14 }}>
              <tbody>
                <tr>
                  <td style={{ color: 'var(--color-gray-500)', paddingRight: 16, paddingBottom: 4 }}>Invoice No:</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{invoice.invoice_number}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--color-gray-500)', paddingRight: 16, paddingBottom: 4 }}>Issue Date:</td>
                  <td style={{ fontWeight: 500 }}>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--color-gray-500)', paddingRight: 16 }}>Due Date:</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            Bill To
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: 4 }}>
            {invoice.clients.name}
          </div>
          <div style={{ color: 'var(--color-gray-600)', fontSize: 14, lineHeight: 1.6 }}>
            {invoice.clients.address && <div>{invoice.clients.address}</div>}
            {(invoice.clients.city || invoice.clients.state) && (
              <div>{invoice.clients.city}, {invoice.clients.state} {invoice.clients.zip}</div>
            )}
            {invoice.clients.email && <div style={{ marginTop: 4 }}>{invoice.clients.email}</div>}
            {invoice.clients.phone && <div>{invoice.clients.phone}</div>}
          </div>
        </div>

        {/* Line Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-gray-200)' }}>
              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 13, fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '12px 0', fontSize: 13, fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: i === invoice.invoice_items.length - 1 ? 'none' : '1px solid var(--color-gray-100)' }}>
                <td style={{ padding: '16px 0', color: 'var(--color-gray-900)', fontSize: 15 }}>
                  {item.description}
                  {item.tax_rate > 0 && <span style={{ fontSize: 12, color: 'var(--color-gray-400)', marginLeft: 8 }}>({item.tax_rate}% tax)</span>}
                </td>
                <td style={{ padding: '16px', textAlign: 'center', color: 'var(--color-gray-700)' }}>{item.quantity}</td>
                <td style={{ padding: '16px', textAlign: 'right', color: 'var(--color-gray-700)' }}>{formatCurrency(item.unit_price, currencyCode)}</td>
                <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                  {formatCurrency(item.amount, currencyCode)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Box */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 64 }}>
          <div style={{ width: 320, background: 'var(--color-gray-50)', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--color-gray-600)', fontSize: 14 }}>
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal, currencyCode)}</span>
            </div>
            {invoice.tax_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--color-gray-600)', fontSize: 14 }}>
                <span>Tax</span>
                <span>{formatCurrency(invoice.tax_amount, currencyCode)}</span>
              </div>
            )}
            {invoice.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--color-success)', fontSize: 14 }}>
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount_amount, currencyCode)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, borderTop: '2px solid var(--color-gray-200)' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>Total Due</span>
              <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-gray-900)', lineHeight: 1 }}>
                {formatCurrency(invoice.total, currencyCode)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes & Terms & Bank Specs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, borderTop: '1px solid var(--color-gray-200)', paddingTop: 32 }}>
          {/* Left Column: Bank info */}
          <div>
            {(invoice.companies.bank_name || invoice.companies.bank_account_number || invoice.companies.payment_instructions) && (
              <>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Payment Details
                </h3>
                <div style={{ fontSize: 13, color: 'var(--color-gray-600)', lineHeight: 1.6 }}>
                  {invoice.companies.bank_name && <div><strong>Bank:</strong> {invoice.companies.bank_name}</div>}
                  {invoice.companies.bank_account_name && <div><strong>Account Name:</strong> {invoice.companies.bank_account_name}</div>}
                  {invoice.companies.bank_account_number && <div><strong>Account No:</strong> {invoice.companies.bank_account_number}</div>}
                  {invoice.companies.bank_routing_number && <div><strong>Routing:</strong> {invoice.companies.bank_routing_number}</div>}
                  {invoice.companies.bank_swift_code && <div><strong>SWIFT/BIC:</strong> {invoice.companies.bank_swift_code}</div>}
                  {invoice.companies.bank_iban && <div><strong>IBAN:</strong> {invoice.companies.bank_iban}</div>}
                  {invoice.companies.payment_instructions && (
                    <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{invoice.companies.payment_instructions}</div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Right Column: Notes & Terms */}
          <div>
            {invoice.notes && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Notes
                </h3>
                <div style={{ fontSize: 13, color: 'var(--color-gray-600)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {invoice.notes}
                </div>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Terms & Conditions
                </h3>
                <div style={{ fontSize: 13, color: 'var(--color-gray-600)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {invoice.terms}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ padding: '32px' }}>
              <div style={{ width: 48, height: 48, background: 'var(--color-success-light)', color: 'var(--color-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>💰</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Record Payment</h2>
              <p style={{ color: 'var(--color-gray-600)', textAlign: 'center', marginBottom: 32, fontSize: 15 }}>
                Mark invoice {invoice.invoice_number} for {formatCurrency(invoice.total, currencyCode)} as paid?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button onClick={() => setShowPaymentModal(false)} className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                  Cancel
                </button>
                <button onClick={handleMarkPaid} className="btn btn-success" style={{ justifyContent: 'center' }}>
                  Mark Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
