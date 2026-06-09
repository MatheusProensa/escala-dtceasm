import type { ReactNode } from 'react';

interface LayoutProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export default function Layout({ sidebar, topbar, children, sidebarOpen, onCloseSidebar }: LayoutProps) {
  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={onCloseSidebar} />
      )}
      <div className={`sidebar-wrapper${sidebarOpen ? ' sidebar-open' : ''}`}>
        {sidebar}
      </div>
      <div className="main-content">
        {topbar}
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}
