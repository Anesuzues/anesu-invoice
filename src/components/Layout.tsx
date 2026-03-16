import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { company } = useCompany();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '250px',
        backgroundColor: 'white',
        borderRight: '1px solid var(--color-gray-200)',
        padding: 'var(--spacing-lg)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--color-primary)',
            marginBottom: 'var(--spacing-xs)'
          }}>
            Invoice Manager
          </h1>
          {company && (
            <p style={{ fontSize: '14px', color: 'var(--color-gray-600)' }}>
              {company.name}
            </p>
          )}
        </div>

        <nav style={{ flex: 1 }}>
          <NavLink to="/" active={isActive('/')}>Dashboard</NavLink>
          <NavLink to="/invoices" active={isActive('/invoices')}>Invoices</NavLink>
          <NavLink to="/clients" active={isActive('/clients')}>Clients</NavLink>
          <NavLink to="/products" active={isActive('/products')}>Products</NavLink>
          <NavLink to="/settings" active={isActive('/settings')}>Settings</NavLink>
        </nav>

        <button
          onClick={handleSignOut}
          className="btn btn-secondary"
          style={{ width: '100%' }}
        >
          Sign Out
        </button>
      </aside>

      <main style={{
        flex: 1,
        padding: 'var(--spacing-xl)',
        overflowY: 'auto',
        backgroundColor: 'var(--color-gray-50)'
      }}>
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        marginBottom: 'var(--spacing-xs)',
        borderRadius: 'var(--radius-md)',
        fontSize: '14px',
        fontWeight: '500',
        color: active ? 'var(--color-primary)' : 'var(--color-gray-700)',
        backgroundColor: active ? 'rgba(0, 102, 204, 0.1)' : 'transparent',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {children}
    </Link>
  );
}
