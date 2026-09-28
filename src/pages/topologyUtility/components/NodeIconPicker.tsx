import { cn } from '../../../lib/utils';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Label } from '../../../components/ui/label';
import { ICON_REGISTRY } from '../utils/nodeIcons';

interface NodeIconPickerProps {
  value?: string;
  onChange: (iconId: string) => void;
  className?: string;
}

export function NodeIconPicker({ value = 'router', onChange, className }: NodeIconPickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs">Node Icon</Label>
      <ScrollArea className="h-[160px] pr-2">
        <div className="grid grid-cols-3 gap-2">
          {ICON_REGISTRY.map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => onChange(entry.value)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all hover:bg-muted/50",
                value === entry.value
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border"
              )}
            >
              <div className="h-12 w-12 flex items-center justify-center">
                <img
                  src={entry.url}
                  alt={entry.label}
                  className="max-h-10 max-w-10 object-contain"
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{entry.label}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export { ICON_REGISTRY as nodeIconOptions };
