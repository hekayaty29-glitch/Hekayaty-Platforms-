import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdsBanner from "@/components/AdsBanner";
import { FlagsProvider, useFlag } from "@/lib/flags";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "./lib/auth";
import { StoriesProvider } from "@/context/StoriesContext";
import { AdminProvider } from "@/context/AdminContext";
import { AdminDataProvider } from "@/context/AdminDataContext";
import { AdminAPIProvider } from "@/context/AdminAPIContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PublishFAB from "@/components/layout/PublishFAB";
import HekyChat from "@/components/chat/HekyChat";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import UserProfilePage from "@/pages/UserProfilePage";
import AuthorProfilePage from "@/pages/AuthorProfilePage";
import ArtGalleryPage from "@/pages/ArtGalleryPage";
import StoryPage from "@/pages/StoryPage";
import PublishStoryPage from "@/pages/PublishStoryPage";
import PublishStoryWizardPage from "@/pages/PublishStoryWizardPage";
import PublishComicWizardPage from "@/pages/PublishComicWizardPage";
import WorkspacePage from "@/pages/WorkspacePage";
import GenrePage from "@/pages/GenrePage";
import GenreStoriesPage from "@/pages/GenreStoriesPage";
import NewUserProfilePage from "@/pages/NewUserProfilePage";
import BrowseStoriesPage from "@/pages/BrowseStoriesPage";
import CommunityPage from "@/pages/CommunityPage";
import ClubDetailPage from "@/pages/ClubDetailPage";
import WorkshopDetailPage from "@/pages/WorkshopDetailPage";
import HekayatyOriginalStoriesPage from "@/pages/HekayatyOriginalStoriesPage";
import OriginalStoryWorldPage from "@/pages/OriginalStoryWorldPage";
import OriginalChaptersPage from "@/pages/OriginalChaptersPage";
import OriginalReadingPage from "@/pages/OriginalReadingPage";
import SpecialStoriesPage from "@/pages/SpecialStoriesPage";
import TaleCraftEditorPage from "@/pages/TaleCraftEditorPage";
import TalesCraftPage from "@/pages/TalesCraftPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import UsersPage from "@/pages/admin/UsersPage";
import CommentsPage from "@/pages/admin/CommentsPage";
import WorkshopsPage from "@/pages/admin/WorkshopsPage";
import ClubsPage from "@/pages/admin/ClubsPage";
import GalleriesPage from "@/pages/admin/GalleriesPage";
import HallOfQuillsAdminPage from "@/pages/admin/HallOfQuillsPage";
import CommunityNewsPage from "@/pages/admin/CommunityNewsPage";
import MainNewsPage from "@/pages/admin/MainNewsPage";
import WritersGemsPage from "@/pages/WritersGemsPage";
import MeetLegendsPage from "@/pages/MeetLegendsPage";
import HallOfQuillsPage from "@/pages/HallOfQuillsPage";
import TalesProphetsPage from "@/pages/TalesProphetsPage";
import CharactersPage from "@/pages/CharactersPage";
import CharacterDetailPage from "@/pages/CharacterDetailPage";
import WhispersOfWordsPage from "@/pages/WhispersOfWordsPage";
import ListenStoryPage from "@/pages/listen/ListenStoryPage";
import ListenChapterPage from "@/pages/listen/ListenChapterPage";
import { RecommendationsPage, WalletPage, InvitePage, AnalyticsDashboardPage, ModerationDashboardPage } from "@/pages/ExtraFeaturePages";
import { InvoicesPage, AuditLogPage, WebhookQueuePage, MetricsPage } from "@/pages/ExtraAdminPages";
import BookBazaarPage from "@/pages/BookBazaarPage";
import SearchPage from "@/pages/SearchPage";
import HekayatyNewsPage from "@/pages/HekayatyNewsPage";
import TermsOfUsePage from "@/pages/TermsOfUsePage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SetupUsernamePage from "@/pages/SetupUsernamePage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import SubscriptionRequestPage from "@/pages/SubscriptionRequestPage";
import SubscriptionPaymentPage from "@/pages/SubscriptionPaymentPage";
import SubscriptionSuccessPage from "@/pages/SubscriptionSuccessPage";
import SubscriptionVerificationPage from "@/pages/SubscriptionVerificationPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ClubPage from "@/pages/ClubPage";
import WorkshopPage from "@/pages/WorkshopPage";
import CommunityGuidelinesPage from "@/pages/CommunityGuidelinesPage";
import ComicsLandPage from "@/pages/ComicsLandPage";
import EpicComicsPage from "@/pages/EpicComicsPage";
import ComicPage from "@/pages/ComicPage";
import ProjectReaderPage from "@/pages/ProjectReaderPage";
import ContactUsPage from "@/pages/ContactUsPage";
import SettingsPage from "@/pages/SettingsPage";
import FAQPage from "@/pages/FAQPage";
import StoryManagerPage from "@/pages/admin/StoryManagerPage";
import StoryCreatePage from "@/pages/admin/StoryCreatePage";
import StoryEditPage from "@/pages/admin/StoryEditPage";
import StoryChaptersPage from "@/pages/StoryChaptersPage";
import ChapterReaderPage from "@/pages/ChapterReaderPage";
import CharacterCreatePage from "@/pages/CharacterCreatePage";

