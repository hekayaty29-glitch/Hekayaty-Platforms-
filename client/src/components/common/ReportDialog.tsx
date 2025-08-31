import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ReportDialogProps {
  contentId: number | string | undefined;
  contentType: "story" | "comment" | "user" | "art" | string;
  triggerClassName?: string;
}

export default function ReportDialog({ contentId, contentType, triggerClassName }: ReportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!contentId) return;
    if (!reason.trim()) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      await apiRequest("POST", "/api/reports", { contentId, contentType, reason: reason.trim() });
      toast({ title: "Report submitted", description: "Thank you for helping us keep NovelNexus safe." });
      setOpen(false);
      setReason("");
    } catch (err: any) {
      toast({ title: "Failed to submit report", description: err.message || "Try again later", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName ?? "border-red-500 text-red-600 hover:bg-red-600 hover:text-white"}>
          <AlertTriangle className="mr-2 h-4 w-4" /> Report
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-amber-50 border-amber-600">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-brown-dark">Report Content</DialogTitle>
          <DialogDescription>
            Please describe why this content violates our guidelines.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Describe the issue..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="min-h-[120px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
