import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import type { Database } from '../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];

export default function Clients() {
  const { company } = useCompany();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    notes: ''
  });

  useEffect(() => {
    if (company) {
      loadClients();
    }
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
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zip: client.zip || '',
        country: client.country || '',
        notes: client.notes || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      if (editingClient) {
        await supabase
          .from('clients')
          .update(formData as any)
          .eq('id', editingClient.id);
      } else {
        await supabase
          .from('clients')
          .insert({ ...formData, company_id: company.id } as any);
      }

      setShowModal(false);
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      await supabase.from('clients').delete().eq('id', id);
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Clients</h1>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          + Add Client
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <div className="loading"></div>
          </div>
        ) : clients.length === 0 ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-md)' }}>
              No clients yet
            </p>
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              Add your first client
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td style={{ fontWeight: '600' }}>{client.name}</td>
                  <td>{client.email || '-'}</td>
                  <td>{client.phone || '-'}</td>
                  <td>
                    {client.city && client.state
                      ? `${client.city}, ${client.state}`
                      : client.city || client.state || '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleOpenModal(client)}
                      className="btn btn-sm btn-secondary"
                      style={{ marginRight: 'var(--spacing-xs)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: 'var(--spacing-xl)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: 'var(--spacing-lg)' }}>
                  {editingClient ? 'Edit Client' : 'Add Client'}
                </h2>

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label className="label">Name *</label>
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

                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingClient ? 'Update' : 'Add'} Client
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