function GuardedRoute({ flag, component: Component }: {flag: string; component: any}) {
  const enabled = useFlag(flag);
  return enabled ? <Component /> : <NotFound />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/home" component={HomePage} />
      <Route path="/genre/:genre" component={GenrePage} />
      <Route path="/login" component={SignInPage} />
      <Route path="/register" component={SignUpPage} />
      <Route path="/profile" component={NewUserProfilePage} />
      <Route path="/profile/:id" component={NewUserProfilePage} />
            <Route path="/author/:id" component={AuthorProfilePage} />
      {/* Specific routes first */}
{/* General routes */}
      <Route path="/projects/:id" component={ProjectReaderPage} />
      <Route path="/story/:id" component={StoryPage} />
      <Route path="/story/:storyId/chapters" component={StoryChaptersPage} />
      <Route path="/story/:storyId/chapter/:chapterId" component={ChapterReaderPage} />
      <Route path="/publish" component={PublishStoryWizardPage} />
      <Route path="/publish-old" component={PublishStoryPage} />
      <Route path="/publish-comic" component={PublishComicWizardPage} />
      <Route path="/workspace" component={() => <GuardedRoute flag="workspace" component={WorkspacePage} />} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/genres/:id" component={GenreStoriesPage} />
      <Route path="/genres" component={GenreStoriesPage} />
      <Route path="/stories" component={HekayatyOriginalStoriesPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/top-rated" component={BrowseStoriesPage} />
      <Route path="/bookmarks" component={BrowseStoriesPage} />
        <Route path="/community" component={CommunityPage} />
        <Route path="/clubs/:id" component={ClubDetailPage} />
        <Route path="/workshops/:id" component={WorkshopDetailPage} />
      <Route path="/gallery" component={ArtGalleryPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/originals" component={HekayatyOriginalStoriesPage} />
      {/* Originals sub-routes */}
      <Route path="/originals/:id" component={OriginalStoryWorldPage} />
      <Route path="/originals/:id/chapters" component={OriginalChaptersPage} />
      <Route path="/originals/:storyId/chapters/:chapterId/pages/:pageNum" component={OriginalReadingPage} />
      <Route path="/clubs/:id" component={ClubPage} />
      <Route path="/workshops/:id" component={WorkshopPage} />
      <Route path="/special" component={SpecialStoriesPage} />
      <Route path="/talecraft/editor" component={TaleCraftEditorPage} />
      <Route path="/talecraft" component={TalesCraftPage} />
      <Route path="/gems" component={WritersGemsPage} />
      <Route path="/whispers" component={WhispersOfWordsPage} />
      <Route path="/listen/:storyId/:chapterId" component={ListenChapterPage} />
      <Route path="/listen/:storyId" component={ListenStoryPage} />
      <Route path="/bazaar" component={() => <GuardedRoute flag="store" component={BookBazaarPage} />} />
      <Route path="/recommendations" component={() => <GuardedRoute flag="recommendations" component={RecommendationsPage} />} />
      <Route path="/wallet" component={() => <GuardedRoute flag="wallet" component={WalletPage} />} />
      <Route path="/invite" component={() => <GuardedRoute flag="referrals" component={InvitePage} />} />
      <Route path="/analytics" component={() => <GuardedRoute flag="analytics" component={AnalyticsDashboardPage} />} />
      <Route path="/moderation" component={() => <GuardedRoute flag="moderation" component={ModerationDashboardPage} />} />
      <Route path="/invoices" component={() => <GuardedRoute flag="billing" component={InvoicesPage} />} />
      <Route path="/admin/audit" component={() => <GuardedRoute flag="audit" component={AuditLogPage} />} />
      <Route path="/admin/webhooks" component={() => <GuardedRoute flag="webhook_queue" component={WebhookQueuePage} />} />
      <Route path="/admin/metrics" component={() => <GuardedRoute flag="observability" component={MetricsPage} />} />
      <Route path="/admin">
        <Route path="/users" component={UsersPage} />
        <Route path="/comments" component={CommentsPage} />
        <Route path="/workshops" component={WorkshopsPage} />
        <Route path="/clubs" component={ClubsPage} />
        <Route path="/galleries" component={GalleriesPage} />
        <Route path="/hall-of-quills" component={HallOfQuillsAdminPage} />
        <Route path="/community-news" component={CommunityNewsPage} />
        <Route path="/main-news" component={MainNewsPage} />
        <Route path="/" component={AdminDashboardPage} />
        <Route path="/stories" component={StoryManagerPage} />
        <Route path="/stories/new" component={StoryCreatePage} />
        <Route path="/stories/:id/edit" component={StoryEditPage} />
      </Route>
<Route path="/characters/new" component={CharacterCreatePage} />
      <Route path="/characters/:id" component={CharacterDetailPage} />
      <Route path="/characters" component={CharactersPage} />
      <Route path="/tales-of-prophets" component={TalesProphetsPage} />
      <Route path="/tales" component={TalesProphetsPage} />
      <Route path="/hall-of-quills" component={HallOfQuillsPage} />
      <Route path="/legends" component={MeetLegendsPage} />
      <Route path="/news" component={HekayatyNewsPage} />
      <Route path="/terms" component={TermsOfUsePage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/subscribe" component={SubscriptionRequestPage} />
      <Route path="/subscription/payment" component={SubscriptionPaymentPage} />
      <Route path="/subscription/verify" component={SubscriptionVerificationPage} />
      <Route path="/subscription/success" component={SubscriptionSuccessPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/setup-username" component={SetupUsernamePage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/community-guidelines" component={CommunityGuidelinesPage} />
      <Route path="/contact" component={ContactUsPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/epic-comics" component={EpicComicsPage} />
      <Route path="/comics" component={ComicsLandPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <FlagsProvider>
        <AuthProvider>
          <AdminProvider>
            <AdminDataProvider>
            <AdminAPIProvider>
            <StoriesProvider>
                <TooltipProvider>
                  <div className="flex flex-col min-h-screen bg-[#151008]">
                    <Header />
        <AdsBanner />
                    <main className="flex-grow">
                      <Router />
                    </main>
                    <Footer />
                    <PublishFAB />
                    <HekyChat />
                    <Toaster />
                  </div>
                </TooltipProvider>
            </StoriesProvider>
            </AdminAPIProvider>
          </AdminDataProvider>
          </AdminProvider>
        </AuthProvider>
      </FlagsProvider>
    </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
