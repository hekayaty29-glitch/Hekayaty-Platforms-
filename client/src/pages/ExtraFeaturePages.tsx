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

export const RecommendationsPage = () => <Page title="Recommendations" />;
export const WalletPage = () => <Page title="My Wallet" />;
export const InvitePage = () => <Page title="Invite Friends" />;
export const AnalyticsDashboardPage = () => <Page title="Analytics Dashboard" />;
export const ModerationDashboardPage = () => <Page title="Moderation Queue" />;
