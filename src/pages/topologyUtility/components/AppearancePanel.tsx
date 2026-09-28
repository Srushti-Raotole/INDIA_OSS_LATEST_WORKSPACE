
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Slider } from '../../../components/ui/slider';
import { Separator } from '../../../components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { X, Type, Save } from 'lucide-react';

export interface DisplaySettings {
  nodeLabelSize: number; // px, default 10
  linkLabelSize: number; // px, default 9
  linkDisplayMode: 'merged' | 'multi'; // default 'merged'
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  nodeLabelSize: 10,
  linkLabelSize: 9,
  linkDisplayMode: 'merged',
};

interface AppearancePanelProps {
  settings: DisplaySettings;
  onSettingsChange: (updates: Partial<DisplaySettings>) => void;
  onSaveView?: () => void;
  onClose?: () => void;
  showSaveView?: boolean;
}

export function AppearancePanel({ settings, onSettingsChange, onSaveView, onClose, showSaveView }: AppearancePanelProps) {
  return (
    <Card className="w-72 shadow-lg">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-1.5">
          <Type className="h-4 w-4" />
          Appearance
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {/* Node Label Size */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Node Label Size</span>
            <span>{settings.nodeLabelSize}px</span>
          </div>
          <Slider
            value={[settings.nodeLabelSize]}
            onValueChange={([v]) => onSettingsChange({ nodeLabelSize: v })}
            min={6}
            max={20}
            step={1}
          />
        </div>

        {/* Link Label Size */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Link Label Size</span>
            <span>{settings.linkLabelSize}px</span>
          </div>
          <Slider
            value={[settings.linkLabelSize]}
            onValueChange={([v]) => onSettingsChange({ linkLabelSize: v })}
            min={6}
            max={20}
            step={1}
          />
        </div>

        {/* Save Default View */}
        {showSaveView && onSaveView && (
          <>
            <Separator />
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={onSaveView}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Current View as Default
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Saves current zoom &amp; position so all users see the same view.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
