import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { user, session } = await signUp(email, password);
      if (user && !session) {
        setSuccess('Verification email sent! Please check your inbox to verify your account before signing in.');
        setEmail('');
        setPassword('');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Hero Panel */}
      <div className="auth-hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
              borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 22,
              boxShadow: '0 4px 20px rgba(79,70,229,0.5)'
            }}>⚡</div>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>InvoiceApp</span>
          </div>

          <h1 style={{
            fontSize: 40, fontWeight: 800, color: 'white',
            lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 20
          }}>
            Your business,<br />
            <span style={{ color: '#818cf8' }}>professionally invoiced.</span>
          </h1>
          <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, maxWidth: 360 }}>
            Join thousands of freelancers and businesses who use InvoiceApp to get paid on time.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '🚀', text: 'Set up in under 2 minutes' },
              { icon: '🔒', text: 'Bank-grade secure infrastructure' },
              { icon: '💸', text: 'Free to get started' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15
                }}>{icon}</div>
                <span style={{ fontSize: 14, color: '#cbd5e1' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-gray-900)', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Create your account
            </h2>
            <p style={{ fontSize: 15, color: 'var(--color-gray-500)' }}>
              Get started for free, no credit card required
            </p>
          </div>

          {error && <div className="error-message" style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
          {success && <div className="success-message" style={{ color: '#166534', backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid #bbf7d0' }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Email address</label>
              <input
                type="email" className="input" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required disabled={loading}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password" className="input" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required minLength={6} disabled={loading}
              />
            </div>
            <button
              type="submit" className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? <><div className="loading" />Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--color-gray-500)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
