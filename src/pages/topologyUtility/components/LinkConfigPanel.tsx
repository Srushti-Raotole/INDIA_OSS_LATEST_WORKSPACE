import { Button } from '../../../components/ui/button';
import { Slider } from '../../../components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { X } from 'lucide-react';
import { LinkStyleType } from '../shared/types';

export interface LinkConfig {
  defaultStyle: LinkStyleType;
  showArrows: boolean;
  arrowSize: number;
  curveIntensity: number;
  strokeWidth: number;
  parallelOffset: number;
  smartRouting: boolean;
  animationSpeed: number;
  showAnimation: boolean;
}

export const DEFAULT_LINK_CONFIG: LinkConfig = {
  defaultStyle: 'solid', showArrows: false, arrowSize: 8, curveIntensity: 0.1,
  strokeWidth: 2, parallelOffset: 20, smartRouting: false, animationSpeed: 1, showAnimation: true,
};

interface LinkConfigPanelProps {
  config: LinkConfig;
  onConfigChange: (config: Partial<LinkConfig>) => void;
  onClose?: () => void;
}

export function LinkConfigPanel({ config, onConfigChange, onClose }: LinkConfigPanelProps) {
  return (
    <Card className="w-64 shadow-lg">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Link Settings</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Stroke Width</span><span>{config.strokeWidth}px</span></div>
          <Slider value={[config.strokeWidth]} onValueChange={([v]) => onConfigChange({ strokeWidth: v })} min={2} max={6} step={1} />
        </div>
      </CardContent>
    </Card>
  );
}
