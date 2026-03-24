import { useState, useEffect, FormEvent, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from '../contexts/ToastContext';
import { format, addDays } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import type { Database } from '../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

interface InvoiceItem {
  id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useCompany();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState((company as any)?.currency || 'USD');

  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment due within 30 days');
  const [discountAmount, setDiscountAmount] = useState(0);

  const statusRef = useRef<'draft' | 'sent'>('draft');

  useEffect(() => {
    if (company) {
      setCurrency((company as any).currency || 'USD');
      loadClients();
      loadProducts();
      if (id) loadInvoice();
    }
  }, [company, id]);

  const loadClients = async () => {
    if (!company) return;
    const { data } = await supabase.from('clients').select('*').eq('company_id', company.id).order('name');
    setClients(data || []);
  };

  const loadProducts = async () => {
    if (!company) return;
    const { data } = await supabase.from('products').select('*').eq('company_id', company.id).order('name');
    setProducts(data || []);
  };

  const loadInvoice = async () => {
    if (!id || !company) return;
    const { data: inv } = await supabase.from('invoices').select('*, invoice_items(*)').eq('id', id).single();
    if (inv) {
      setClientId(inv.client_id);
      setIssueDate(inv.issue_date);
      setDueDate(inv.due_date);
      setNotes(inv.notes || '');
      setTerms(inv.terms || '');
      setDiscountAmount(inv.discount_amount);
      if (inv.invoice_items?.length) {
        setItems(inv.invoice_items.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          amount: item.amount
        })));
      }
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate inner amount based on updated state
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }
    setItems(newItems);
  };

  const selectProduct = (index: number, productId: string) => {
    if (!productId) {
      updateItem(index, 'description', '');
      return;
    }
    const p = products.find(p => p.id === productId);
    if (!p) return;
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product_id: p.id,
      description: p.name,
      unit_price: p.price,
      tax_rate: p.tax_rate,
      amount: newItems[index].quantity * p.price
    };
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.amount * item.tax_rate / 100), 0);
    const total = subtotal + taxAmount - discountAmount;
    return { subtotal, taxAmount, total };
  };

  const generateInvoiceNumber = async () => {
    if (!company) return 'INV-0001';
    // Use select with limit to get highest current ID safely
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setLoading(true);

    const status = statusRef.current;

    try {
      const { subtotal, taxAmount, total } = calculateTotals();
      
      let invoiceNumber = '';
      if (id) {
        const { data } = await supabase.from('invoices').select('invoice_number').eq('id', id).single();
        invoiceNumber = (data as any)?.invoice_number || '';
      } else {
        invoiceNumber = await generateInvoiceNumber();
      }

      const invoiceData = {
        invoice_number: invoiceNumber,
        company_id: company.id, client_id: clientId,
        issue_date: issueDate, due_date: dueDate,
        status, subtotal, tax_amount: taxAmount,
        discount_amount: discountAmount, total,
        notes, terms,
        ...(status === 'sent' && { sent_at: new Date().toISOString() })
      };

      let savedInvoiceId = id;

      if (id) {
        const { error } = await supabase.from('invoices').update(invoiceData as any).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('invoices').insert(invoiceData as any).select().single();
        if (error) throw error;
        savedInvoiceId = data.id;
      }

      // Batch substitute items instead of looping single inserts
      if (id) {
        await supabase.from('invoice_items').delete().eq('invoice_id', id);
      }
      
      const itemsToInsert = items.map(item => ({
        invoice_id: savedInvoiceId,
        product_id: item.product_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        amount: item.amount
      }));
      
      const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert as any);
      if (itemsError) throw itemsError;

      if (status === 'draft') {
        showSuccess('Invoice Saved', `Invoice ${invoiceNumber} saved as draft.`);
      }

      if (status === 'sent' && savedInvoiceId) {
        const selectedClient = clients.find(c => c.id === clientId);
        if (selectedClient?.email) {
          showInfo('Sending Email', 'Your invoice is being sent...');
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invoiceId: savedInvoiceId, sendReminder: false }),
          });
          const result = await response.json();
          if (result.success) {
            showSuccess('Invoice Sent', `Emailed to ${selectedClient.email}`);
          } else {
            showError('Email Failed', 'Saved but could not send email.');
          }
        } else {
          showError('No Email', 'Invoice saved but client has no email.');
        }
      }

      navigate('/invoices');
    } catch (err: any) {
      console.error('Save error:', err);
      showError('Save Failed', err.message || 'Failed to save invoice.');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Link to="/invoices" style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 4, display: 'inline-block' }}>
            ← Back to Invoices
          </Link>
          <h1 className="page-title">{id ? 'Edit Invoice' : 'New Invoice'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>Invoice Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
            <div>
              <label className="label">Client *</label>
              <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)} required disabled={loading}>
                <option value="">Select a client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Issue Date *</label>
              <input type="date" className="input" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required disabled={loading} />
            </div>
            <div>
              <label className="label">Due Date *</label>
              <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required disabled={loading} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Line Items</h2>
            <button type="button" onClick={() => setItems([...items, { description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 }])} className="btn btn-sm btn-secondary" disabled={loading}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Item
            </button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {/* Header Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1fr 1.5fr 36px', gap: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-gray-200)' }}>
              <div className="label" style={{ marginBottom: 0 }}>Description</div>
              <div className="label" style={{ marginBottom: 0 }}>Qty</div>
              <div className="label" style={{ marginBottom: 0 }}>Price</div>
              <div className="label" style={{ marginBottom: 0 }}>Tax %</div>
              <div className="label" style={{ marginBottom: 0 }}>Amount</div>
              <div></div>
            </div>

            {items.map((item, index) => (
              <div key={index} style={{
                display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1fr 1.5fr 36px',
                gap: 12, alignItems: 'start',
                paddingBottom: 16, borderBottom: index < items.length - 1 ? '1px dashed var(--color-gray-200)' : 'none'
              }}>
                <div>
                  <select className="input" style={{ marginBottom: 8, background: 'var(--color-gray-50)' }} value={item.product_id || ''} onChange={(e) => selectProduct(index, e.target.value)} disabled={loading}>
                    <option value="">Custom item...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="text" className="input" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="Description" required disabled={loading} />
                </div>
                <input type="number" className="input" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} min="0" step="0.01" required disabled={loading} />
                <input type="number" className="input" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} min="0" step="0.01" required disabled={loading} />
                <input type="number" className="input" value={item.tax_rate} onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)} min="0" step="0.01" disabled={loading} />
                <input type="text" className="input" value={formatCurrency(item.amount, currency).replace(currency, '').trim()} disabled style={{ background: 'transparent', border: 'none', paddingLeft: 0, fontWeight: 600, color: 'var(--color-gray-900)' }} />
                
                <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="btn btn-ghost" style={{ padding: 0, width: 36, height: 36, color: 'var(--color-gray-400)' }} disabled={items.length === 1 || loading}>
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-gray-200)', paddingTop: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 320, background: 'var(--color-gray-50)', padding: 20, borderRadius: 12, border: '1px solid var(--color-gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--color-gray-600)', fontSize: 14 }}>
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--color-gray-600)', fontSize: 14 }}>
                <span>Tax</span>
                <span>{formatCurrency(taxAmount, currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ color: 'var(--color-gray-600)', fontSize: 14 }}>Discount</span>
                <div style={{ position: 'relative', width: 100 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)', fontSize: 14 }}>$</span>
                  <input type="number" className="input" style={{ paddingLeft: 22, height: 32, fontSize: 14 }} value={discountAmount || ''} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} min="0" step="0.01" disabled={loading} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, borderTop: '2px solid var(--color-gray-200)', color: 'var(--color-gray-900)' }}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
            <div>
              <label className="label">Notes to Client</label>
              <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thank you for your business!" disabled={loading} />
            </div>
            <div>
              <label className="label">Terms & Conditions</label>
              <textarea className="input" rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment due within 30 days." disabled={loading} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', position: 'sticky', bottom: 24, padding: '16px 0', background: 'linear-gradient(to top, var(--color-gray-100) 50%, transparent)' }}>
          <button type="button" onClick={() => navigate('/invoices')} className="btn btn-secondary" disabled={loading} style={{ background: 'white' }}>
            Cancel
          </button>
          
          <button type="submit" onClick={() => { statusRef.current = 'draft'; }} className="btn btn-secondary" disabled={loading} style={{ background: 'white' }}>
             Save Draft
          </button>
          
          <button type="submit" onClick={() => { statusRef.current = 'sent'; }} className="btn btn-primary" disabled={loading || !clientId} style={{ boxShadow: 'var(--shadow-lg)' }}>
            {loading && statusRef.current === 'sent' ? <div className="loading" /> : '📨 Send Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
