import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { ScrollArea } from '../../../components/ui/scroll-area';
import type { ApiTopology } from '../types';
import * as topologyApi from '../services/topologyApi';
import { cn } from '../../../lib/utils';

interface MonitorSidebarProps {
  currentId?: string;
  onStateChange?: (state: 'loading' | 'empty' | 'ready') => void;
}

export function MonitorSidebar({ currentId, onStateChange }: MonitorSidebarProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [topologies, setTopologies] = useState<ApiTopology[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    onStateChange?.('loading');

    topologyApi.listTopologies()
      .then(topos => {
        const monitored = topos.filter(t => t.monitorEnabled);

        setTopologies(monitored);

        const vendors = new Set(
          monitored.map(t => (t as any).vendor || 'Other')
        );
        setExpandedGroups(vendors);

        if (monitored.length === 0) {
          onStateChange?.('empty');
          return;
        }

        onStateChange?.('ready');

        // Auto-open first topology whenever no topology is selected
        if (!currentId) {
          const first = monitored[0];

          navigate(
            `/topology/${encodeURIComponent(first.name)}?vendor=${encodeURIComponent(first.vendor || '')}`,
            { replace: true }
          );
        }
      })
      .catch(() => {
        onStateChange?.('empty');
      });

  }, [currentId, navigate, onStateChange]);
  // Group by vendor
  const grouped = useMemo(() => {
    const map = new Map<string, ApiTopology[]>();
    topologies.forEach(t => {
      const vendor = (t as any).vendor || 'Other';
      if (!map.has(vendor)) map.set(vendor, []);
      map.get(vendor)!.push(t);
    });
    return map;
  }, [topologies]);

  const toggleGroup = (vendor: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(vendor)) next.delete(vendor);
      else next.add(vendor);
      return next;
    });
  };

  return (
    <>
      {!isOpen && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
          <button
            className="h-12 w-8 flex items-center justify-center rounded-l border border-r-0 border-border bg-background shadow-sm hover:bg-accent transition-colors"
            onClick={() => setIsOpen(true)}
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      )}
      {/* Sidebar overlay */}
      <div className={cn(
        "absolute right-0 top-0 h-full border-l border-border bg-background transition-all duration-200 flex flex-col z-20 shadow-lg",
        isOpen ? "w-56" : "w-0 overflow-hidden"
      )}>
        {isOpen && (
          <>
            <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
              <span className="text-xs font-semibold text-foreground">Monitor Topologies</span>
              <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-accent" onClick={() => setIsOpen(false)}>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            <ScrollArea className="flex-1">
              <div className="py-1">
                {Array.from(grouped.entries()).map(([vendor, topos]) => (
                  <div key={vendor}>
                    <button
                      className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-accent/30 transition-colors"
                      onClick={() => toggleGroup(vendor)}
                    >
                      <span>{vendor}</span>
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform",
                        !expandedGroups.has(vendor) && "-rotate-90"
                      )} />
                    </button>
                    {expandedGroups.has(vendor) && topos.map(topo => {
                      const isActive = String(topo.id) === currentId;
                      const displayName = topo.client
                        ? `${topo.name} (${topo.client})`
                        : topo.name;
                      return (
                        <button
                          key={String(topo.id)}
                          className={cn(
                            "flex items-center gap-2 w-full pl-5 pr-3 py-1.5 text-left transition-colors text-xs",
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          )}
                          onClick={() => navigate(`/topology/${encodeURIComponent(topo.name)}?vendor=${encodeURIComponent(topo.vendor || '')}`)}
                        >
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            isActive ? "bg-primary" : "bg-border"
                          )} />
                          <span className="truncate">{displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
                {topologies.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-4">
                    No monitored topologies.<br />
                    Enable monitoring in Manage Topology.
                  </p>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </>
  );
}
