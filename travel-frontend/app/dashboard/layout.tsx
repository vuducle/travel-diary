import AuthGuard from '@/components/auth-guard';
import DashboardNav from '@/components/dashboard-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <DashboardNav />
        <main className="pt-20">{children}</main>
      </div>
    </AuthGuard>
  );
}
