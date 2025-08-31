
import { useNotifications } from "@/hooks/useNotifications";
import { Helmet } from "react-helmet";
import { Bell, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth";

export default function NotificationsPage() {
  const { isAuthenticated, user } = useAuth();

  const { notifications, isLoading, isError, markRead, markAllRead } = useNotifications(isAuthenticated && user ? String(user.id) : undefined);

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Notifications — HEKAYATY</title>
      </Helmet>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-2xl flex items-center gap-2 text-brown-dark">
          <Bell className="h-6 w-6" /> Notifications
        </h1>
        {notifications && notifications.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllRead()}
            disabled={false}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <Separator className="mb-6 bg-amber-500/30" />

      {isLoading ? (
        <p>Loading...</p>
      ) : isError ? (
        <p className="text-red-500">Failed to load notifications.</p>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={
                n.read
                  ? "border border-gray-300 bg-white"
                  : "border border-amber-400 bg-amber-50/30"
              }
            >
              <CardContent className="p-4 flex items-start gap-4">
                {n.read ? (
                  <Check className="h-5 w-5 text-green-600 mt-1" />
                ) : (
                  <Bell className="h-5 w-5 text-amber-600 mt-1" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-brown-dark mb-1">{n.message}</p>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
                {!n.read && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => markRead(n.id)}
                    disabled={false}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-amber-50/50 rounded-lg border border-amber-500/20">
          <Bell className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h3 className="font-cinzel text-lg text-brown-dark">You're all caught up!</h3>
          <p className="text-gray-600 mt-2">No new notifications at the moment.</p>
        </div>
      )}
    </div>
  );
}
