import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Sun, Moon, Book, Maximize, Minimize, Scroll, Columns } from "lucide-react";

export interface ReaderPreferences {
  fontSize: string;
  fontFamily: string;
  theme: string;
  viewMode?: "scroll" | "paginated";
}

interface ReaderSettingsProps {
  preferences: ReaderPreferences;
  onPreferencesChange: (preferences: ReaderPreferences) => void;
}

export function ReaderSettings({ preferences, onPreferencesChange }: ReaderSettingsProps) {
  const handleFontSizeChange = (size: string) => {
    onPreferencesChange({ ...preferences, fontSize: size });
  };

  const handleFontFamilyChange = (family: string) => {
    onPreferencesChange({ ...preferences, fontFamily: family });
  };

  const handleThemeChange = (theme: string) => {
    onPreferencesChange({ ...preferences, theme: theme });
  };
  
  const handleViewModeChange = (mode: "scroll" | "paginated") => {
    onPreferencesChange({ ...preferences, viewMode: mode });
  };

  return (
    <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4 mb-4 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Theme Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Theme</label>
          <Tabs 
            value={preferences.theme} 
            onValueChange={handleThemeChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger 
                value="light" 
                className="flex items-center gap-1"
              >
                <Sun className="h-4 w-4" />
                <span className="hidden sm:inline">Light</span>
              </TabsTrigger>
              <TabsTrigger 
                value="sepia" 
                className="flex items-center gap-1"
              >
                <Book className="h-4 w-4" />
                <span className="hidden sm:inline">Sepia</span>
              </TabsTrigger>
              <TabsTrigger 
                value="dark" 
                className="flex items-center gap-1"
              >
                <Moon className="h-4 w-4" />
                <span className="hidden sm:inline">Dark</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Font Family Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Font Style</label>
          <Tabs 
            value={preferences.fontFamily} 
            onValueChange={handleFontFamilyChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="serif">Serif</TabsTrigger>
              <TabsTrigger value="sans">Sans-serif</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Font Size Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Font Size</label>
          <Tabs 
            value={preferences.fontSize} 
            onValueChange={handleFontSizeChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="sm" className="px-2 py-1">
                <Minimize className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="md" className="px-2 py-1">
                <span className="text-sm">A</span>
              </TabsTrigger>
              <TabsTrigger value="lg" className="px-2 py-1">
                <span className="text-base">A</span>
              </TabsTrigger>
              <TabsTrigger value="xl" className="px-2 py-1">
                <Maximize className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* View Mode Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Reading Mode</label>
        <Tabs 
          value={preferences.viewMode || "scroll"} 
          onValueChange={(value) => handleViewModeChange(value as "scroll" | "paginated")}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger 
              value="scroll" 
              className="flex items-center justify-center gap-2"
            >
              <Scroll className="h-4 w-4" />
              <span>Scrolling</span>
            </TabsTrigger>
            <TabsTrigger 
              value="paginated" 
              className="flex items-center justify-center gap-2"
            >
              <Columns className="h-4 w-4" />
              <span>Pages</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

export default ReaderSettings;