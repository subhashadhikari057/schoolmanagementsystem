// app/dashboard/layout.tsx
import React from 'react';
import { AuthGuard } from '@/components/layout/auth-guard';
import DashboardLayoutComponent from '@/components/layout/DashboardLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayoutComponent>{children}</DashboardLayoutComponent>
    </AuthGuard>
  );
}
