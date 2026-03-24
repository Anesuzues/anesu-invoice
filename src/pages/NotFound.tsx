import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gridTemplateColumns: '1fr' }}>
      <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
        <div style={{ fontSize: '72px', fontWeight: '800', color: 'var(--color-primary)', letterSpacing: '-0.05em', lineHeight: '1', marginBottom: 'var(--spacing-sm)' }}>
          404
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-gray-900)', marginBottom: 'var(--spacing-md)' }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--color-gray-500)', fontSize: '15px', marginBottom: 'var(--spacing-xl)', maxWidth: '300px', margin: '0 auto var(--spacing-xl)' }}>
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <Link to="/" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', padding: '12px 32px' }}>
          Go back home
        </Link>
      </div>
    </div>
  );
}
