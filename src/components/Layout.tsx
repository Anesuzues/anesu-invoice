import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

const NAV_ITEMS = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/invoices', icon: '📄', label: 'Invoices' },
  { to: '/clients', icon: '👥', label: 'Clients' },
  { to: '/products', icon: '📦', label: 'Products' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <span className="mobile-title">⚡ InvoiceApp</span>
          <button
            className="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
              <span /><span /><span />
            </div>
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu} />
      )}

      <div className="layout-content">
        {/* Sidebar */}
        <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo-row">
              <div className="sidebar-logo-mark">⚡</div>
              <span className="sidebar-title">InvoiceApp</span>
            </div>
            {company && <p className="company-name">{company.name}</p>}
            <button
              className="mobile-close-button"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >×</button>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-nav-label">Menu</div>
            {NAV_ITEMS.map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={closeMobileMenu}
                className={`nav-link ${isActive(to) ? 'active' : ''}`}
              >
                <span className="nav-icon">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button
              onClick={() => { handleSignOut(); closeMobileMenu(); }}
              className="sign-out-button"
            >
              <span className="nav-icon">🚪</span>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}