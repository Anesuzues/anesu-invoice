import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

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

  const isActive = (path: string) => location.pathname === path;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <h1 className="mobile-title">Invoice Manager</h1>
          <button 
            className="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      <div className="layout-content">
        {/* Sidebar */}
        <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <h1 className="sidebar-title">Invoice Manager</h1>
            {company && (
              <p className="company-name">{company.name}</p>
            )}
            {/* Close button for mobile */}
            <button 
              className="mobile-close-button"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/" active={isActive('/')} onClick={closeMobileMenu}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/invoices" active={isActive('/invoices')} onClick={closeMobileMenu}>
              📄 Invoices
            </NavLink>
            <NavLink to="/clients" active={isActive('/clients')} onClick={closeMobileMenu}>
              👥 Clients
            </NavLink>
            <NavLink to="/products" active={isActive('/products')} onClick={closeMobileMenu}>
              📦 Products
            </NavLink>
            <NavLink to="/settings" active={isActive('/settings')} onClick={closeMobileMenu}>
              ⚙️ Settings
            </NavLink>
          </nav>

          <button
            onClick={() => {
              handleSignOut();
              closeMobileMenu();
            }}
            className="sign-out-button"
          >
            🚪 Sign Out
          </button>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavLink({ 
  to, 
  active, 
  children, 
  onClick 
}: { 
  to: string; 
  active: boolean; 
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`nav-link ${active ? 'active' : ''}`}
    >
      {children}
    </Link>
  );
}