import { Helmet } from "react-helmet";

function Page({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#15100A] text-amber-50 p-8">
      <Helmet>
        <title>{title} - Hekayaty</title>
      </Helmet>
      <h1 className="font-cinzel text-3xl">{title} (Coming Soon)</h1>
    </div>
  );
}

export const InvoicesPage = () => <Page title="My Invoices" />;
export const AuditLogPage = () => <Page title="Audit Logs" />;
export const WebhookQueuePage = () => <Page title="Webhook Queue" />;
export const MetricsPage = () => <Page title="Metrics" />;
