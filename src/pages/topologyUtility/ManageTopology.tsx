
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useForceLightMode } from './hooks/useForceLightMode';
import { Button } from '../../components/ui/button';
import { TopologyManagementTable } from './components';
import { TopologyFilters, TopologyFiltersState } from './components/TopologyFilters';
import type { ApiTopology } from './types';
import * as topologyApi from './services/topologyApi';
import { toast } from 'sonner';
import { logActivity } from '../../utils/activityLogger';

const defaultFilters: TopologyFiltersState = {
  search: '',
  status: 'all',
  client: 'all',
  vendor: 'all',
  dateFrom: undefined,
  dateTo: undefined,
};

export default function ManageTopology() {
  useForceLightMode();
  const navigate = useNavigate();
  const [topologies, setTopologies] = useState<ApiTopology[]>([]);
  const [filters, setFilters] = useState<TopologyFiltersState>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    logActivity({ activity: "Manage Topology page opened", actionName: "MANAGE_TOPOLOGY_PAGE", module: "TOPOLOGY_UTILITY" });
  }, []);

  // Load topologies from API
  useEffect(() => {
    topologyApi.listTopologies().then(data => {
      setTopologies(data);
      setIsLoading(false);
    });
  }, []);

  // Apply filters
  const filteredTopologies = useMemo(() => {
    return topologies.filter((t) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = t.name?.toLowerCase().includes(searchLower);
        const matchesClient = t.client?.toLowerCase().includes(searchLower);
        const matchesVendor = t.vendor?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesClient && !matchesVendor) return false;
      }
      if (filters.client !== 'all' && t.client !== filters.client) return false;
      if (filters.vendor !== 'all' && t.vendor !== filters.vendor) return false;
      return true;
    });
  }, [topologies, filters]);

  const getVendor = (id: string) => topologies.find(t => String(t.id) === id || t.name === id)?.vendor || '';

  const handleView = (id: string) => {
    const vendor = getVendor(id);
    const topo = topologies.find(t => String(t.id) === id);
    const name = topo?.name || id;
    navigate(`/view-topology/${encodeURIComponent(name)}?vendor=${encodeURIComponent(vendor)}`);
  };
  const handleEdit = (id: string) => {
    const vendor = getVendor(id);
    const topo = topologies.find(t => String(t.id) === id);
    const name = topo?.name || id;
    navigate(`/edit-topology/${encodeURIComponent(name)}?vendor=${encodeURIComponent(vendor)}`);
  };

  const handleDownloadCSV = (id: string) => {
    const topo = topologies.find(t => String(t.id) === id);
    if (topo) {
      topologyApi.downloadTopologyCSV(topo);
      toast.success('CSV downloaded');
    }
  };

  const handleDelete = async (id: string) => {
    const topo = topologies.find(t => String(t.id) === id);
    const name = topo?.name || id;
    const vendor = topo?.vendor;
    const success = await topologyApi.deleteTopology(name, vendor);
    if (success) {
      setTopologies(prev => prev.filter(t => String(t.id) !== id));
      toast.success('Topology deleted');
    } else {
      toast.error('Failed to delete topology');
    }
  };

  const handleToggleMonitor = (id: string, enabled: boolean) => {
    const topo = topologies.find(t => String(t.id) === id);
    const name = topo?.name || id;
    const vendor = topo?.vendor;
    setTopologies(prev => prev.map(t =>
      String(t.id) === id ? { ...t, monitorEnabled: enabled } : t
    ));
    topologyApi.toggleMonitor(name, enabled, vendor);
    toast.success(enabled ? 'Monitoring enabled — topology added to sidebar' : 'Monitoring disabled');
  };

  return (
    <div className="p-6 space-y-4 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Topologies</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View, edit, and manage your saved network topologies
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/create-topology')}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create New
        </Button>
      </div>

      {/* Filtered results count */}
      {filteredTopologies.length !== topologies.length && (
        <div className="flex items-center gap-2 text-sm shrink-0">
          <span className="text-muted-foreground">Showing:</span>
          <span className="font-medium">{filteredTopologies.length} of {topologies.length} results</span>
        </div>
      )}

      {/* Filters */}
      <div className="shrink-0">
        <TopologyFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Table — actions: View, Edit, Download CSV, Delete (with warning) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <TopologyManagementTable
          topologies={filteredTopologies}
          onView={handleView}
          onEdit={handleEdit}
          onExport={handleDownloadCSV}
          onDelete={handleDelete}
          onToggleMonitor={handleToggleMonitor}
        />
      </div>
    </div>
  );
}
