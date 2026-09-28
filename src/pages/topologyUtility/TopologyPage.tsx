

import './index.css';
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import MonitorTopology from './MonitorTopology';
import { useForceLightMode } from './hooks/useForceLightMode';
import { MonitorSidebar } from './components/MonitorSidebar';
import { Button } from '../../components/ui/button';
import { logActivity } from '../../utils/activityLogger';

export default function TopologyPage() {
  useForceLightMode();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [monitorState, setMonitorState] = useState<'loading' | 'empty' | 'ready'>('loading');
  useEffect(() => {
    logActivity({
      activity: id ? `Topology Monitor opened: ${id}` : "Topology Monitor page opened",
      actionName: "TOPOLOGY_MONITOR_PAGE",
      module: "TOPOLOGY_MONITOR",
    });
  }, [id]);
  return (
<div
  ref={containerRef}
  className="relative h-[calc(100vh-2.2rem)] overflow-hidden bg-white"
>
      <div className="w-full h-full">
        {id ? (
          <MonitorTopology />
        ) : monitorState === 'empty' ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/60" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">No Monitored Topologies Available</p>
              <p className="text-xs max-w-xs">
                Unable to fetch any enabled topology. Please enable monitoring for at least one topology in Manage Topology, or contact your administrator.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/topology-utility')}>
              Go to Manage Topology
            </Button>
          </div>
        ) : monitorState === 'loading' ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-xs">Loading topologies…</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a topology from the sidebar</p>
          </div>
        )}
      </div>

      <MonitorSidebar currentId={id} onStateChange={setMonitorState} />
    </div>
  );
}
