import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

export default function Settings() {
  const { user } = useAuth();
  const { company, refreshCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    website: '',
    tax_id: '',
    logo_url: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_routing_number: '',
    bank_swift_code: '',
    bank_iban: '',
    payment_instructions: ''
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        zip: company.zip || '',
        country: company.country || '',
        website: company.website || '',
        tax_id: company.tax_id || '',
        logo_url: company.logo_url || '',
        bank_name: company.bank_name || '',
        bank_account_name: company.bank_account_name || '',
        bank_account_number: company.bank_account_number || '',
        bank_routing_number: company.bank_routing_number || '',
        bank_swift_code: company.bank_swift_code || '',
        bank_iban: company.bank_iban || '',
        payment_instructions: company.payment_instructions || ''
      });
    }
  }, [company]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (company) {
        const { error: updateError } = await supabase
          .from('companies')
          .update(formData as any)
          .eq('id', company.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('companies')
          .insert({ ...formData, user_id: user.id } as any);

        if (insertError) throw insertError;
      }

      await refreshCompany();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save company information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: 'var(--spacing-lg)' }}>
        Company Settings
      </h1>

      {success && (
        <div className="success-message">
          Company information saved successfully!
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
            Basic Information
          </h2>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="label">Company Name *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="label">Address</label>
            <input
              type="text"
              className="input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">City</label>
              <input
                type="text"
                className="input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="label">State</label>
              <input
                type="text"
                className="input"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div>
              <label className="label">ZIP</label>
              <input
                type="text"
                className="input"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="label">Country</label>
            <input
              type="text"
              className="input"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
            🏦 Bank Details & Payment Information
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-md)' }}>
            Add your bank details to make it easier for clients to pay invoices
          </p>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="label">Bank Name</label>
            <input
              type="text"
              className="input"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="e.g., Chase Bank, Bank of America"
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="label">Account Holder Name</label>
            <input
              type="text"
              className="input"
              value={formData.bank_account_name}
              onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
              placeholder="Name on the bank account"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">Account Number</label>
              <input
                type="text"
                className="input"
                value={formData.bank_account_number}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                placeholder="Bank account number"
              />
            </div>
            <div>
              <label className="label">Routing Number</label>
              <input
                type="text"
                className="input"
                value={formData.bank_routing_number}
                onChange={(e) => setFormData({ ...formData, bank_routing_number: e.target.value })}
                placeholder="Bank routing number"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <label className="label">SWIFT Code (International)</label>
              <input
                type="text"
                className="input"
                value={formData.bank_swift_code}
                onChange={(e) => setFormData({ ...formData, bank_swift_code: e.target.value })}
                placeholder="SWIFT/BIC code"
              />
            </div>
            <div>
              <label className="label">IBAN (International)</label>
              <input
                type="text"
                className="input"
                value={formData.bank_iban}
                onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value })}
                placeholder="International Bank Account Number"
              />
            </div>
          </div>

          <div>
            <label className="label">Payment Instructions</label>
            <textarea
              className="input"
              rows={3}
              value={formData.payment_instructions}
              onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
              placeholder="Additional payment instructions for clients (e.g., reference number requirements, payment methods accepted)"
            />
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
            Additional Information
          </h2>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="label">Website</label>
            <input
              type="url"
              className="input"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="label">Tax ID / VAT Number</label>
            <input
              type="text"
              className="input"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Logo URL</label>
            <input
              type="url"
              className="input"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            <p style={{ fontSize: '13px', color: 'var(--color-gray-600)', marginTop: 'var(--spacing-xs)' }}>
              Provide a URL to your company logo
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
        >
          {loading ? <div className="loading"></div> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
