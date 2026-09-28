import React, { useEffect, useState, useMemo } from "react";
import { Box, Typography, Button } from "@mui/material";

import LinkLegendCard from "./LinkLegendCard";
import { ConnectivityRow, TelemetryLinkTooltipState, TopologyApiResponse, TopologyLink, TopologyNode } from "./telemetryTopologyTypes";
import axiosClient from "@/api/axiosClient";
import { TELEMETRY_CONNECTIVITY_API_URL, TELEMETRY_TOPOLOGY_API_URL } from "@/api/apis";
import ConnectivityModalMRT from "./ConnectivityModalMRT";
import TopologyCanvasD3 from "./TopologyCanavasD3";
import TelemetryDCTopologyLinkTooltip from "./telemetryDCTopologyLinkTooltip";
import { logActivity } from "../../../utils/activityLogger";

const TelemetryTopologyPage: React.FC = () => {
    const [data, setData] = useState<TopologyApiResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

    const [connOpen, setConnOpen] = useState(false);
    const [connLoading, setConnLoading] = useState(false);
    const [connRows, setConnRows] = useState<ConnectivityRow[]>([]);
    const [tooltip, setTooltip] = useState<TelemetryLinkTooltipState>({ open: false });

    //  legend drag toggle (for LinkLegendCard)
    const [dragEnabled, setDragEnabled] = useState(false);
    useEffect(() => {
        logActivity({
            activity: "TLMR DC Topology page opened",
            actionName: "TOPOLOGY_REPORT",
            module: "TOPOLOGY",
        });
    }, []);
    useEffect(() => {
        const fetchTopology = async () => {
            try {
                setLoading(true);
                const res = await axiosClient.get<TopologyApiResponse>(TELEMETRY_TOPOLOGY_API_URL);
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

    type ConnectivityRowApi = {
        Service_ID: string;
        Frequency: string;
        Line_Rate: string;
        A_end_Node: string;
        A_end_Trunk_PORT: string;
        A_end_Client: string;
        Z_end_Node: string;
        Z_end_Trunk_PORT: string;
        Z_end_Client: string;
        A_end_slot?: string | null;
        Z_end_slot?: string | null;
    };

    const openConnectivityModal = async () => {
        try {
            setConnLoading(true);
            setConnOpen(true);
            setConnRows([]);

            const res = await axiosClient.get<ConnectivityRowApi[]>(TELEMETRY_CONNECTIVITY_API_URL);

            const mapped: ConnectivityRow[] = (res.data ?? []).map((r) => ({
                serviceId: r.Service_ID ?? "",
                frequency: r.Frequency ?? "",
                lineRate: r.Line_Rate ?? "",
                aEndNode: r.A_end_Node ?? "",
                aEndTrunkPort: r.A_end_Trunk_PORT ?? "",
                aEndClient: r.A_end_Client ?? "",
                zEndNode: r.Z_end_Node ?? "",
                zEndTrunkPort: r.Z_end_Trunk_PORT ?? "",
                zEndClient: r.Z_end_Client ?? "",
            }));

            setConnRows(mapped);
        } catch (err) {
            console.error("Error while fetching connectivity:", err);
            setConnRows([]);
        } finally {
            setConnLoading(false);
        }
    };

    const nodes: TopologyNode[] = data?.nodes ?? [];
    const links: TopologyLink[] = data?.links ?? [];

    const nodesByNo = useMemo(() => {
        const m = new Map<number, TopologyNode>();
        nodes.forEach((n) => m.set(n.nodeNo, n));
        return m;
    }, [nodes]);

    return (
        <Box sx={{ bgcolor: "#fff7f8", minHeight: "100vh", p: 1, pt: 0 }}>
            <TelemetryDCTopologyLinkTooltip tooltip={tooltip} />


            {/* ================= Top bar actions ================= */}
            <Box
                sx={{
                    display: "flex", alignItems: "center", gap: 1.5, py: 1, position: "relative",
                }}
            >
                {/* Left spacer (same width as button so center stays perfect) */}
                <Box sx={{ minWidth: "18vh" }} />

                {/* Center title */}
                <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
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
                        Telemetry Topology
                    </Box>
                </Box>

                {/* Right button */}
                <Box sx={{ minWidth: "18vh", display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        variant="contained"
                        size="small"
                        sx={{
                            bgcolor: "#990033",
                            fontSize: "0.9vw",
                            px: 1.5,
                            py: 0.4,
                            minHeight: "5vh",
                            "&:hover": { bgcolor: "#7f002a" },
                        }}
                        onClick={openConnectivityModal}
                    >
                        Show Connectivity
                    </Button>
                </Box>
            </Box>



            {/* ================= Canvas container ================= */}
            <Box
                id="canvasdiv"
                sx={{
                    position: "relative",
                    width: "100%",
                    height: "80vh",
                    overflow: "auto",
                    border: "1px solid #990033",
                    borderRadius: 1,
                    bgcolor: "#fff7f8",
                }}
            >
                {/*  Legend moved to right corner inside canvas */}
                <LinkLegendCard
                    dragEnabled={dragEnabled}
                    onToggleDrag={() => setDragEnabled((p) => !p)}
                />



                {/* Topology Canvas */}
                <TopologyCanvasD3
                    nodes={nodes}
                    links={links}
                    showText={true}
                    onNodeClick={(n) => setSelectedNode(n)}
                    onLinkHoverIn={(e, link) => {
                        setTooltip({
                            open: true,
                            x: e.clientX + 12,
                            y: e.clientY + 12,
                            link,
                            nodesByNo,
                        });
                    }}
                    onLinkHoverOut={() => setTooltip({ open: false })}
                />

                {/* Loading Overlay */}
                {loading && (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            bgcolor: "rgba(0,0,0,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                        }}
                    >
                        <Typography
                            sx={{
                                bgcolor: "#fff",
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                fontSize: "0.85rem",
                            }}
                        >
                            Loading…
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ================= Connectivity Modal ================= */}
            <ConnectivityModalMRT
                open={connOpen}
                onClose={() => setConnOpen(false)}
                loading={connLoading}
                title="Connectivity Details"
                rows={connRows}
            />
        </Box>
    );
};

export default TelemetryTopologyPage;