import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddStoryModal({ open, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [genreIds, setGenreIds] = useState<string>("");
  const [coverImage, setCoverImage] = useState("");
  const [isShortStory, setIsShortStory] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const body = {
        title,
        description,
        content,
        coverImage,
        isShortStory,
        isPremium,
        genreIds: genreIds
          .split(/[, ]+/)
          .map((g) => parseInt(g, 10))
          .filter(Boolean),
      };
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create story");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Story created");
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-xl bg-[#1f1b14] text-amber-50 rounded-lg p-6 space-y-4 border border-amber-500 overflow-auto max-h-full">
          <Dialog.Title className="font-cinzel text-2xl mb-2">Add New Story</Dialog.Title>

          <label className="block text-sm mb-1">Title</label>
          <input
            className="w-full mb-2 px-3 py-2 bg-amber-950/40 border border-amber-700 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="block text-sm mb-1 mt-2">Description</label>
          <textarea
            className="w-full mb-2 px-3 py-2 bg-amber-950/40 border border-amber-700 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="block text-sm mb-1 mt-2">Content</label>
          <textarea
            className="w-full mb-2 px-3 py-2 bg-amber-950/40 border border-amber-700 rounded h-40"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <label className="block text-sm mb-1 mt-2">Genre IDs (comma separated)</label>
          <input
            className="w-full mb-2 px-3 py-2 bg-amber-950/40 border border-amber-700 rounded"
            value={genreIds}
            onChange={(e) => setGenreIds(e.target.value)}
          />

          <label className="block text-sm mb-1 mt-2">Cover Image URL</label>
          <input
            className="w-full mb-2 px-3 py-2 bg-amber-950/40 border border-amber-700 rounded"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
          />

          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isShortStory}
                onChange={(e) => setIsShortStory(e.target.checked)}
              />
              <span className="text-sm">Short Story</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
              />
              <span className="text-sm">Premium</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              className="px-4 py-2 bg-amber-600 rounded hover:bg-amber-700 disabled:opacity-50"
              onClick={() => mutate()}
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              className="px-4 py-2 bg-amber-800 rounded hover:bg-amber-900"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
