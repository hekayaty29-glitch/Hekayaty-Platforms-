import { useRoute } from 'wouter';
import { Helmet } from 'react-helmet';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdmin } from '@/context/AdminContext';
import { useAdminUserStats } from '@/hooks/useAdminUserStats';

export default function UserStatsPage() {
  const { isAdmin } = useAdmin();
  const [, params] = useRoute('/admin/users/:id');
  const userId = params?.id ?? '';
  const { data: stats, isLoading, error } = useAdminUserStats(userId);

  if (!isAdmin) return <div className="p-8">Access denied</div>;

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>User Statistics - Admin</title>
        </Helmet>
        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-500">{(error as Error).message}</p>}
        {stats && (
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-3xl font-cinzel font-bold">{stats.username} Statistics</h1>
            <div className="grid grid-cols-2 gap-4 bg-amber-50/10 p-6 rounded border border-amber-500">
              <Stat label="Stories Published" value={stats.stories_published} />
              <Stat label="Words Written" value={stats.words_written.toLocaleString()} />
              <Stat label="Bookmarks Received" value={stats.bookmarks_received} />
              <Stat label="Joined" value={new Date(stats.joined_at).toLocaleDateString()} />
              {stats.vip_since && <Stat label="VIP Since" value={new Date(stats.vip_since).toLocaleDateString()} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-sm text-amber-300">{label}</span>
    </div>
  );
}
