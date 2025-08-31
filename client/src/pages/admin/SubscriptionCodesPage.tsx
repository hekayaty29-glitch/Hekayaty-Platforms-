import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAdmin } from '@/context/AdminContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminSubscriptionCodes } from '@/hooks/useAdminSubscriptionCodes';

export default function SubscriptionCodesPage() {
  const { isAdmin } = useAdmin();
  const { data: codes = [], isLoading, error, createCodes } = useAdminSubscriptionCodes();

  const [count, setCount] = useState('10');
  const [months, setMonths] = useState('1');

  if (!isAdmin) return <div className="p-8">Access denied</div>;

  const handleGenerate = () => {
    const c = parseInt(count, 10);
    const m = parseInt(months, 10);
    if (!c || !m) return alert('Enter valid numbers');
    createCodes.mutate({ count: c, months: m });
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>Subscription Codes - Admin</title>
        </Helmet>
        <h1 className="text-3xl font-bold font-cinzel mb-6">Subscription Codes</h1>

        {/* Generate form */}
        <div className="bg-amber-800/30 p-4 rounded mb-6 flex gap-4 items-end max-w-xl">
          <div className="flex-1">
            <label className="block text-sm mb-1">How many codes?</label>
            <Input type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Duration (months)</label>
            <Input type="number" min="1" value={months} onChange={(e) => setMonths(e.target.value)} />
          </div>
          <Button onClick={handleGenerate} disabled={createCodes.isPending}>Generate</Button>
        </div>

        {/* List */}
        <table className="min-w-full text-sm bg-amber-50/10 border border-amber-500">
          <thead>
            <tr className="text-left text-amber-300">
              <th className="p-3">Code</th>
              <th className="p-3">Months</th>
              <th className="p-3">Used</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="p-4" colSpan={4}>Loading…</td>
              </tr>
            )}
            {error && (
              <tr>
                <td className="p-4 text-red-500" colSpan={4}>{(error as Error).message}</td>
              </tr>
            )}
            {codes.map((c) => (
              <tr key={c.id} className="hover:bg-amber-900/50">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3">{c.months}</td>
                <td className="p-3">{c.used ? 'Yes' : 'No'}</td>
                <td className="p-3">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
