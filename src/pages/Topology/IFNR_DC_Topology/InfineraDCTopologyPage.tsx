import React, { useEffect, useState, type MouseEvent, useCallback } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ConnectivityRow, LinkTooltipState, TopologyApiResponse, TopologyLink, TopologyNode } from "./topologyTypes";
import { INFINERA_CONNECTIVITY_API_URL, INFINERA_TOPOLOGY_API_URL, INFINERA_TOPOLOGY_UPDATE_API_URL } from "@/api/apis";
import axiosClient from "@/api/axiosClient";
import TopologyCanvas from "./TopologyCanvas";
import LinkTooltip from "./LinkTooltip";
import NodeDetailsPanel from "./NodeDetailsPanel";
import LinkLegendCard from "./LinkLegendCard";
import ConnectivityTable from "./ConnectivityTable";
import { logActivity } from "../../../utils/activityLogger";



type UpdateInfineraNodeCoordinatePayload = {
  nodeName: string;
  x: number;
  y: number;
};

const InfineraDCTopologyPage: React.FC = () => {
  const [data, setData] = useState<TopologyApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [tooltipState, setTooltipState] = useState<LinkTooltipState | null>(null);

  const [connectivityOpen, setConnectivityOpen] = useState(false);
  const [connectivityRows, setConnectivityRows] = useState<ConnectivityRow[]>([]);
  const [connectivityLoading, setConnectivityLoading] = useState(false);

  //  NEW: drag toggle (default true like conc)
  const [dragEnabled, setDragEnabled] = useState(true);
  useEffect(() => {
    logActivity({
      activity: "IFNR DC Topology page opened",
      actionName: "TOPOLOGY_REPORT",
      module: "TOPOLOGY",
    });
  }, []);
  // ---------------- Fetch topology ----------------
  useEffect(() => {
    const fetchTopology = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get<TopologyApiResponse>(INFINERA_TOPOLOGY_API_URL);
        setData(res.data);
      } catch (err) {
        console.error("Error while fetching topology:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTopology();
  }, []);

  // ---------------- Link hover handlers ----------------
  const handleLinkHoverIn = (e: MouseEvent<SVGElement>, link: TopologyLink) => {
    setTooltipState({
      x: e.clientX + 15,
      y: e.clientY - 30,
      link,
    });
  };

  const handleLinkHoverOut = () => setTooltipState(null);

  // ---------------- Connectivity handler ----------------
  const handleOpenConnectivity = async () => {
    if (!selectedNode) return;

    try {
      setConnectivityLoading(true);
      setConnectivityOpen(true);
      setConnectivityRows([]);

      const res = await axiosClient.get<ConnectivityRow[]>(INFINERA_CONNECTIVITY_API_URL, {
        params: { nodeName: selectedNode.nodeName },
      });

      setConnectivityRows(res.data ?? []);
    } catch (err) {
      console.error("Error while fetching connectivity:", err);
      setConnectivityRows([]);
    } finally {
      setConnectivityLoading(false);
    }
  };

  //  Called by TopologyCanvas after node drag end
  const handleNodePositionCommit = useCallback(async (nodeName: string, x: number, y: number) => {
    if (!nodeName) return;

    const payload: UpdateInfineraNodeCoordinatePayload = { nodeName, x, y };
    console.log("[INFINERA][DB COMMIT]  sending to API:", payload);

    try {
      await axiosClient.put(INFINERA_TOPOLOGY_UPDATE_API_URL, payload);
      console.log("[INFINERA][DB COMMIT]  success:", payload);

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          nodes: (prev.nodes ?? []).map((n) => (n.nodeName === nodeName ? { ...n, x, y } : n)),
        };
      });

      setSelectedNode((prev) => {
        if (!prev) return prev;
        if (prev.nodeName !== nodeName) return prev;
        return { ...prev, x, y };
      });
    } catch (e) {
      console.error("[INFINERA][DB COMMIT] ❌ failed:", payload, e);
    }
  }, []);

  const nodes = data?.nodes ?? [];
  const links = data?.links ?? [];

  return (
    <Box
      sx={{
        height: "calc(100vh - 5vh)",
        width: "100%",
        overflow: "hidden",
        p: 0,
        m: 0,
        backgroundColor: "#fff",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          bgcolor: "#fff7f8",
          border: "2px solid #990033",
          overscrollBehavior: "contain",
          touchAction: "none",
        }}
      >
        {/* -------- Header Section -------- */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 30,
          }}
        >
          <Box
            sx={{
              backgroundColor: "#D3D3D3",
              color: "#000",
              px: 3,
              height: "4vh",
              borderRadius: "2vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 500,
              fontSize: "1vw",
              whiteSpace: "nowrap",
            }}
          >
            Infinera DC Topology
          </Box>
        </Box>
        <TopologyCanvas
          nodes={nodes}
          links={links}
          dragEnabled={dragEnabled} //  NEW
          onNodeClick={setSelectedNode}
          onLinkHoverIn={handleLinkHoverIn}
          onLinkHoverOut={handleLinkHoverOut}
          onNodePositionCommit={handleNodePositionCommit}
        />

        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <Typography sx={{ bgcolor: "#fff", px: 3, py: 1, borderRadius: 1 }}>
              Loading topology…
            </Typography>
          </Box>
        )}

        <LinkTooltip tooltip={tooltipState} />

        <NodeDetailsPanel
          node={selectedNode}
          onOpenConnectivity={handleOpenConnectivity}
          connectivityLoading={connectivityLoading}
        />

        {/*  Drag toggle lives here like Conc bottom-right card */}
        <LinkLegendCard dragEnabled={dragEnabled} onToggleDrag={() => setDragEnabled((v) => !v)} />
      </Box>

      <Dialog
        open={connectivityOpen}
        onClose={() => setConnectivityOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <Typography sx={{ flexGrow: 1, fontSize: 16, fontWeight: 600 }}>
            Connectivity from {selectedNode ? selectedNode.nodeName : "Node"}
          </Typography>
          <IconButton onClick={() => setConnectivityOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          {connectivityLoading ? (
            <Typography sx={{ fontSize: 13 }}>Loading…</Typography>
          ) : connectivityRows.length === 0 ? (
            <Typography sx={{ fontSize: 13 }}>No connectivity data available.</Typography>
          ) : (
            <Box sx={{ width: "100%" }}>
              <ConnectivityTable rows={connectivityRows} loading={connectivityLoading} />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
export default InfineraDCTopologyPage;