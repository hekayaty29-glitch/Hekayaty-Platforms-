import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";

interface Props {
  user: { email: string };
  onDeleteAccount?: () => void;
}

export default function SettingsSection({ user, onDeleteAccount }: Props) {
  const [email, setEmail] = useState(user.email);
  const [notifications, setNotifications] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = async () => {
    try {
      await apiRequest("PATCH", "/api/users/me", { email });
      toast.success("Settings updated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update settings");
    }
  };

  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <CardTitle className="font-cinzel">Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="flex items-center justify-between">
          <span>Notifications</span>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>

        <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white w-full">
          Save Changes
        </Button>

        <Button variant="destructive" className="w-full" onClick={() => setConfirmOpen(true)}>
          Delete Account
        </Button>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Account Deletion</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 mb-4">
              This action is irreversible. All your stories, bookmarks and data will be permanently deleted.
            </p>
            <DialogFooter className="justify-end">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDeleteAccount?.();
                  setConfirmOpen(false);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
