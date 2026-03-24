import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-gray-50)',
      padding: 'var(--spacing-md)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px'
      }}>
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: 'var(--spacing-xs)',
            textAlign: 'center'
          }}>
            Create Account
          </h1>
          <p style={{
            color: 'var(--color-gray-600)',
            textAlign: 'center',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Start managing your invoices
          </p>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? <div className="loading"></div> : 'Create Account'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-md)',
            fontSize: '14px',
            color: 'var(--color-gray-600)'
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: '500' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
