import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from '../contexts/ToastContext';
import type { Database } from '../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];

export default function Clients() {
  const { company } = useCompany();
  const { showSuccess, showError } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '',
    city: '', state: '', zip: '', country: '', notes: ''
  });

  useEffect(() => {
    if (company) loadClients();
  }, [company]);

  const loadClients = async () => {
    if (!company) return;
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', company.id)
        .order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name, email: client.email || '', phone: client.phone || '',
        address: client.address || '', city: client.city || '', state: client.state || '',
        zip: client.zip || '', country: client.country || '', notes: client.notes || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '', email: '', phone: '', address: '',
        city: '', state: '', zip: '', country: '', notes: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData as any)
          .eq('id', editingClient.id);
        if (error) throw error;
        showSuccess('Client Updated', `${formData.name} has been updated.`);
      } else {
        const { error } = await supabase
          .from('clients')
          .insert({ ...formData, company_id: company.id } as any);
        if (error) throw error;
        showSuccess('Client Added', `${formData.name} has been added successfully.`);
      }

      setShowModal(false);
      loadClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      showError('Save Failed', error.message || 'Could not save client.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Client Deleted', `${name} has been removed.`);
      loadClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      showError('Delete Failed', error.message || 'Cannot delete client with active invoices.');
    }
  };

  const filteredClients = clients.filter(client => {
    const term = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(term) ||
      (client.email || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage your customer database</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <span>+</span> Add Client
        </button>
      </div>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="search-wrapper" style={{ maxWidth: 400 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="input search-input"
            placeholder="Search clients by name or email..."
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
        ) : filteredClients.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <h3>No clients found</h3>
            <p>{searchQuery ? 'No clients match your search' : 'Add your first client to start creating invoices'}</p>
            {!searchQuery && (
              <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ marginTop: 16 }}>
                Add Client
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact Info</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar">
                          {client.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                          {client.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--color-gray-600)' }}>
                        {client.email && <div style={{ color: 'var(--color-gray-900)' }}>{client.email}</div>}
                        {client.phone && <div>{client.phone}</div>}
                        {!client.email && !client.phone && '-'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 14, color: 'var(--color-gray-700)' }}>
                        {client.city && client.state
                          ? `${client.city}, ${client.state}`
                          : client.city || client.state || '-'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenModal(client)}
                          className="btn btn-sm btn-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(client.id, client.name)}
                          className="btn btn-sm btn-danger"
                          style={{ padding: '4px 10px', background: 'transparent', color: 'var(--color-gray-500)', border: 'none', boxShadow: 'none' }}
                          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.background = 'var(--color-error-light)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--color-gray-500)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '24px 32px' }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.01em' }}>
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </h2>

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Name *</label>
                  <input
                    type="text" className="input" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
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

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Street Address</label>
                  <input
                    type="text" className="input" value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="label">City</label>
                    <input
                      type="text" className="input" value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">State / Prov</label>
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

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Country</label>
                  <input
                    type="text" className="input" value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: 32 }}>
                  <label className="label">Internal Notes</label>
                  <textarea
                    className="input" rows={2} value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Only visible to your team"
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--color-gray-200)' }}>
                  <button
                    type="button" onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingClient ? 'Save Changes' : 'Add Client'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
