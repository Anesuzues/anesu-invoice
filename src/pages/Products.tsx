import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils/currency';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

export default function Products() {
  const { company } = useCompany();
  const { showSuccess, showError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '', description: '', price: 0, tax_rate: 0, unit: 'item'
  });

  useEffect(() => {
    if (company) loadProducts();
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
        name: product.name, description: product.description || '',
        price: product.price, tax_rate: product.tax_rate, unit: product.unit
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: 0, tax_rate: 0, unit: 'item' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(formData as any)
          .eq('id', editingProduct.id);
        if (error) throw error;
        showSuccess('Product Updated', `${formData.name} has been updated.`);
      } else {
        const { error } = await supabase
          .from('products')
          .insert({ ...formData, company_id: company.id } as any);
        if (error) throw error;
        showSuccess('Product Added', `${formData.name} has been added.`);
      }

      setShowModal(false);
      loadProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      showError('Save Failed', error.message || 'Could not save product.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Product Deleted', `${name} has been removed.`);
      loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      showError('Delete Failed', error.message || 'Cannot delete product.');
    }
  };

  const filteredProducts = products.filter(product => {
    const term = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      (product.description || '').toLowerCase().includes(term)
    );
  });

  const currencyCode = (company as any)?.currency || 'ZAR';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Services</h1>
          <p className="page-subtitle">Manage your catalog for quick invoicing</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <span>+</span> Add Product
        </button>
      </div>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="search-wrapper" style={{ maxWidth: 400 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="input search-input"
            placeholder="Search products..."
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
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <h3>No products found</h3>
            <p>{searchQuery ? 'No products match your search' : 'Add your first product or service'}</p>
            {!searchQuery && (
              <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ marginTop: 16 }}>
                Add Product
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Tax Rate</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{product.name}</td>
                    <td>
                      <span style={{ fontSize: 13, color: 'var(--color-gray-600)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.description || '-'}
                      </span>
                    </td>
                    <td><span style={{ textTransform: 'capitalize', color: 'var(--color-gray-700)' }}>{product.unit}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{formatCurrency(product.price, currencyCode)}</td>
                    <td>{product.tax_rate}%</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="btn btn-sm btn-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
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
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Name *</label>
                  <input
                    type="text" className="input" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required autoFocus
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Description</label>
                  <textarea
                    className="input" rows={3} value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
                  <div>
                    <label className="label">Price *</label>
                    <input
                      type="number" className="input" value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      min="0" step="0.01" required
                    />
                  </div>
                  <div>
                    <label className="label">Tax Rate (%)</label>
                    <input
                      type="number" className="input" value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      min="0" step="0.01"
                    />
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <select
                      className="input" value={formData.unit}
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

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--color-gray-200)' }}>
                  <button
                    type="button" onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? 'Save Changes' : 'Add Product'}
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
