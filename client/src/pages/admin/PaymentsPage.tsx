import { Helmet } from 'react-helmet';
import { useAdmin } from '@/context/AdminContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminPayments } from '@/hooks/useAdminPayments';

export default function PaymentsPage() {
  const { isAdmin } = useAdmin();
  const { data: payments = [], isLoading, error } = useAdminPayments();

  if (!isAdmin) return <div className="p-8">Access denied</div>;

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen overflow-auto">
        <Helmet>
          <title>Payment Logs - Admin</title>
        </Helmet>
        <h1 className="text-3xl font-bold font-cinzel mb-6">Payment Logs</h1>
        <table className="min-w-full text-sm bg-amber-50/10 border border-amber-500">
          <thead>
            <tr className="text-left text-amber-300">
              <th className="p-3">ID</th>
              <th className="p-3">User</th>
              <th className="p-3">Method</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="p-4" colSpan={6}>Loading…</td>
              </tr>
            )}
            {error && (
              <tr>
                <td className="p-4 text-red-500" colSpan={6}>{(error as Error).message}</td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-amber-900/50">
                <td className="p-3 font-mono">{p.id}</td>
                <td className="p-3">{p.username ?? p.user_id}</td>
                <td className="p-3 capitalize">{p.method}</td>
                <td className="p-3">{(p.amount / 100).toFixed(2)} {p.currency}</td>
                <td className="p-3 capitalize">{p.status}</td>
                <td className="p-3">{new Date(p.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
