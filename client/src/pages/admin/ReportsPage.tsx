import { Helmet } from 'react-helmet';
import { useAdmin } from '@/context/AdminContext';
import { useAdminAPI } from '@/context/AdminAPIContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReportsPage() {
  const { isAdmin } = useAdmin();
  const { reports, updateReportStatus } = useAdminAPI();

  if (!isAdmin) return <div className="p-8">Access denied</div>;

  if (reports.isLoading) return <div className="p-8">Loading…</div>;
  if (reports.error) return <div className="p-8 text-red-500">{reports.error.message}</div>;

  const handleStatusChange = (id: string, status: string) => {
    updateReportStatus(id, status);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>Reports Moderation - Admin</title>
        </Helmet>
        <h1 className="text-3xl font-bold font-cinzel mb-6">Reports</h1>
        <table className="min-w-full text-sm bg-amber-50/10 border border-amber-500">
          <thead>
            <tr className="text-left text-amber-300">
              <th className="p-3">ID</th>
              <th className="p-3">Type</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.data?.map((r) => (
              <tr key={r.id} className="hover:bg-amber-900/50">
                <td className="p-3">{r.id}</td>
                <td className="p-3">{r.content_type}</td>
                <td className="p-3 max-w-md line-clamp-2">{r.reason}</td>
                <td className="p-3 capitalize">{r.status}</td>
                <td className="p-3">
                  <Select value={r.status} onValueChange={(val) => handleStatusChange(r.id, val)}>
                    <SelectTrigger className="w-32 bg-amber-700/30 border-amber-500 text-amber-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1d140d] text-amber-50 border-amber-500">
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
