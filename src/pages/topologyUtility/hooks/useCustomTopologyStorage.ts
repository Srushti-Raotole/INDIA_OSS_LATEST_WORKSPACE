import { useState, useCallback, useEffect } from 'react';
import { CustomTopology, CustomNode, CustomLink, CanvasConfig, DEFAULT_CANVAS_CONFIG } from '../shared/types';

const STORAGE_KEY = 'custom-topologies';
const CONFIG_KEY = 'custom-topology-config';

export function useCustomTopologyStorage() {
  const [topologies, setTopologies] = useState<CustomTopology[]>([]);
  const [currentTopology, setCurrentTopology] = useState<CustomTopology | null>(null);
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>(DEFAULT_CANVAS_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const loadTopologies = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTopologies(JSON.parse(stored));
      const configStored = localStorage.getItem(CONFIG_KEY);
      if (configStored) setCanvasConfig(JSON.parse(configStored));
    } catch (error) {
      console.error('Failed to load topologies:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTopologies(); }, [loadTopologies]);

  const saveToStorage = useCallback((data: CustomTopology[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setTopologies(data); }
    catch (error) { console.error('Failed to save topologies:', error); }
  }, []);

  const saveCanvasConfig = useCallback((config: CanvasConfig) => {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); setCanvasConfig(config); }
    catch (error) { console.error('Failed to save config:', error); }
  }, []);

  const createTopology = useCallback((name?: string, description?: string): CustomTopology => {
    const newTopology: CustomTopology = {
      id: `topology-${Date.now()}`, name: name || 'Untitled Topology', description,
      nodes: [], links: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    if (name) { saveToStorage([...topologies, newTopology]); }
    setCurrentTopology(newTopology);
    return newTopology;
  }, [topologies, saveToStorage]);

  const createEmptyTopology = useCallback((): CustomTopology => {
    const newTopology: CustomTopology = {
      id: `topology-${Date.now()}`, name: 'Untitled Topology', description: '',
      nodes: [], links: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setCurrentTopology(newTopology);
    return newTopology;
  }, []);

  const saveTopologyWithName = useCallback((name: string, description?: string) => {
    if (!currentTopology) return null;
    const updated: CustomTopology = { ...currentTopology, name, description: description || currentTopology.description, updatedAt: new Date().toISOString() };
    setCurrentTopology(updated);
    const existingIndex = topologies.findIndex(t => t.id === updated.id);
    const updatedList = existingIndex >= 0 ? topologies.map(t => t.id === updated.id ? updated : t) : [...topologies, updated];
    saveToStorage(updatedList);
    return updated;
  }, [currentTopology, topologies, saveToStorage]);

  const updateCurrentTopology = useCallback((updates: Partial<CustomTopology>) => {
    if (!currentTopology) return;
    const updated: CustomTopology = { ...currentTopology, ...updates, updatedAt: new Date().toISOString() };
    setCurrentTopology(updated);
    saveToStorage(topologies.map(t => t.id === updated.id ? updated : t));
  }, [currentTopology, topologies, saveToStorage]);

  const addNode = useCallback((node: Omit<CustomNode, 'id'>) => {
    if (!currentTopology) return;
    const newNode: CustomNode = { ...node, id: `node-${Date.now()}` };
    updateCurrentTopology({ nodes: [...currentTopology.nodes, newNode] });
    return newNode;
  }, [currentTopology, updateCurrentTopology]);

  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    if (!currentTopology) return;
    updateCurrentTopology({ nodes: currentTopology.nodes.map(n => n.id === nodeId ? { ...n, x, y } : n) });
  }, [currentTopology, updateCurrentTopology]);

  const updateNode = useCallback((nodeId: string, updates: Partial<CustomNode>) => {
    if (!currentTopology) return;
    updateCurrentTopology({ nodes: currentTopology.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n) });
  }, [currentTopology, updateCurrentTopology]);

  const deleteNode = useCallback((nodeId: string) => {
    if (!currentTopology) return;
    updateCurrentTopology({
      nodes: currentTopology.nodes.filter(n => n.id !== nodeId),
      links: currentTopology.links.filter(l => l.source !== nodeId && l.target !== nodeId),
    });
  }, [currentTopology, updateCurrentTopology]);

  const addLink = useCallback((link: Omit<CustomLink, 'id'>) => {
    if (!currentTopology) return;
    const newLink: CustomLink = { ...link, id: `link-${Date.now()}` };
    updateCurrentTopology({ links: [...currentTopology.links, newLink] });
    return newLink;
  }, [currentTopology, updateCurrentTopology]);

  const updateLink = useCallback((linkId: string, updates: Partial<CustomLink>) => {
    if (!currentTopology) return;
    updateCurrentTopology({ links: currentTopology.links.map(l => l.id === linkId ? { ...l, ...updates } : l) });
  }, [currentTopology, updateCurrentTopology]);

  const deleteLink = useCallback((linkId: string) => {
    if (!currentTopology) return;
    updateCurrentTopology({ links: currentTopology.links.filter(l => l.id !== linkId) });
  }, [currentTopology, updateCurrentTopology]);

  const deleteTopology = useCallback((id: string) => {
    saveToStorage(topologies.filter(t => t.id !== id));
    if (currentTopology?.id === id) setCurrentTopology(null);
  }, [topologies, currentTopology, saveToStorage]);

  const exportTopology = useCallback((topology: CustomTopology) => {
    const blob = new Blob([JSON.stringify(topology, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${topology.name.replace(/\s+/g, '-')}-topology.json`;
    a.click(); URL.revokeObjectURL(url);
  }, []);

  const importTopology = useCallback((jsonString: string): CustomTopology | null => {
    try {
      const imported = JSON.parse(jsonString) as CustomTopology;
      imported.id = `topology-${Date.now()}`; imported.createdAt = new Date().toISOString(); imported.updatedAt = new Date().toISOString();
      saveToStorage([...topologies, imported]); setCurrentTopology(imported);
      return imported;
    } catch (error) { console.error('Failed to import topology:', error); return null; }
  }, [topologies, saveToStorage]);

  const loadTopology = useCallback((id: string) => {
    const topology = topologies.find(t => t.id === id);
    if (topology) setCurrentTopology(topology);
    return topology;
  }, [topologies]);

  return {
    topologies, currentTopology, canvasConfig, isLoading, setCurrentTopology,
    createTopology, createEmptyTopology, saveTopologyWithName, updateCurrentTopology,
    addNode, updateNodePosition, updateNode, deleteNode, addLink, updateLink, deleteLink,
    deleteTopology, exportTopology, importTopology, loadTopology, saveCanvasConfig,
  };
}
