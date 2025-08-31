import JSZip from "jszip";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

/**
 * Generic interface subset for projects coming from TalesCraftPage.
 */
export interface StoryProject {
  title: string;
  chapters: Array<{
    pages: Array<{
      content: string;
    }>;
  }>;
}

export interface ComicPage {
  id: string;
  title: string;
  elements: any[];
  backgroundColor: string;
}
export interface ComicProject {
  title: string;
  pages: ComicPage[];
}

export interface PhotoProject {
  title: string;
  pages: Array<{
    photoUrl: string;
    caption: string;
  }>;
}

export type ProjectInput =
  | { type: "story"; project: StoryProject }
  | { type: "comic"; project: ComicProject }
  | { type: "photo"; project: PhotoProject };

interface AssetInfo {
  filename: string;
  blob: Blob;
}

/**
 * Main export function: builds a ZIP containing index.html, story.pdf and an assets folder.
 */
export async function exportProject({ type, project }: ProjectInput) {
  const zip = new JSZip();

  // Step 1: build HTML string
  const html = generateHtml(type, project as any);
  zip.file("index.html", html);

  // Step 2: build PDF
  const pdfBlob = await generatePdf(type, project as any);
  zip.file("story.pdf", pdfBlob);

  // Step 3: gather assets
  const assets = await gatherAssets(type, project as any);
  const assetsFolder = zip.folder("assets");
  assets.forEach((asset) => assetsFolder?.file(asset.filename, asset.blob));

  // Step 4: download ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${(project as any).title || "project"}.zip`);
}

function generateHtml(type: string, project: any) {
  if (type === "story") {
    const chaptersHtml = project.chapters
      .map((ch: any) =>
        ch.pages.map((p: any) => p.content).join("<hr style=\"margin:40px 0\">")
      )
      .join("<hr style=\"margin:60px 0;border-top:3px solid #999\">");
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${project.title}</title>
<style>
  body{font-family:Georgia,serif;line-height:1.6;padding:40px;max-width:800px;margin:auto;background:#fafafa}
  img{max-width:100%;height:auto}
</style>
</head>
<body>
<h1 style="text-align:center">${project.title}</h1>
${chaptersHtml}
</body></html>`;
  }
  // For comic & photo we just create placeholder html that embeds images
  if (type === "comic") {
    const pagesHtml = project.pages
      .map((_p: any, idx: number) => `<img src="assets/page-${idx + 1}.png" alt="Page ${idx + 1}" style="width:100%;margin:40px 0">`)
      .join("\n");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${project.title}</title><style>body{font-family:sans-serif;padding:20px;background:#fafafa;text-align:center}</style></head><body><h1>${project.title}</h1>${pagesHtml}</body></html>`;
  }
  if (type === "photo") {
    const imgs = project.pages
      .map((p: any, idx: number) => `<figure><img src="assets/photo-${idx + 1}${getExtension(p.photoUrl)}" alt="Photo ${idx + 1}"><figcaption>${p.caption}</figcaption></figure>`)
      .join("<br>");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${project.title}</title><style>body{font-family:sans-serif;padding:20px;background:#fafafa}figure{text-align:center;margin:40px 0}img{max-width:100%;height:auto}</style></head><body><h1>${project.title}</h1>${imgs}</body></html>`;
  }
  return "";
}

async function generatePdf(type: string, project: any): Promise<Blob> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let cursorY = margin;
  const lineHeight = 16;
  doc.setFont("Times", "Normal");
  doc.setFontSize(12);

  function addPageIfNeeded(extraHeight: number) {
    if (cursorY + extraHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }
  }

  if (type === "story") {
    doc.setFontSize(18);
    const titleLines = doc.splitTextToSize(project.title, pageWidth - margin * 2);
    titleLines.forEach((l: string) => {
      addPageIfNeeded(lineHeight);
      doc.text(l, margin, cursorY);
      cursorY += lineHeight;
    });
    doc.setFontSize(12);

    project.chapters.forEach((ch: any) => {
      ch.pages.forEach((p: any) => {
        const lines = doc.splitTextToSize(p.content.replace(/<[^>]+>/g, ""), pageWidth - margin * 2);
        lines.forEach((line: string) => {
          addPageIfNeeded(lineHeight);
          doc.text(line, margin, cursorY);
          cursorY += lineHeight;
        });
        cursorY += lineHeight; // space between pages
      });
    });
  } else {
    // For comic/photo, simple note
    doc.text(`${project.title} – see HTML for full experience.`, margin, cursorY);
  }

  return doc.output("blob");
}

async function gatherAssets(type: string, project: any): Promise<AssetInfo[]> {
  const list: AssetInfo[] = [];
  if (type === "story") {
    const imgUrls = new Set<string>();
    project.chapters.forEach((ch: any) => {
      ch.pages.forEach((p: any) => {
        (p.content.match(/<img[^>]+src=\"([^\"]+)\"/g) || []).forEach((tag: string) => {
          const match = tag.match(/src=\"([^\"]+)/);
          if (match) imgUrls.add(match[1]);
        });
      });
    });
    for (const url of imgUrls) {
      try {
        const blob = await fetch(url).then((r) => r.blob());
        const filename = `img-${hash(url)}${getExtension(url)}`;
        list.push({ filename, blob });
      } catch (err) {
        console.error("Failed to fetch asset", url, err);
      }
    }
  } else if (type === "photo") {
    for (let i = 0; i < project.pages.length; i++) {
      const p = project.pages[i];
      if (p.photoUrl) {
        try {
          const blob = await fetch(p.photoUrl).then((r) => r.blob());
          list.push({ filename: `photo-${i + 1}${getExtension(p.photoUrl)}`, blob });
        } catch {}
      }
    }
  } else if (type === "comic") {
    // Generate PNGs for each page using an offscreen canvas similar to exportPage
    for (let i = 0; i < project.pages.length; i++) {
      const page = project.pages[i];
      const blob = await renderComicPageToBlob(page);
      list.push({ filename: `page-${i + 1}.png`, blob });
    }
  }
  return list;
}

function getExtension(url: string) {
  const q = url.split("?")[0];
  return q.substring(q.lastIndexOf("."));
}

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

async function renderComicPageToBlob(page: ComicPage): Promise<Blob> {
  const scale = 3;
  const width = 800 * scale;
  const height = 1100 * scale;
  // Use regular canvas so we can leverage Image element decoding easily
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");

  // Draw background
  ctx.scale(scale, scale);
  ctx.fillStyle = page.backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, 800, 1100);

  // Load images
  const imageEls = page.elements.filter((e) => e.type === "image");
  await Promise.all(
    imageEls.map(async (el: any) => {
      if (!el.imageUrl) return;
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = el.imageUrl;
        await img.decode();
        ctx.drawImage(img, el.x, el.y, el.width, el.height);
      } catch {
        // ignore failed image load
      }
    })
  );

  // Optionally draw panels/borders if needed in future

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error("Failed to export page");
      resolve(blob);
    }, "image/png");
  });
}
