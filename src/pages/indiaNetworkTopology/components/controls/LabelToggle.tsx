
import { Tag, Tags } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui/popover';
import { Switch } from '../../../../components/ui/switch';
import { Label } from '../../../../components/ui/label';

interface LabelToggleProps {
  showSiteLabels: boolean;
  onSiteLabelsToggle: (show: boolean) => void;
  showLinkLabels?: boolean;
  onLinkLabelsToggle?: (show: boolean) => void;
  /** When true, shows separate site + link label toggles (alarm view). */
  mode?: 'management' | 'alarm';
}

export function LabelToggle({ showSiteLabels, onSiteLabelsToggle, showLinkLabels = true, onLinkLabelsToggle, mode = 'management' }: LabelToggleProps) {
  const anyActive = showSiteLabels || showLinkLabels;

  if (mode === 'management') {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => onSiteLabelsToggle(!showSiteLabels)}
        className={`h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg border-border transition-all hover:bg-muted ${
          showSiteLabels ? 'border-primary text-primary' : ''
        }`}
      >
        {showSiteLabels ? (
          <Tags className="h-4 w-4" />
        ) : (
          <Tag className="h-4 w-4 opacity-50" />
        )}
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg border-border transition-all hover:bg-muted ${
            anyActive ? 'border-primary text-primary' : ''
          }`}
        >
          {anyActive ? (
            <Tags className="h-4 w-4" />
          ) : (
            <Tag className="h-4 w-4 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-56 p-3 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labels</p>
        <div className="flex items-center justify-between">
          <Label htmlFor="site-labels" className="text-xs font-medium cursor-pointer">
            Site Names
            <span className="block text-[10px] text-muted-foreground font-normal">Visible at zoom 7+</span>
          </Label>
          <Switch id="site-labels" checked={showSiteLabels} onCheckedChange={onSiteLabelsToggle} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="span-labels" className="text-xs font-medium cursor-pointer">
            Span IDs
            <span className="block text-[10px] text-muted-foreground font-normal">Visible at zoom 10+</span>
          </Label>
          <Switch id="span-labels" checked={showLinkLabels} onCheckedChange={v => onLinkLabelsToggle?.(v)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
