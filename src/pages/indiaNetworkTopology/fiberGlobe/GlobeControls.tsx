
import { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import {
  Layers, RotateCw, Camera, Maximize, Minimize, Globe, Map as MapIcon,
  ChevronDown, Palette,
} from 'lucide-react';
import { GLOBE_BASEMAPS, BASEMAP_GROUPS, type BasemapKey } from './globeBasemaps';
import type { GlobeBackground } from './useGlobeMap';

const BACKGROUND_OPTIONS: { key: GlobeBackground; label: string; swatch: string }[] = [
  { key: 'auto', label: 'Auto', swatch: 'linear-gradient(135deg,#a4cbe8,#23415c)' },
  { key: 'light', label: 'Light', swatch: '#e8eef5' },
  { key: 'dark', label: 'Dark', swatch: '#0b1220' },
  { key: 'space', label: 'Space', swatch: '#000010' },
];

interface GlobeControlsProps {
  basemap: BasemapKey;
  onBasemapChange: (key: BasemapKey) => void;
  autoRotate: boolean;
  onAutoRotateChange: (v: boolean) => void;
  projection: 'globe' | 'mercator';
  onProjectionChange: (p: 'globe' | 'mercator') => void;
  onScreenshot: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  background?: GlobeBackground;
  onBackgroundChange?: (b: GlobeBackground) => void;
}

export function GlobeControls({
  basemap, onBasemapChange,
  autoRotate, onAutoRotateChange,
  projection, onProjectionChange,
  onScreenshot,
  isFullscreen, onToggleFullscreen,
  background, onBackgroundChange,
}: GlobeControlsProps) {
  const [open, setOpen] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
      if (bgRef.current && !bgRef.current.contains(e.target as Node)) setBgOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {/* Basemap dropdown */}
      <div className="relative" ref={dropRef}>
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-1.5 bg-background/90 backdrop-blur-sm shadow-lg"
          onClick={() => setOpen((o) => !o)}
          title={GLOBE_BASEMAPS[basemap].description}
        >
          <Layers className="h-3.5 w-3.5" />
          <span className="text-xs">{GLOBE_BASEMAPS[basemap].name}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
        {open && (
          <div className="absolute top-full right-0 mt-1 w-56 bg-background/95 backdrop-blur-md rounded-lg shadow-xl border border-border overflow-hidden max-h-[70vh] overflow-y-auto z-20">
            {BASEMAP_GROUPS.map((g) => (
              <div key={g.label}>
                {/* <div className="px-3 py-1 text-[10px] uppercase font-semibold text-muted-foreground bg-muted/40 sticky top-0">
                  {g.label}
                </div> */}
                <div className="p-1">
                  {g.keys.map((k) => (
                    <Button
                      key={k}
                      variant={basemap === k ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                      onClick={() => { onBasemapChange(k); setOpen(false); }}
                      title={GLOBE_BASEMAPS[k].description}
                    >
                      {GLOBE_BASEMAPS[k].name}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {/* <div className="px-3 py-1.5 text-[9px] text-muted-foreground border-t border-border bg-muted/30 text-center">
              All tiles are free & open-source
            </div> */}
          </div>
        )}
      </div>

      {/* Background color */}
      {onBackgroundChange && (
        <div className="relative" ref={bgRef}>
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 bg-background/90 backdrop-blur-sm shadow-lg"
            onClick={() => setBgOpen((o) => !o)}
            title="Globe background color"
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="text-xs capitalize">{background ?? 'space'}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${bgOpen ? 'rotate-180' : ''}`} />
          </Button>
          {bgOpen && (
            <div className="absolute top-full right-0 mt-1 w-44 bg-background/95 backdrop-blur-md rounded-lg shadow-xl border border-border overflow-hidden z-20 p-1">
              <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground">
                Background
              </div>
              {BACKGROUND_OPTIONS.map((opt) => (
                <Button
                  key={opt.key}
                  variant={background === opt.key ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start h-8 text-xs gap-2"
                  onClick={() => { onBackgroundChange(opt.key); setBgOpen(false); }}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 rounded border border-border"
                    style={{ background: opt.swatch }}
                  />
                  {opt.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auto-rotate */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm shadow-lg border border-border">
        <RotateCw
          className={`h-3.5 w-3.5 ${autoRotate ? 'text-primary animate-spin' : 'text-muted-foreground'}`}
          style={autoRotate ? { animationDuration: '4s' } : undefined}
        />
        <Label htmlFor="globe-rotate" className="text-xs cursor-pointer">Rotate</Label>
        <Switch id="globe-rotate" checked={autoRotate} onCheckedChange={onAutoRotateChange} />
      </div>

      {/* Projection toggle */}
      {/* <Button
        size="sm"
        variant="outline"
        className="h-9 gap-1.5 bg-background/90 backdrop-blur-sm shadow-lg"
        onClick={() => onProjectionChange(projection === 'globe' ? 'mercator' : 'globe')}
        title={projection === 'globe' ? 'Switch to flat (Mercator)' : 'Switch to 3D globe'}
      >
        {projection === 'globe' ? <MapIcon className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
        <span className="text-xs">{projection === 'globe' ? 'Flat' : 'Globe'}</span>
      </Button> */}

      {/* Screenshot */}
      <Button
        size="sm"
        variant="outline"
        className="h-9 w-9 p-0 bg-background/90 backdrop-blur-sm shadow-lg"
        onClick={onScreenshot}
        title="Download PNG screenshot"
      >
        <Camera className="h-3.5 w-3.5" />
      </Button>

      {/* Fullscreen */}
      <Button
        size="sm"
        variant="outline"
        className="h-9 w-9 p-0 bg-background/90 backdrop-blur-sm shadow-lg"
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
