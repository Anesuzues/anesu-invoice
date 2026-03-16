import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

export default function Products() {
  const { company } = useCompany();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    tax_rate: 0,
    unit: 'item'
  });

  useEffect(() => {
    if (company) {
      loadProducts();
    }
  }, [company]);

  const loadProducts = async () => {
    if (!company) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', company.id)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        tax_rate: product.tax_rate,
        unit: product.unit
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        tax_rate: 0,
        unit: 'item'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      if (editingProduct) {
        await supabase
          .from('products')
          .update(formData as any)
          .eq('id', editingProduct.id);
      } else {
        await supabase
          .from('products')
          .insert({ ...formData, company_id: company.id } as any);
      }

      setShowModal(false);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await supabase.from('products').delete().eq('id', id);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Products & Services</h1>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          + Add Product
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <div className="loading"></div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-md)' }}>
              No products or services yet
            </p>
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              Add your first product
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Tax Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td style={{ fontWeight: '600' }}>{product.name}</td>
                  <td>{product.description || '-'}</td>
                  <td>{product.unit}</td>
                  <td style={{ fontWeight: '600' }}>{formatCurrency(product.price)}</td>
                  <td>{product.tax_rate}%</td>
                  <td>
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="btn btn-sm btn-secondary"
                      style={{ marginRight: 'var(--spacing-xs)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
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
                  {editingProduct ? 'Edit Product' : 'Add Product'}
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

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label className="label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                  <div>
                    <label className="label">Price *</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Tax Rate (%)</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <select
                      className="input"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="item">Item</option>
                      <option value="hour">Hour</option>
                      <option value="day">Day</option>
                      <option value="month">Month</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
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
                    {editingProduct ? 'Update' : 'Add'} Product
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
