import { useCallback, useState } from 'react';
import { TopologyNodeData, TopologyLinkData, CSVParseResult } from '../types';
import { toast } from 'sonner';

export function useCSVParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);

  const parseCSV = useCallback((csvContent: string): CSVParseResult => {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const nodes: TopologyNodeData[] = [];
    const links: TopologyLinkData[] = [];
    const errors: string[] = [];

    if (lines.length < 2) {
      errors.push('CSV file must have at least a header row and one data row');
      return { nodes, links, errors };
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Detect CSV type based on headers
    const hasSource = header.includes('source');
    const hasTarget = header.includes('target');
    const hasNodeId = header.includes('id') || header.includes('node_id') || header.includes('nodeid');
    const hasNodeName = header.includes('name') || header.includes('node_name') || header.includes('nodename');
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== header.length) {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${header.length}, got ${values.length})`);
        continue;
      }

      const rowData: Record<string, string> = {};
      header.forEach((h, idx) => {
        rowData[h] = values[idx]?.trim() || '';
      });

      // Determine if this row is a node or link
      if (hasSource && hasTarget && rowData['source'] && rowData['target']) {
        // This is a link row
        const link: TopologyLinkData = {
          id: rowData['id'] || rowData['link_id'] || rowData['linkid'] || `link-${i}`,
          source: rowData['source'],
          target: rowData['target'],
          type: rowData['type'] || rowData['link_type'] || 'fiber',
          status: validateLinkStatus(rowData['status'] || rowData['link_status'] || 'active'),
          label: rowData['label'] || rowData['name'] || '',
          bandwidth: rowData['bandwidth'] || '',
          latency: rowData['latency'] || '',
          metadata: extractMetadata(rowData, ['id', 'link_id', 'linkid', 'source', 'target', 'type', 'link_type', 'status', 'link_status', 'label', 'name', 'bandwidth', 'latency']),
        };
        links.push(link);
      } else if (hasNodeId || hasNodeName) {
        // This is a node row
        const node: TopologyNodeData = {
          id: rowData['id'] || rowData['node_id'] || rowData['nodeid'] || `node-${i}`,
          name: rowData['name'] || rowData['node_name'] || rowData['nodename'] || `Node ${i}`,
          type: rowData['type'] || rowData['node_type'] || 'datacenter',
          status: validateNodeStatus(rowData['status'] || rowData['node_status'] || 'active'),
          x: parseFloat(rowData['x'] || rowData['pos_x'] || '0') || undefined,
          y: parseFloat(rowData['y'] || rowData['pos_y'] || '0') || undefined,
          icon: rowData['icon'] || rowData['node_icon'] || undefined,
          metadata: extractMetadata(rowData, ['id', 'node_id', 'nodeid', 'name', 'node_name', 'nodename', 'type', 'node_type', 'status', 'node_status', 'x', 'y', 'pos_x', 'pos_y', 'icon', 'node_icon']),
        };
        nodes.push(node);
      } else {
        errors.push(`Row ${i + 1}: Could not determine if row is a node or link`);
      }
    }

    return { nodes, links, errors };
  }, []);

  const parseFile = useCallback(async (file: File): Promise<CSVParseResult> => {
    setIsParsing(true);
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const result = parseCSV(content);
        setParseResult(result);
        setIsParsing(false);
        
        if (result.errors.length > 0) {
          toast.warning(`Parsed with ${result.errors.length} warning(s)`);
        } else {
          toast.success(`Parsed ${result.nodes.length} nodes and ${result.links.length} links`);
        }
        
        resolve(result);
      };
      
      reader.onerror = () => {
        const result = { nodes: [], links: [], errors: ['Failed to read file'] };
        setParseResult(result);
        setIsParsing(false);
        toast.error('Failed to read CSV file');
        resolve(result);
      };
      
      reader.readAsText(file);
    });
  }, [parseCSV]);

  const clearResult = useCallback(() => {
    setParseResult(null);
  }, []);

  return {
    isParsing,
    parseResult,
    parseCSV,
    parseFile,
    clearResult,
  };
}

// Helper to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function validateNodeStatus(status: string): TopologyNodeData['status'] {
  const validStatuses = ['active', 'warning', 'critical', 'inactive'];
  return validStatuses.includes(status.toLowerCase()) 
    ? status.toLowerCase() as TopologyNodeData['status']
    : 'active';
}

function validateLinkStatus(status: string): TopologyLinkData['status'] {
  const validStatuses = ['active', 'degraded', 'down'];
  return validStatuses.includes(status.toLowerCase())
    ? status.toLowerCase() as TopologyLinkData['status']
    : 'active';
}

function extractMetadata(rowData: Record<string, string>, excludeKeys: string[]): Record<string, any> {
  const metadata: Record<string, any> = {};
  
  Object.entries(rowData).forEach(([key, value]) => {
    if (!excludeKeys.includes(key) && value) {
      metadata[key] = value;
    }
  });
  
  return Object.keys(metadata).length > 0 ? metadata : {};
}
