import { useRef, useState } from "react";
import { uploadImage } from "../../lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface Props {
  url?: string | null;
  onUploaded: (url: string) => void;
  className?: string;
}

export default function AvatarUploader({ url, onUploaded, className }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const secureUrl = await uploadImage(file);
      onUploaded(secureUrl);
    } catch (err) {
      console.error(err);
      alert("Upload failed, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <img
        src={url ?? "/placeholder-avatar.png"}
        alt="avatar"
        className="h-24 w-24 rounded-full object-cover border"
      />
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute -bottom-2 -right-2"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <Camera className="h-4 w-4" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
