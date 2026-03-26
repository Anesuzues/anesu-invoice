import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from '../contexts/ToastContext';

export default function Settings() {
  const { user } = useAuth();
  const { company, refreshCompany } = useCompany();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '',
    city: '', state: '', zip: '', country: '',
    website: '', tax_id: '', logo_url: '', currency: 'USD',
    bank_name: '', bank_branch_code: '', bank_account_type: '',
    bank_account_name: '', bank_account_number: '',
    bank_routing_number: '', bank_swift_code: '', bank_iban: '',
    payment_instructions: ''
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        email: company.email || '', phone: company.phone || '',
        address: company.address || '', city: company.city || '',
        state: company.state || '', zip: company.zip || '',
        country: company.country || '', website: company.website || '',
        tax_id: company.tax_id || '', logo_url: company.logo_url || '',
        currency: (company as any).currency || 'USD',
        bank_name: company.bank_name || '', 
        bank_branch_code: company.bank_branch_code || '',
        bank_account_type: company.bank_account_type || '',
        bank_account_name: company.bank_account_name || '',
        bank_account_number: company.bank_account_number || '',
        bank_routing_number: company.bank_routing_number || '',
        bank_swift_code: company.bank_swift_code || '', bank_iban: company.bank_iban || '',
        payment_instructions: company.payment_instructions || ''
      });
    }
  }, [company]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      if (company) {
        const { error } = await supabase
          .from('companies')
          .update(formData as any)
          .eq('id', company.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('companies')
          .insert({ ...formData, user_id: user.id } as any);
        if (error) throw error;
      }

      await refreshCompany();
      showSuccess('Settings Saved', 'Your company profile has been updated successfully.');
    } catch (err: any) {
      console.error('Save error:', err);
      showError('Save Failed', err.message || 'Failed to save company information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Settings</h1>
          <p className="page-subtitle">Manage your company profile and banking details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏢</div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Basic Information</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">Company Name *</label>
              <input
                type="text" className="input" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Currency</label>
              <input
                type="text" className="input" value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                placeholder="USD, EUR, GBP..." maxLength={3}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email" className="input" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel" className="input" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="label">Street Address</label>
            <input
              type="text" className="input" value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">City</label>
              <input
                type="text" className="input" value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="label">State / Province</label>
              <input
                type="text" className="input" value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div>
              <label className="label">ZIP / Postal</label>
              <input
                type="text" className="input" value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="label">Country</label>
            <input
              type="text" className="input" value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏦</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Bank Details & Payment Information</h2>
              <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 2 }}>Included on invoices to help clients pay you</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">Bank Name</label>
              <input
                type="text" className="input" value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="e.g., Chase, Bank of America"
              />
            </div>
            <div>
              <label className="label">Branch Code</label>
              <input
                type="text" className="input" value={formData.bank_branch_code}
                onChange={(e) => setFormData({ ...formData, bank_branch_code: e.target.value })}
                placeholder="Branch or Sort Code"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">Account Holder Name</label>
              <input
                type="text" className="input" value={formData.bank_account_name}
                onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                placeholder="Name on bank account"
              />
            </div>
            <div>
              <label className="label">Account Type</label>
              <input
                type="text" className="input" value={formData.bank_account_type}
                onChange={(e) => setFormData({ ...formData, bank_account_type: e.target.value })}
                placeholder="e.g., Checking, Savings"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">Account Number</label>
              <input
                type="text" className="input" value={formData.bank_account_number}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Branch Number</label>
              <input
                type="text" className="input" value={formData.bank_routing_number}
                onChange={(e) => setFormData({ ...formData, bank_routing_number: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">SWIFT / BIC (International)</label>
              <input
                type="text" className="input" value={formData.bank_swift_code}
                onChange={(e) => setFormData({ ...formData, bank_swift_code: e.target.value })}
              />
            </div>
            <div>
              <label className="label">IBAN (International)</label>
              <input
                type="text" className="input" value={formData.bank_iban}
                onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Additional Payment Instructions</label>
            <textarea
              className="input" rows={3} value={formData.payment_instructions}
              onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
              placeholder="e.g., Please include invoice number in payment reference. We also accept PayPal at..."
            />
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-gray-100)', color: 'var(--color-gray-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌐</div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Brand & Tax</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">Website</label>
              <input
                type="url" className="input" value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourcompany.com"
              />
            </div>
            <div>
              <label className="label">Tax ID / VAT Number</label>
              <input
                type="text" className="input" value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Logo URL</label>
            <input
              type="url" className="input" value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://yourcompany.com/logo.png"
            />
            <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 4 }}>
              Provide a direct URL to your company logo image
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: 24 }}>
          <button
            type="submit" className="btn btn-primary btn-lg"
            style={{ boxShadow: 'var(--shadow-lg)' }}
            disabled={loading}
          >
            {loading ? <><div className="loading" />Saving...</> : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
