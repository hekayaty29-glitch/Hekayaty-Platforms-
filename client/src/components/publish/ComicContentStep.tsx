import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Upload, FileText, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ComicContentStepProps {
  data: {
    pdfUrl: string;
    isPremium: boolean;
    workshopId?: string;
  };
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface Workshop { 
  id: string; 
  name: string; 
}

export default function ComicContentStep({ data, onUpdate, onNext, onPrevious }: ComicContentStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [isUploading, setIsUploading] = useState(false);

  // fetch workshops
  const { data: workshops } = useQuery<Workshop[]>({
    queryKey: ["/api/community/workshops", { mine: 1 }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/workshops?mine=1");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrors(prev => ({ ...prev, pdfUrl: "Please select a PDF file" }));
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setErrors(prev => ({ ...prev, pdfUrl: "PDF file must be less than 50MB" }));
      return;
    }

    setIsUploading(true);
    setErrors(prev => ({ ...prev, pdfUrl: "" }));

    try {
      // Create a data URL for the PDF file
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onUpdate({ pdfUrl: result });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setErrors(prev => ({ ...prev, pdfUrl: "Failed to upload PDF file" }));
      setIsUploading(false);
    }
  };

  const validateAndNext = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.pdfUrl.trim()) {
      newErrors.pdfUrl = "PDF is required";
    } else if (uploadMethod === 'url' && !isValidUrl(data.pdfUrl)) {
      newErrors.pdfUrl = "Please enter a valid URL";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comic Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PDF Upload */}
        <div>
          <Label>Comic PDF *</Label>
          
          {/* Upload Method Toggle */}
          <div className="flex gap-4 mt-2 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMethod"
                value="url"
                checked={uploadMethod === 'url'}
                onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                className="text-amber-500"
              />
              <span className="text-sm">URL Link</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMethod"
                value="file"
                checked={uploadMethod === 'file'}
                onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                className="text-amber-500"
              />
              <span className="text-sm">Upload File</span>
            </label>
          </div>

          {uploadMethod === 'url' ? (
            <div>
              <Input
                id="pdfUrl"
                value={data.pdfUrl}
                onChange={(e) => onUpdate({ pdfUrl: e.target.value })}
                placeholder="https://example.com/your-comic.pdf"
                className={errors.pdfUrl ? "border-red-500" : ""}
              />
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>Paste the direct PDF link from your cloud service</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pdfFileInput"
                  disabled={isUploading}
                />
                <label
                  htmlFor="pdfFileInput"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {isUploading ? "Uploading..." : "Click to upload PDF file"}
                  </span>
                  <span className="text-xs text-gray-500">Maximum file size: 50MB</span>
                </label>
              </div>
              
              {data.pdfUrl && uploadMethod === 'file' && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✓ PDF file uploaded successfully
                </div>
              )}
            </div>
          )}
          
          {errors.pdfUrl && <p className="text-red-500 text-sm mt-1">{errors.pdfUrl}</p>}
        </div>

        {/* PDF Preview */}
        {data.pdfUrl && (uploadMethod === 'url' ? isValidUrl(data.pdfUrl) : true) && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">PDF Preview</span>
              {uploadMethod === 'url' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(data.pdfUrl, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open PDF
                </Button>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {uploadMethod === 'url' ? `PDF URL: ${data.pdfUrl}` : 'PDF file ready for publishing'}
            </div>
          </div>
        )}

        {/* Workshop Association */}
        {workshops && workshops.length > 0 && (
          <div>
            <Label>Associate with Workshop (optional)</Label>
            <div className="mt-2">
              <Select
                value={data.workshopId || ""}
                onValueChange={(value) => onUpdate({ workshopId: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a workshop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No workshop</SelectItem>
                  {workshops.map((workshop) => (
                    <SelectItem key={workshop.id} value={workshop.id}>
                      {workshop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Associate this comic with one of your workshops for better organization
            </p>
          </div>
        )}

        {/* Premium Content */}
        <div className="border rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="isPremium"
              checked={data.isPremium}
              onCheckedChange={(checked) => onUpdate({ isPremium: !!checked })}
              className="border-amber-500 data-[state=checked]:bg-amber-500"
            />
            <div className="space-y-1">
              <Label htmlFor="isPremium" className="font-medium">
                Premium Content
              </Label>
              <p className="text-sm text-gray-600">
                Mark this comic as premium content. Only premium subscribers will be able to read it.
              </p>
            </div>
          </div>
        </div>

        {/* Publishing Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-800">Publishing Information</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your comic will be published to the Epic Comics section</li>
            <li>• Readers can discover it through genre browsing and search</li>
            <li>• Make sure your PDF is publicly accessible via the URL</li>
            <li>• High-quality cover images improve discoverability</li>
          </ul>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button onClick={validateAndNext} className="flex items-center gap-2">
            Next: Preview & Publish
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
