import { Helmet } from 'react-helmet';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdmin } from '@/context/AdminContext';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function AnalyticsPage() {
  const { isAdmin } = useAdmin();
  const { data = [], isLoading, error } = useAdminAnalytics();

  if (!isAdmin) return <div className="p-8">Access denied</div>;

  const dates = data.map((d) => d.date);
  const visits = data.map((d) => d.visits);
  // convert to dollars as number with two decimals
  const revenue = data.map((d) => Number((d.revenue_cents / 100).toFixed(2)));

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: 'Visits',
        data: visits,
        borderColor: 'rgb(251 191 36)',
        backgroundColor: 'rgba(251 191 36 / 0.2)',
      },
      {
        label: 'Revenue ($)',
        data: revenue,
        borderColor: 'rgb(34 197 94)',
        backgroundColor: 'rgba(34 197 94 / 0.2)',
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#FCD34D' },
      },
      y1: {
        beginAtZero: true,
        position: 'right' as const,
        ticks: { color: '#4ADE80' },
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: { labels: { color: '#F1F5F9' } },
    },
  } as any;

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-[#15100A] text-amber-50 min-h-screen">
        <Helmet>
          <title>Analytics - Admin</title>
        </Helmet>
        <h1 className="text-3xl font-bold font-cinzel mb-6">Site Analytics</h1>
        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-500">{(error as Error).message}</p>}
        {!isLoading && !error && (
          <div className="bg-amber-50/10 p-6 rounded border border-amber-500">
            <Line data={chartData} options={options} />
          </div>
        )}
      </main>
    </div>
  );
}
