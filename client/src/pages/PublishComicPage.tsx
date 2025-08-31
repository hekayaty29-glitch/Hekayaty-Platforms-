import { useEffect } from "react";
import { Helmet } from "react-helmet";
import PublishComicForm from "@/components/author/PublishComicForm";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function PublishComicPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="animate-pulse">
          <div className="w-1/3 h-8 bg-amber-200 rounded mb-4"></div>
          <div className="w-2/3 h-4 bg-amber-200 rounded mb-8"></div>
          <div className="w-full h-96 bg-amber-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Publish Comic - TaleKeeper</title>
        <meta name="description" content="Publish your comics to entertain readers." />
      </Helmet>

      <div className="bg-gradient-to-b from-amber-500/10 to-amber-50/10 pt-8 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <h1 className="font-cinzel text-3xl font-bold text-brown-dark">Publish Your Comic</h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              Share your visual stories with the world.
            </p>
          </div>

          {!user.isPremium && (
            <Card className="border-amber-500/30 bg-amber-50/60 mb-8">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-amber-800 text-lg">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Free Account Limitations
                </CardTitle>
                <CardDescription>
                  Free accounts can publish up to 1 comic. Upgrade for more.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <strong>Note:</strong> Once you reach this limit, you need to <a href="/upgrade" className="text-amber-500 hover:text-amber-700 font-medium">upgrade to premium</a>.
                </p>
              </CardContent>
            </Card>
          )}

          <PublishComicForm isPremium={user.isPremium} />
        </div>
      </div>
    </>
  );
}
