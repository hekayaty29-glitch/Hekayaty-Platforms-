import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/auth";
import { Link, Redirect } from "wouter";
import { Users, BookOpen, Award, Megaphone, DollarSign, BookOpenText } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useAdminAPI } from "@/context/AdminAPIContext";

export default function AdminDashboardPage() {
  const { isAdmin } = useAdmin();
  const { isAuthenticated } = useAuth();
  const { stats } = useAdminAPI();

  if (!isAuthenticated || !isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-[#15100A] text-amber-50 py-20 px-4">
      <Helmet>
        <title>Admin Dashboard - Hekayaty</title>
      </Helmet>

      <div className="container mx-auto max-w-6xl space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold">Admin Dashboard</h1>
          <Link href="/admin/stories">
            <button className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-amber-50 px-4 py-2 rounded transition-colors">
              <BookOpenText className="h-5 w-5" /> Manage Stories
            </button>
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 flex items-center gap-4">
            <Users className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-3xl font-bold">{stats.isLoading ? "-" : stats.data?.users}</p>
              <p className="text-sm text-amber-200">Users</p>
            </div>
          </div>
          <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 flex items-center gap-4">
            <BookOpen className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-3xl font-bold">{stats.isLoading ? "-" : stats.data?.stories}</p>
              <p className="text-sm text-amber-200">Stories</p>
            </div>
          </div>
          <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-3xl font-bold">{stats.isLoading ? "-" : stats.data?.lords}</p>
              <p className="text-sm text-amber-200">Monthly Revenue ($)</p>
            </div>
          </div>
          <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 flex items-center gap-4">
            <Megaphone className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-3xl font-bold">{stats.isLoading ? "-" : (((stats.data?.revenue_month ?? 0)/100).toLocaleString())}</p>
              <p className="text-sm text-amber-200">Revenue</p>
            </div>
          </div>
        </div>

        {/* Recent lists */}
        <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 overflow-auto">
          <h2 className="font-cinzel text-2xl mb-4">Recent Users</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-amber-300">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Username</th>
                <th className="py-2 pr-4">Email</th>
              </tr>
            </thead>
            <tbody>
              {stats.isLoading ? (
                <tr><td className="py-4" colSpan={3}>Loading…</td></tr>
              ) : (
                (stats.data?.recentUsers ?? []).slice(0,5).map((u:any)=> (
                  <tr key={u.id} className="hover:bg-amber-900/50">
                    <td className="py-2 pr-4">{u.id}</td>
                    <td className="py-2 pr-4">{u.username}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Stories */}
        <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 overflow-auto">
          <h2 className="font-cinzel text-2xl mb-4">Recent Stories</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-amber-300">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Author</th>
              </tr>
            </thead>
            <tbody>
              {stats.isLoading ? (
                <tr><td className="py-4" colSpan={3}>Loading…</td></tr>
              ) : (
                (stats.data?.recentStories ?? []).slice(0,5).map((s:any)=> (
                  <tr key={s.id} className="hover:bg-amber-900/50">
                    <td className="py-2 pr-4">{s.id}</td>
                    <td className="py-2 pr-4">{s.title}</td>
                    <td className="py-2 pr-4">{s.author}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
