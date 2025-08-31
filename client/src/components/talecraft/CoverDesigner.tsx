import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Download,
  RotateCcw
} from "lucide-react";
import { attemptDownload } from "@/lib/downloadGate";
import { useRoles } from "@/hooks/useRoles";

interface CoverDesign {
  title: string;
  subtitle: string;
  author: string;
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientDirection: 'to-r' | 'to-br' | 'to-b' | 'to-bl';
  backgroundImage?: string;
  titleFont: string;
  titleSize: number;
  titleColor: string;
  titleAlign: 'left' | 'center' | 'right';
  subtitleFont: string;
  subtitleSize: number;
  subtitleColor: string;
  authorFont: string;
  authorSize: number;
  authorColor: string;
  template: string;
}

const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    preview: '📚',
    style: {
      titleFont: 'serif',
      titleSize: 48,
      titleAlign: 'center' as const,
      subtitleSize: 24,
      authorSize: 18,
      backgroundType: 'gradient' as const,
      gradientStart: '#1e3a8a',
      gradientEnd: '#3730a3',
      gradientDirection: 'to-br' as const
    }
  },
  {
    id: 'modern',
    name: 'Modern',
    preview: '🎨',
    style: {
      titleFont: 'sans-serif',
      titleSize: 52,
      titleAlign: 'left' as const,
      subtitleSize: 20,
      authorSize: 16,
      backgroundType: 'gradient' as const,
      gradientStart: '#dc2626',
      gradientEnd: '#ea580c',
      gradientDirection: 'to-r' as const
    }
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    preview: '✨',
    style: {
      titleFont: 'serif',
      titleSize: 44,
      titleAlign: 'center' as const,
      subtitleSize: 22,
      authorSize: 18,
      backgroundType: 'gradient' as const,
      gradientStart: '#581c87',
      gradientEnd: '#7c2d12',
      gradientDirection: 'to-bl' as const
    }
  }
];

interface CoverDesignerProps {
  onExport?: (design: CoverDesign) => void;
}

export default function CoverDesigner({ onExport }: CoverDesignerProps) {
  const [design, setDesign] = useState<CoverDesign>({
    title: 'Your Amazing Story',
    subtitle: 'A Tale of Adventure',
    author: 'Author Name',
    backgroundType: 'gradient',
    backgroundColor: '#3b82f6',
    gradientStart: '#1e3a8a',
    gradientEnd: '#3730a3',
    gradientDirection: 'to-br',
    titleFont: 'serif',
    titleSize: 48,
    titleColor: '#ffffff',
    titleAlign: 'center',
    subtitleFont: 'sans-serif',
    subtitleSize: 24,
    subtitleColor: '#e5e7eb',
    authorFont: 'sans-serif',
    authorSize: 18,
    authorColor: '#d1d5db',
    template: 'classic'
  });

  const roles = useRoles();

  const updateDesign = (updates: Partial<CoverDesign>) => {
    setDesign(prev => ({ ...prev, ...updates }));
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    updateDesign({
      ...template.style,
      template: template.id,
      titleColor: '#ffffff',
      subtitleColor: '#e5e7eb',
      authorColor: '#d1d5db'
    });
  };

  const getBackgroundStyle = () => {
    switch (design.backgroundType) {
      case 'color':
        return { backgroundColor: design.backgroundColor };
      case 'gradient':
        return {
          background: `linear-gradient(${design.gradientDirection}, ${design.gradientStart}, ${design.gradientEnd})`
        };
      case 'image':
        return {
          backgroundImage: design.backgroundImage ? `url(${design.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        };
      default:
        return {};
    }
  };

  const getFontClass = (font: string) => {
    const fontMap: Record<string, string> = {
      'serif': 'font-serif',
      'sans-serif': 'font-sans',
      'monospace': 'font-mono'
    };
    return fontMap[font] || 'font-sans';
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      {/* Controls Sidebar */}
      <aside className="w-80 border-r border-gray-700 bg-gray-900/50 flex flex-col overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Cover Designer</h2>
          
          {/* Templates */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Templates</h3>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant={design.template === template.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => applyTemplate(template)}
                  className="flex flex-col h-16 p-2"
                >
                  <div className="text-lg mb-1">{template.preview}</div>
                  <div className="text-xs">{template.name}</div>
                </Button>
              ))}
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Title</label>
              <Input
                value={design.title}
                onChange={(e) => updateDesign({ title: e.target.value })}
                className="text-sm"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Subtitle</label>
              <Input
                value={design.subtitle}
                onChange={(e) => updateDesign({ subtitle: e.target.value })}
                className="text-sm"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Author</label>
              <Input
                value={design.author}
                onChange={(e) => updateDesign({ author: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          {/* Typography */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Typography</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Title Size</label>
                <Slider
                  value={[design.titleSize]}
                  onValueChange={([value]) => updateDesign({ titleSize: value })}
                  min={24}
                  max={72}
                  step={2}
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-400 block mb-1">Title Color</label>
                <input
                  type="color"
                  value={design.titleColor}
                  onChange={(e) => updateDesign({ titleColor: e.target.value })}
                  className="w-full h-8 rounded border border-gray-600"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Background Color</label>
                <input
                  type="color"
                  value={design.backgroundColor}
                  onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                  className="w-full h-8 rounded border border-gray-600"
                />
              </div>
            </div>
          </div>

          <Button onClick={() => attemptDownload(() => alert('Export functionality would generate PDF/PNG'), roles)} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export Cover
          </Button>
        </div>
      </aside>

      {/* Preview */}
      <main className="flex-1 flex items-center justify-center p-8 bg-gray-100">
        <div
          className="relative shadow-2xl"
          style={{
            width: '400px',
            height: '600px',
            ...getBackgroundStyle()
          }}
        >
          <div className="absolute inset-0 flex flex-col justify-between p-8 text-center">
            <div className="flex-1 flex flex-col justify-center">
              <h1
                className={`${getFontClass(design.titleFont)} font-bold leading-tight mb-4`}
                style={{
                  fontSize: `${design.titleSize * 0.6}px`,
                  color: design.titleColor,
                  textAlign: design.titleAlign
                }}
              >
                {design.title}
              </h1>
              
              {design.subtitle && (
                <p
                  className={`${getFontClass(design.subtitleFont)} mb-8`}
                  style={{
                    fontSize: `${design.subtitleSize * 0.6}px`,
                    color: design.subtitleColor
                  }}
                >
                  {design.subtitle}
                </p>
              )}
            </div>
            
            <div>
              <p
                className={`${getFontClass(design.authorFont)}`}
                style={{
                  fontSize: `${design.authorSize * 0.6}px`,
                  color: design.authorColor
                }}
              >
                {design.author}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
