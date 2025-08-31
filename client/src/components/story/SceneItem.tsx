import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface Scene {
  id: number;
  text: string;
  photoUrl: string;
  audioUrl?: string;
}

export default function SceneItem({
  scene,
  onUpdate,
  onDelete,
}: {
  scene: Scene;
  onUpdate: (data: Partial<Scene>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(scene.text);
  const [photo, setPhoto] = React.useState(scene.photoUrl);
  const [audio, setAudio] = React.useState(scene.audioUrl || "");

  if (editing) {
    return (
      <div className="border-t pt-2 space-y-2">
        <textarea
          className="w-full bg-white/80 border px-2 py-1 rounded-md text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          className="w-full bg-white/80 border px-2 py-1 rounded-md text-sm"
          value={photo}
          placeholder="Photo URL"
          onChange={(e) => setPhoto(e.target.value)}
        />
        <input
          className="w-full bg-white/80 border px-2 py-1 rounded-md text-sm"
          value={audio}
          placeholder="Audio URL"
          onChange={(e) => setAudio(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => {
              onUpdate({ text, photoUrl: photo, audioUrl: audio });
              setEditing(false);
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 border-t pt-2 relative group">
      {scene.photoUrl && (
        <img
          src={scene.photoUrl}
          alt="scene"
          className="h-32 w-full object-cover rounded"
        />
      )}
      <p className="text-sm mt-1 whitespace-pre-wrap">{scene.text}</p>
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
        <Button size="icon" variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
