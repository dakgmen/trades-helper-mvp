import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles?: ('tradie' | 'helper' | 'admin')[];
}

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const { user, profile } = useAuth();

  // Hide navigation on auth pages
  if (location.pathname.startsWith('/auth')) {
    return null;
  }

  // Don't render if not authenticated
  if (!user || !profile) {
    return null;
  }

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { path: '/', label: 'Home', icon: '🏠' },
      { path: '/profile', label: 'Profile', icon: '👤' },
    ];

    if (profile.role === 'tradie') {
      return [
        ...baseItems,
        { path: '/jobs/post', label: 'Post Job', icon: '➕', roles: ['tradie'] },
        { path: '/applications', label: 'Applications', icon: '📋' },
        { path: '/payments', label: 'Payments', icon: '💳' },
      ];
    } else if (profile.role === 'helper') {
      return [
        ...baseItems,
        { path: '/jobs', label: 'Find Jobs', icon: '🔍' },
        { path: '/applications', label: 'My Apps', icon: '📋' },
        { path: '/availability', label: 'Schedule', icon: '📅', roles: ['helper'] },
      ];
    } else if (profile.role === 'admin') {
      return [
        ...baseItems,
        { path: '/admin', label: 'Admin', icon: '⚙️', roles: ['admin'] },
        { path: '/jobs', label: 'Jobs', icon: '🔍' },
        { path: '/payments', label: 'Payments', icon: '💳' },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();
  
  // Filter items based on user role
  const filteredItems = navItems.filter(item => 
    !item.roles || item.roles.includes(profile.role)
  );

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="mobile-nav md:hidden">
      {filteredItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
        >
          <span className="text-lg mb-1">{item.icon}</span>
          <span className="font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default MobileNavigation;