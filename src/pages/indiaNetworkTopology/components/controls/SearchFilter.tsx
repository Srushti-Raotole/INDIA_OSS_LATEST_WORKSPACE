
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, X, MapPin, Network, Cpu, Route, Radio } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Badge } from '../../../../components/ui/badge';
import { NetworkNode } from '../../types';
import type { FiberRoute, FiberSite } from '../../types/fiberTypes';
import { searchNodes } from '../../services/networkApi';

type SearchResultType = 'node' | 'fiberRoute' | 'fiberSite';

interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  details: string;
  data: NetworkNode | FiberRoute | FiberSite;
}

interface SearchFilterProps {
  /** All available nodes to search */
  nodes: NetworkNode[];
  /** Callback when a node is selected from results - will focus and highlight node */
  onNodeSelect: (node: NetworkNode) => void;
  /** Fiber routes to search */
  fiberRoutes?: FiberRoute[];
  /** Fiber sites to search */
  fiberSites?: FiberSite[];
  /** Callback when a fiber route is selected */
  onFiberRouteSelect?: (route: FiberRoute) => void;
  /** Callback when a fiber site is selected */
  onFiberSiteSelect?: (site: FiberSite) => void;
}

/**
 * Search fiber routes by query
 */
function searchFiberRoutes(routes: FiberRoute[], query: string): FiberRoute[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return routes.filter(route =>
    route.routeName.toLowerCase().includes(lowerQuery) ||
    route.linkName.toLowerCase().includes(lowerQuery) ||
    route.type.toLowerCase().includes(lowerQuery) ||
    route.methodology.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search fiber sites by query
 */
function searchFiberSites(sites: FiberSite[], query: string): FiberSite[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return sites.filter(site =>
    site.name.toLowerCase().includes(lowerQuery) ||
    site.nodeName?.toLowerCase().includes(lowerQuery) ||
    site.nodeIP?.toLowerCase().includes(lowerQuery) ||
    (site.technology && site.technology.toLowerCase().includes(lowerQuery)) ||
    (site.connType && site.connType.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Search bar with dropdown results
 * Searches by: siteName, device name (name), city, circle, fiber routes, fiber sites
 * Selecting a result will center the map and highlight it
 * 
 * LIBRARY: React with shadcn/ui Input, Button, ScrollArea
 * POSITION: Top-right, inline with filter, map style and fullscreen buttons
 */
export function SearchFilter({ 
  nodes, 
  onNodeSelect,
  fiberRoutes = [],
  fiberSites = [],
  onFiberRouteSelect,
  onFiberSiteSelect,
}: SearchFilterProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Perform search when query changes
   * Searches nodes, fiber routes, and fiber sites
   */
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.trim()) {
      const searchResults: SearchResult[] = [];
      
      // Search nodes
      const matchedNodes = searchNodes(nodes, value).slice(0, 5);
      matchedNodes.forEach(node => {
        searchResults.push({
          type: 'node',
          id: node.id,
          title: node.siteName,
          subtitle: node.name,
          details: `${node.city} • ${node.circle}`,
          data: node,
        });
      });
      
      // Search fiber routes
      const matchedRoutes = searchFiberRoutes(fiberRoutes, value).slice(0, 3);
      matchedRoutes.forEach(route => {
        searchResults.push({
          type: 'fiberRoute',
          id: route.id,
          title: route.routeName,
          subtitle: route.linkName,
          details: `${route.type} • ${route.methodology} • ${route.lengthKms.toFixed(0)} km`,
          data: route,
        });
      });
      
      // Search fiber sites
      const matchedSites = searchFiberSites(fiberSites, value).slice(0, 3);
      matchedSites.forEach(site => {
        searchResults.push({
          type: 'fiberSite',
          id: site.id,
          title: site.name,
          subtitle: site.nodeName || site.connType,
          details: `${site.technology || 'N/A'} • ${site.connType || 'N/A'}`,
          data: site,
        });
      });
      
      setResults(searchResults.slice(0, 10));
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [nodes, fiberRoutes, fiberSites]);

  /**
   * Handle result selection from dropdown
   */
  const handleSelect = useCallback((result: SearchResult) => {
    if (result.type === 'node') {
      onNodeSelect(result.data as NetworkNode);
      setQuery((result.data as NetworkNode).name);
    } else if (result.type === 'fiberRoute') {
      onFiberRouteSelect?.(result.data as FiberRoute);
      setQuery((result.data as FiberRoute).routeName);
    } else if (result.type === 'fiberSite') {
      onFiberSiteSelect?.(result.data as FiberSite);
      setQuery((result.data as FiberSite).name);
    }
    setIsOpen(false);
    setResults([]);
  }, [onNodeSelect, onFiberRouteSelect, onFiberSiteSelect]);

  /**
   * Clear search input and reset state
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Highlight matching text in search results
   */
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  };

  /**
   * Get icon based on result type
   */
  const getResultIcon = (type: SearchResultType) => {
    switch (type) {
      case 'node':
        return <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />;
      case 'fiberRoute':
        return <Route className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />;
      case 'fiberSite':
        return <Radio className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />;
    }
  };

  /**
   * Get badge for result type
   */
  const getResultBadge = (type: SearchResultType) => {
    switch (type) {
      case 'node':
        return <Badge variant="outline" className="text-[8px] px-1 py-0 bg-primary/10 text-primary border-primary/20">Node</Badge>;
      case 'fiberRoute':
        return <Badge variant="outline" className="text-[8px] px-1 py-0 bg-green-500/10 text-green-600 border-green-500/20">Route</Badge>;
      case 'fiberSite':
        return <Badge variant="outline" className="text-[8px] px-1 py-0 bg-orange-500/10 text-orange-600 border-orange-500/20">Site</Badge>;
    }
  };

  return (
    <div className="relative z-[400]" ref={containerRef}>
      {/* Search Input */}
      <div className="relative">
        {/* <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> */}
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search node, route, site..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="w-28 sm:w-35 pl-8 pr-8 h-9 bg-background/95 backdrop-blur-sm shadow-lg border-border"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={clearSearch}
            title="Clear search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div 
          className="absolute top-full left-0 mt-1 w-96 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border overflow-hidden"
        >
          <ScrollArea className="max-h-80 [&>[data-radix-scroll-area-viewport]]:max-h-80">
            <div className="p-1">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full p-2.5 text-left hover:bg-muted/50 rounded-md transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    {getResultIcon(result.type)}
                    <div className="min-w-0 flex-1">
                      {/* Title with badge */}
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate flex-1">
                          {highlightMatch(result.title, query)}
                        </p>
                        {getResultBadge(result.type)}
                      </div>
                      
                      {/* Subtitle */}
                      <div className="flex items-center gap-1 text-xs text-primary mt-0.5">
                        {result.type === 'node' && <Cpu className="h-3 w-3" />}
                        {result.type === 'fiberRoute' && <Route className="h-3 w-3" />}
                        {result.type === 'fiberSite' && <Radio className="h-3 w-3" />}
                        <span className="font-mono truncate">
                          {highlightMatch(result.subtitle, query)}
                        </span>
                      </div>
                      
                      {/* Details */}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {result.details}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
          
          {results.length === 10 && (
            <div className="p-2 text-xs text-center text-muted-foreground border-t border-border bg-muted/20">
              Showing first 10 results.
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-3">
          <p className="text-sm text-muted-foreground text-center">
            No results found for "{query}"
          </p>
        </div>
      )}
    </div>
  );
}
