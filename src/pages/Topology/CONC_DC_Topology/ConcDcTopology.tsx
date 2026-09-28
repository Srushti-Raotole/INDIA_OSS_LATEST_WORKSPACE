import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, CircularProgress, Grid } from "@mui/material";
import { CONC_DC_TOPOLOGY_API_URL } from "@/api/apis";
import axiosClient from "@/api/axiosClient";
import { ConcNode, ResolvedLink, TooltipState, TopologyResponse } from "./concDCTopologyTypes";
import ConcDCTopologyCanvas from "./ConcDCTopologyCanvas";
import ConcDCTopologyLinkTooltip from "./concDCTopologyLinkTooltip";
import { logActivity } from "../../../utils/activityLogger";

const CANVAS_W = 7500;
const CANVAS_H = 5000;

const ConcDcTopology: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [topo, setTopo] = useState<TopologyResponse>({ nodes: [], links: [] });
  const [showText, setShowText] = useState(true);
  const [selectedNode, setSelectedNode] = useState<ConcNode | null>(null);
  const [nodeDetailsOpen, setNodeDetailsOpen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>({ open: false });

  const canvasSize = useMemo(() => ({ width: CANVAS_W, height: CANVAS_H }), []);

  const nodeByNo = useMemo(() => {
    const m = new Map<number, ConcNode>();
    topo.nodes.forEach((n) => m.set(n.nodeNo, n));
    return m;
  }, [topo.nodes]);

  const linksResolved: ResolvedLink[] = useMemo(() => {
    return topo.links
      .map((l) => {
        const s = nodeByNo.get(l.oriNodeNumber);
        const t = nodeByNo.get(l.terNodeNumber);
        if (!s || !t) return null;
        return { ...l, __src: s, __dst: t };
      })
      .filter(Boolean) as ResolvedLink[];
  }, [topo.links, nodeByNo]);

  const fetchTopology = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get<TopologyResponse>(CONC_DC_TOPOLOGY_API_URL);
      setTopo(res.data);
    } catch (e) {
      console.error("conc-dc topology fetch failed", e);
      setTopo({ nodes: [], links: [] });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    logActivity({
      activity: "CONC DC Topology page opened",
      actionName: "TOPOLOGY_REPORT",
      module: "TOPOLOGY",
    });
  }, []);
  useEffect(() => {
    fetchTopology();
    const t = window.setInterval(fetchTopology, 60_000);
    return () => window.clearInterval(t);
  }, [fetchTopology]);

  const handleNodeClick = useCallback((n: ConcNode) => {
    setSelectedNode(n);
    setNodeDetailsOpen(true);
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        height: "calc(100vh - 16px)",
        bgcolor: "#fff7f8",
        p: 1,
        overflow: "hidden",
      }}
    >

      <ConcDCTopologyLinkTooltip tooltip={tooltip} />

      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          bgcolor: "#fff7f8",
          border: "1px solid #990033",
          borderRadius: 1,
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
            Conc-DC Topology
          </Box>
        </Box>


        <ConcDCTopologyCanvas
          nodes={topo.nodes}
          linksResolved={linksResolved}
          showText={showText}
          canvas={canvasSize}
          baseScale={0.6}
          // NOTE: initialScale removed as we now auto-fit on first render
          onNodeClick={handleNodeClick}
          onTooltip={setTooltip}
        />

        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(255,255,255,0.65)",
              zIndex: 10,
            }}
          >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <CircularProgress size={22} />
              <Typography fontWeight={700}>Loading network view...</Typography>
            </Box>
          </Box>
        )}

        {/* Legend stays fixed (NOT zooming) */}
        <Box sx={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none" }}>
          <Box sx={{ position: "absolute", bottom: 55, right: 35, pointerEvents: "auto" }}>
            <Card sx={{ width: "25vh", borderRadius: 1, boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}>
              <CardContent sx={{ p: 1.4 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ height: "0.6vh", width: "1.6vw", bgcolor: "#28a745", borderRadius: 1 }} />
                    <Typography sx={{ fontSize: "0.9vw", fontWeight: 600 }}>Up Link</Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ height: 5, width: 22, bgcolor: "#FF0000", borderRadius: 1 }} />
                    <Typography sx={{ fontSize: "0.9vw", fontWeight: 600 }}>Down Link</Typography>
                  </Box>

                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", mt: 0.5 }}
                    onClick={() => setShowText((v) => !v)}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 14,
                        borderRadius: 999,
                        bgcolor: showText ? "#0d6efd" : "#adb5bd",
                        position: "relative",
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "#fff",
                          position: "absolute",
                          top: 1,
                          left: showText ? 15 : 1,
                          transition: "left 0.2s ease",
                          boxShadow: "0 0 2px rgba(0,0,0,0.3)",
                        }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: "0.9vw", fontWeight: 600 }}>Show Labels</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ConcDcTopology;
