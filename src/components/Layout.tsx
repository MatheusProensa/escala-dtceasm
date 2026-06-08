import type { ReactNode } from 'react';

interface LayoutProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}

export default function Layout({ sidebar, topbar, children }: LayoutProps) {
  return (
    <div className="app-layout">
      {sidebar}
      <div className="main-content">
        {topbar}
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}
