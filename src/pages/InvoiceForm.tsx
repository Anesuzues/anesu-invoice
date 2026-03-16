import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import { format, addDays } from 'date-fns';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment due within 30 days');
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    if (company) {
      loadClients();
      loadProducts();
      if (id) {
        loadInvoice();
      }
    }
  }, [company, id]);

  const loadClients = async () => {
    if (!company) return;
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id)
      .order('name');
    setClients(data || []);
  };

  const loadProducts = async () => {
    if (!company) return;
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', company.id)
      .order('name');
    setProducts(data || []);
  };

  const loadInvoice = async () => {
    if (!id || !company) return;

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', id)
      .single();

    if (invoice) {
      const inv = invoice as any;
      setClientId(inv.client_id);
      setIssueDate(inv.issue_date);
      setDueDate(inv.due_date);
      setNotes(inv.notes || '');
      setTerms(inv.terms || '');
      setDiscountAmount(inv.discount_amount);

      if (inv.invoice_items && inv.invoice_items.length > 0) {
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

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }

    setItems(newItems);
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateItem(index, 'product_id', productId);
      updateItem(index, 'description', product.name);
      updateItem(index, 'unit_price', product.price);
      updateItem(index, 'tax_rate', product.tax_rate);
      const amount = items[index].quantity * product.price;
      updateItem(index, 'amount', amount);
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = items.reduce((sum, item) =>
      sum + (item.amount * item.tax_rate / 100), 0
    );
    const total = subtotal + taxAmount - discountAmount;
    return { subtotal, taxAmount, total };
  };

  const generateInvoiceNumber = async () => {
    if (!company) return 'INV-0001';

    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const lastNumber = parseInt(data.invoice_number.split('-')[1]) || 0;
      return `INV-${String(lastNumber + 1).padStart(4, '0')}`;
    }

    return 'INV-0001';
  };

  const handleSubmit = async (e: FormEvent, status: 'draft' | 'sent' = 'draft') => {
    e.preventDefault();
    if (!company) return;

    setError('');
    setLoading(true);

    try {
      const { subtotal, taxAmount, total } = calculateTotals();

      let invoiceNumber = '';
      if (id) {
        const { data } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('id', id)
          .single();
        invoiceNumber = (data as any)?.invoice_number || '';
      } else {
        invoiceNumber = await generateInvoiceNumber();
      }

      const invoiceData = {
        invoice_number: invoiceNumber,
        company_id: company.id,
        client_id: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        status,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total,
        notes,
        terms,
        ...(status === 'sent' && { sent_at: new Date().toISOString() })
      };

      if (id) {
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update(invoiceData as any)
          .eq('id', id);

        if (invoiceError) throw invoiceError;

        await supabase.from('invoice_items').delete().eq('invoice_id', id);

        for (const item of items) {
          await supabase.from('invoice_items').insert({
            invoice_id: id,
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            amount: item.amount
          } as any);
        }
      } else {
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert(invoiceData as any)
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        for (const item of items) {
          await supabase.from('invoice_items').insert({
            invoice_id: invoice!.id,
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            amount: item.amount
          } as any);
        }
      }

      navigate('/invoices');
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div style={{ maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: 'var(--spacing-lg)' }}>
        {id ? 'Edit Invoice' : 'New Invoice'}
      </h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={(e) => handleSubmit(e, 'draft')}>
        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
            Invoice Details
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div>
              <label className="label">Client *</label>
              <select
                className="input"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Issue Date *</label>
              <input
                type="date"
                className="input"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Due Date *</label>
              <input
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Items</h2>
            <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">
              + Add Item
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-sm)',
              alignItems: 'end'
            }}>
              <div>
                <label className="label">Description</label>
                <select
                  className="input"
                  value={item.product_id || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      selectProduct(index, e.target.value);
                    } else {
                      updateItem(index, 'description', '');
                    }
                  }}
                >
                  <option value="">Custom item...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="input"
                  style={{ marginTop: 'var(--spacing-xs)' }}
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Item description"
                  required
                />
              </div>
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  className="input"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="label">Price</label>
                <input
                  type="number"
                  className="input"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="label">Tax %</label>
                <input
                  type="number"
                  className="input"
                  value={item.tax_rate}
                  onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  className="input"
                  value={item.amount.toFixed(2)}
                  disabled
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="btn btn-danger btn-sm"
                disabled={items.length === 1}
              >
                ✕
              </button>
            </div>
          ))}

          <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-gray-200)', paddingTop: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-xl)' }}>
              <div style={{ width: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                  <span>Tax:</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)', alignItems: 'center' }}>
                  <span>Discount:</span>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '120px' }}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '18px',
                  fontWeight: '700',
                  paddingTop: 'var(--spacing-sm)',
                  borderTop: '2px solid var(--color-gray-300)'
                }}>
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the client"
            />
          </div>

          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <label className="label">Terms</label>
            <textarea
              className="input"
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Payment terms and conditions"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={loading}
          >
            {loading ? <div className="loading"></div> : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'sent')}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? <div className="loading"></div> : 'Save & Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
