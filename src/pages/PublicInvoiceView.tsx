import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import type { Database } from '../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  clients: Database['public']['Tables']['clients']['Row'];
  companies: Database['public']['Tables']['companies']['Row'];
  invoice_items: Database['public']['Tables']['invoice_items']['Row'][];
};

export default function PublicInvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewed, setViewed] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoice();
      markAsViewed();
    }
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;

    try {
      // Use edge function to fetch invoice (bypasses RLS for public access)
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-public-invoice/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load invoice');
      }

      setInvoice(result.invoice);
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async () => {
    // Viewing is now handled by the edge function
    if (!viewed) {
      setViewed(true);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) {
      alert('Invoice data not available');
      return;
    }
    
    try {
      generateInvoicePDF(invoice);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Could not generate PDF. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    const currencyCode = invoice?.companies?.currency || 'ZAR';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        }}>
          <div className="loading"></div>
          <p style={{ marginTop: '20px', textAlign: 'center' }}>Loading your invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px', color: '#dc3545' }}>
            Invoice Not Found
          </h1>
          <p style={{ color: '#6c757d' }}>
            The invoice you're looking for doesn't exist or may have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
              Invoice {invoice.invoice_number}
            </h1>
            {/* Removed status badge - clients don't need to see internal status */}
          </div>

          <button 
            onClick={handleDownloadPDF} 
            style={{
              background: 'linear-gradient(45deg, #28a745, #20c997)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            📄 Download PDF
          </button>
        </div>

        {/* Invoice Details */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        }}>
          {/* Company and Client Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            marginBottom: '40px',
            paddingBottom: '30px',
            borderBottom: '2px solid #e9ecef'
          }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#6c757d', marginBottom: '15px' }}>
                FROM
              </h3>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px', color: '#2c3e50' }}>
                {invoice.companies.name}
              </h2>
              {invoice.companies.address && (
                <p style={{ color: '#6c757d', fontSize: '14px', lineHeight: '1.5' }}>
                  {invoice.companies.address}<br />
                  {invoice.companies.city}, {invoice.companies.state} {invoice.companies.zip}
                </p>
              )}
              {invoice.companies.email && (
                <p style={{ color: '#007bff', fontSize: '14px', marginTop: '5px' }}>
                  📧 {invoice.companies.email}
                </p>
              )}
              {invoice.companies.phone && (
                <p style={{ color: '#007bff', fontSize: '14px' }}>
                  📞 {invoice.companies.phone}
                </p>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#6c757d', marginBottom: '15px' }}>
                BILL TO
              </h3>
              <p style={{ fontWeight: '600', marginBottom: '10px', fontSize: '18px' }}>
                {invoice.clients.name}
              </p>
              {invoice.clients.address && (
                <p style={{ color: '#6c757d', fontSize: '14px', lineHeight: '1.5' }}>
                  {invoice.clients.address}<br />
                  {invoice.clients.city}, {invoice.clients.state} {invoice.clients.zip}
                </p>
              )}
              {invoice.clients.email && (
                <p style={{ color: '#6c757d', fontSize: '14px', marginTop: '5px' }}>
                  {invoice.clients.email}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Meta */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
            padding: '25px',
            background: '#f8f9fa',
            borderRadius: '10px'
          }}>
            <div>
              <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '600' }}>Invoice Number</span>
              <p style={{ fontSize: '18px', fontWeight: '700', margin: '5px 0 0 0' }}>{invoice.invoice_number}</p>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '600' }}>Issue Date</span>
              <p style={{ fontSize: '16px', margin: '5px 0 0 0' }}>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '600' }}>Due Date</span>
              <p style={{ 
                fontSize: '16px', 
                margin: '5px 0 0 0',
                fontWeight: '600'
              }}>
                {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Line Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Description</th>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Qty</th>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Price</th>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Tax</th>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_items.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '15px' }}>{item.description}</td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>{item.tax_rate}%</td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '350px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid #e9ecef'
              }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid #e9ecef'
              }}>
                <span>Tax:</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #e9ecef',
                  color: '#28a745'
                }}>
                  <span>Discount:</span>
                  <span>-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '20px 0 10px 0',
                fontSize: '24px',
                fontWeight: '700',
                borderTop: '3px solid #2c3e50',
                color: '#2c3e50'
              }}>
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <div style={{
              marginTop: '40px',
              paddingTop: '30px',
              borderTop: '2px solid #e9ecef'
            }}>
              {invoice.notes && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#2c3e50' }}>
                    📝 Notes
                  </h3>
                  <p style={{ color: '#6c757d', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {invoice.notes}
                  </p>
                </div>
              )}

              {invoice.terms && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#2c3e50' }}>
                    📋 Terms & Conditions
                  </h3>
                  <p style={{ color: '#6c757d', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {invoice.terms}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{
            marginTop: '40px',
            paddingTop: '30px',
            borderTop: '2px solid #e9ecef',
            textAlign: 'center',
            color: '#6c757d',
            fontSize: '14px'
          }}>
            <p style={{ margin: 0 }}>
              Thank you for your business! If you have any questions about this invoice, 
              please contact {invoice.companies.name} at {invoice.companies.email}
            </p>
            <p style={{ margin: '10px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
              Payment is due by {format(new Date(invoice.due_date), 'MMMM dd, yyyy')}
            </p>
          </div>

          {/* Bank Details Section */}
          {(invoice.companies.bank_name || invoice.companies.bank_branch_code || invoice.companies.bank_account_number || invoice.companies.payment_instructions) && (
            <div style={{
              marginTop: '30px',
              padding: '25px',
              background: '#f8f9fa',
              borderRadius: '10px',
              border: '2px solid #e9ecef'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '15px', 
                color: '#2c3e50',
                textAlign: 'center'
              }}>
                🏦 Payment Information
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                {invoice.companies.bank_name && (
                  <div>
                    <strong style={{ color: '#495057' }}>Bank Name:</strong>
                    <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>{invoice.companies.bank_name}</p>
                  </div>
                )}

                {invoice.companies.bank_branch_code && (
                  <div>
                    <strong style={{ color: '#495057' }}>Branch Code:</strong>
                    <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>{invoice.companies.bank_branch_code}</p>
                  </div>
                )}
                
                {invoice.companies.bank_account_type && (
                  <div>
                    <strong style={{ color: '#495057' }}>Account Type:</strong>
                    <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>{invoice.companies.bank_account_type}</p>
                  </div>
                )}
                
                {invoice.companies.bank_account_name && (
                  <div>
                    <strong style={{ color: '#495057' }}>Account Name:</strong>
                    <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>{invoice.companies.bank_account_name}</p>
                  </div>
                )}
                
                {invoice.companies.bank_account_number && (
                  <div>
                    <strong style={{ color: '#495057' }}>Account Number:</strong>
                    <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontFamily: 'monospace' }}>
                      {invoice.companies.bank_account_number}
                    </p>
                  </div>
                )}
                
                {invoice.companies.bank_routing_number && (
                  <div>
                    <strong style={{ color: '#495057' }}>Branch Number:</strong>
                    <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontFamily: 'monospace' }}>
                      {invoice.companies.bank_routing_number}
                    </p>
                  </div>
                )}
                
                {invoice.companies.bank_swift_code && (
                  <div>
                    <strong style={{ color: '#495057' }}>SWIFT Code:</strong>
                    <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontFamily: 'monospace' }}>
                      {invoice.companies.bank_swift_code}
                    </p>
                  </div>
                )}
                
                {invoice.companies.bank_iban && (
                  <div>
                    <strong style={{ color: '#495057' }}>IBAN:</strong>
                    <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontFamily: 'monospace', fontSize: '13px' }}>
                      {invoice.companies.bank_iban}
                    </p>
                  </div>
                )}
              </div>
              
              {invoice.companies.payment_instructions && (
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: '#e7f3ff',
                  borderRadius: '8px',
                  borderLeft: '4px solid #007bff'
                }}>
                  <strong style={{ color: '#0c5460' }}>Payment Instructions:</strong>
                  <p style={{ 
                    margin: '8px 0 0 0', 
                    color: '#0c5460', 
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {invoice.companies.payment_instructions}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}