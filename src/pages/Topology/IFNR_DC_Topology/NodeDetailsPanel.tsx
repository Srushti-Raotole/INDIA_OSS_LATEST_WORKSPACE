import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { TopologyNode } from "./topologyTypes";
 
interface NodeDetailsPanelProps {
  node: TopologyNode | null;
  /** Called when user clicks Connectivity button */
  onOpenConnectivity: () => void;
  /** To show spinner text + disable button while loading connectivity */
  connectivityLoading: boolean;
}
 
const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  onOpenConnectivity,
  connectivityLoading,
}) => {
  return (
    <Card
      sx={{
        position: "absolute",
        top: "4vh",
        right: "1vw",
        width: "14vw",
        zIndex: 20,
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      }}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}
        >
          NODE DETAILS
        </Typography>
        {node ? (
          <>
            <Box
              sx={{
                bgcolor: "#F6F3FB",
                borderRadius: 1,
                p: 0.5,
                mb: 0.5,
              }}
            >
              <Typography
                sx={{ fontSize: 11, color: "#990033", fontWeight: 600 }}
              >
                Node Name
              </Typography>
              <Typography
                sx={{ fontSize: 11, fontWeight: 700, wordBreak: "break-word" }}
              >
                {node.nodeName}
              </Typography>
            </Box>
 
            {/* <Box
              sx={{
                bgcolor: "#F6F3FB",
                borderRadius: 1,
                p: 0.5,
                mb: 0.5,
              }}
            >
              <Typography sx={{ fontSize: 11, color: "#990033", fontWeight: 600 }}>
                Tier / Type
              </Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
                {node.tier} / {node.nodeType}
              </Typography>
            </Box> */}
 
            {/* Connectivity button */}
            <Box sx={{ mt: 1 }}>
              <Box
                component="button"
                onClick={onOpenConnectivity}
                disabled={connectivityLoading}
                style={{
                  width: "100%",
                  border: 0,
                  borderRadius: 4,
                  padding: "6px 8px",
                  cursor: connectivityLoading ? "default" : "pointer",
                  background: "#990033",
                  color: "#fff",
                  letterSpacing: "0.1em",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {connectivityLoading ? "Loading…" : "Connectivity"}
              </Box>
            </Box>
          </>
        ) : (
          <Typography sx={{ fontSize: 11 }}>
            Click on any node to see details.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
export default NodeDetailsPanel;