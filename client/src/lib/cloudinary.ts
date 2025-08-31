export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string);
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Cloudinary upload failed");
  return json.secure_url as string;
}
