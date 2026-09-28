import React, { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import type { TopologyLink, TopologyNode } from "./telemetryTopologyTypes";
import MD32ELeftKLW from "../../../assets/MD32ELeftKLW.svg";
import MD32ERightChnadivali from "../../../assets/MD32ERightChnadivali.svg";
import PSMLeft from "../../../assets/PSM.svg";
import PSMRight from "../../../assets/PSMRight.svg";
import EDFA from "../../../assets/EDFA.svg";
import EDFA32ECRight from "../../../assets/EDFA32ECRight.svg";
import NCS1004 from "../../../assets/NCS1004.svg";
import NCS1014 from "../../../assets/NCS1014.svg";
import OTHER from "../../../assets/other.png";
 
type Props = {
    nodes: TopologyNode[];
    links: TopologyLink[];
    showText?: boolean;
 
    /** Called when user clicks a node icon */
    onNodeClick?: (node: TopologyNode) => void;
 
    /** Optional link hover events (for tooltip etc.) */
    onLinkHoverIn?: (e: MouseEvent, link: TopologyLink) => void;
    onLinkHoverOut?: () => void;
};
 
/**
 * SVG canvas size (virtual drawing area).
 * Keep this large enough for scrolling.
 */
const CANVAS_W = 1586;
const CANVAS_H = 700;
 
/**
 * Old vertical separation lines were at 45% and 52.5%.
 * We'll keep the same center gap boundaries to preserve "Airoli / Saket" position.
 */
const LEFT_BOUNDARY_X = CANVAS_W * 0.438;
const RIGHT_BOUNDARY_X = CANVAS_W * 0.53;
 
/**
 * Box padding.
 * IMPORTANT FIX #1:
 * Previously BOX_PAD=10 caused left-side NCS boxes to visually go outside border.
 * So for boxes we keep padding at 0 (full coverage), topology remains unchanged.
 */
const BOX_PAD = 0;
 
/**
 * Returns icon SVG path based on node tier.
 * Maps backend tiers to correct device templates.
 */
function getIconHref(d: TopologyNode) {
    switch (d.tier) {
        case "T1":
            return MD32ELeftKLW;
        case "T2":
            return MD32ERightChnadivali;
        case "T3":
            return PSMLeft;
        case "T4":
            return PSMRight;
        case "T5":
            return EDFA;
        case "T6":
            return EDFA32ECRight;
        case "T7":
        case "T11":
            return NCS1004;
        case "T8":
        case "T12":
            return NCS1014;
        default:
            return OTHER;
    }
}
 
/**
 * Returns icon width/height (px) per tier.
 * Used for controlling device image sizes.
 */
function getWH(d: TopologyNode) {
    // VE nodes are "virtual edge / port label" nodes => no image at all
    if (d.nodeType === "VE") return { w: 0, h: 0 };
 
    // MD32 big template (vertical)
    if (d.tier === "T1" || d.tier === "T2") return { w: 70, h: 250 };
 
    // PSM small box
    if (d.tier === "T3" || d.tier === "T4") return { w: 65, h: 65 };
 
    // EDFA icon
    if (d.tier === "T5" || d.tier === "T6") return { w: 39, h: 75 };
 
    // NCS boxes (horizontal)
    if (d.tier === "T7" || d.tier === "T8" || d.tier === "T11" || d.tier === "T12") {
        return { w: 140, h: 28 };
    }
 
    return { w: 100, h: 100 };
}
 
/**
 * Adjusts image X/Y placement.
 * Backend x/y is treated like an "anchor point", and we shift per tier
 * so the SVG template sits correctly.
 */
function getXY(d: TopologyNode) {
    const x = Number(d.x ?? 0);
    const y = Number(d.y ?? 0);
 
    if (d.nodeType === "VE") return { x, y }; // no icon for VE
 
    // if (d.tier === "T1") return { x: x - 8, y: y - 77 - 45 };
    if (d.tier === "T1") return { x: x - 6.6, y: y - 77 - 45 };
    if (d.tier === "T2") return { x: x, y: y - 77 - 45 };
    if (d.tier === "T3") return { x: x - 30, y: y - 31 };
    if (d.tier === "T4") return { x: x - 35, y: y - 31 };
    if (d.tier === "T5" || d.tier === "T6") return { x: x - 15, y: y - 33 };
    if (d.tier === "T7") return { x: x - 11, y: y - 40 + 22 };
    if (d.tier === "T8") return { x: x - 11, y: y - 150 + 136 };
    if (d.tier === "T11" || d.tier === "T12") return { x: x - 120, y: y - 40 + 24 };
 
    return { x, y };
}
 
/**
 * Returns CSS class for link based on status:
 * - 0 => Down link (red blinking)
 * - 3 => Protection path (black dotted blinking)
 * - else => Up/Clear (green)
 */
function getLinkClass(l: TopologyLink) {
    if (l.status === 0) return "downLink";
    if (l.status === 3) return "protectionpath";
    return "clearlink";
}
 
/**
 * Utility: checks if a node is PSM tier.
 */
function isPSM(n?: TopologyNode) {
    return n?.tier === "T3" || n?.tier === "T4";
}
 
/**
 * Utility: checks if a node is MD32 tier.
 */
function isMD32(n?: TopologyNode) {
    return n?.tier === "T1" || n?.tier === "T2";
}
 
/**
 * FIX #3:
 * Compute link endpoints (x,y) for a given link.
 * Default: use node.x/node.y.
 * Special-case: if the link connects a PSM <-> MD32, we normalize Y to PSM.y
 * to make the segment visually straight (horizontal), like the left box.
 *
 * This does NOT move topology nodes; it only adjusts the line endpoint used for drawing.
 */
function getLinkEndpoints(link: TopologyLink, nodeMap: Map<number, TopologyNode>) {
    const a = nodeMap.get(link.oriNodeNumber);
    const b = nodeMap.get(link.terNodeNumber);
 
    const ax = Number(a?.x ?? 0);
    const ay = Number(a?.y ?? 0);
    const bx = Number(b?.x ?? 0);
    const by = Number(b?.y ?? 0);
 
    // PSM <-> MD32 straightening (horizontal look)
    if ((isPSM(a) && isMD32(b)) || (isMD32(a) && isPSM(b))) {
        // Keep the PSM Y coordinate for BOTH endpoints
        const psmY = isPSM(a) ? ay : by;
        return { x1: ax, y1: psmY, x2: bx, y2: psmY };
    }
 
    // Default
    return { x1: ax, y1: ay, x2: bx, y2: by };
}
 
/**
 * FIX #2:
 * For VE text nodes like "v24" / "v50" (link labels),
 * add a small right shift so text does not overlap inside MD32E image.
 */
function isVNumberLabel(text?: string) {
    if (!text) return false;
    return /^v\d+$/i.test(text.trim());
}
 
const TopologyCanvasD3: React.FC<Props> = ({
    nodes,
    links,
    showText = true,
    onNodeClick,
    onLinkHoverIn,
    onLinkHoverOut,
}) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
 
    /**
     * Fast lookup map for nodeNo -> node.
     * Used to compute link endpoints quickly.
     */
    const nodeMap = useMemo(() => {
        const m = new Map<number, TopologyNode>();
        nodes.forEach((n) => m.set(n.nodeNo, n));
        return m;
    }, [nodes]);
 
    useEffect(() => {
        if (!svgRef.current) return;
 
        const svg = d3.select(svgRef.current);
 
        // Clean previous render completely
        svg.selectAll("*").remove();
 
        /**
         * Inline SVG styles:
         * - nameText uses a white "halo" stroke to remain readable on lines/background.
         */
        svg.append("style").text(`
      .clearlink { stroke: #28a745; stroke-width: 2; stroke-opacity: 0.85; }
      .downLink  { stroke: #ff0000; stroke-width: 2.5; animation: blinker 1.7s cubic-bezier(.5,0,1,1) infinite alternate; }
      .protectionpath { stroke: #000; stroke-width: 2.2; stroke-dasharray: 5 5; animation: blinker 1.7s cubic-bezier(.5,0,1,1) infinite alternate; fill: none; }
 
      @keyframes blinker { to { opacity: 0; } }
 
      .nameText {
        font-family: Arial, Lato, sans-serif;
        fill: #000;
        font-weight: 700;
        font-size: 12px;
        paint-order: stroke fill;
        stroke: #fff;
        stroke-width: 2.5px;
        stroke-linejoin: round;
        user-select: none;
        text-rendering: geometricPrecision;
        shape-rendering: geometricPrecision;
      }
 
      /* Side boxes */
      .sideBox {
        fill: none;
        stroke: #000;
        stroke-width: 2px;
        shape-rendering: crispEdges;
      }
 
      /* Box title button (inside SVG) */
      .boxBtn {
        font-family: Arial, Lato, sans-serif;
        font-size: 13px;
        font-weight: 600;
        background: #d3d3d3;
        color: #000;
        border-radius: 18px;
        padding: 4px 14px;
        white-space: nowrap;
        text-align: center;
        width: fit-content;
        margin: 0 auto;
      }
    `);
 
        /**
         * Everything is drawn inside gZoom.
         * Zoom/pan transforms apply only to this group.
         */
        const gZoom = svg.append("g").attr("class", "zoom-layer");
 
        // ===================== LEFT / RIGHT BOXES =====================
        gZoom
            .append("rect")
            .attr("class", "sideBox")
            .attr("x", BOX_PAD)
            .attr("y", BOX_PAD)
            .attr("width", Math.max(0, LEFT_BOUNDARY_X - BOX_PAD))
            .attr("height", CANVAS_H - BOX_PAD * 2);
 
        gZoom
            .append("rect")
            .attr("class", "sideBox")
            .attr("x", RIGHT_BOUNDARY_X)
            .attr("y", BOX_PAD)
            .attr("width", Math.max(0, CANVAS_W - RIGHT_BOUNDARY_X - BOX_PAD))
            .attr("height", CANVAS_H - BOX_PAD * 2);
 
        // ===================== BOX TITLES FROM API (NO HARDCODE) =====================
        // Find best node for left/right site title from API (top-most text in each side)
        const leftTitleNode = nodes
            .filter((n) => Number(n.x ?? 0) < LEFT_BOUNDARY_X)
            .reduce<TopologyNode | null>((best, n) => {
                const y = Number(n.y ?? 999999);
                if (!best) return n;
                return y < Number(best.y ?? 999999) ? n : best;
            }, null);
 
        const rightTitleNode = nodes
            .filter((n) => Number(n.x ?? 0) > RIGHT_BOUNDARY_X)
            .reduce<TopologyNode | null>((best, n) => {
                const y = Number(n.y ?? 999999);
                if (!best) return n;
                return y < Number(best.y ?? 999999) ? n : best;
            }, null);
 
        const leftTitleText = leftTitleNode?.nodeName ?? "";
        const rightTitleText = rightTitleNode?.nodeName ?? "";
 
        // We'll hide these two title nodes from normal text rendering to avoid duplicate
        const titleNodeNos = new Set<number>([
            leftTitleNode?.nodeNo ?? -1,
            rightTitleNode?.nodeNo ?? -1,
        ]);
 
        // Draw button-pill inside each box (only if text exists)
        const boxTitleY = BOX_PAD + 6;
        const boxBtnW = 230;
        const boxBtnH = 34;
 
        if (leftTitleText) {
            gZoom
                .append("foreignObject")
                .attr("x", LEFT_BOUNDARY_X / 2 - boxBtnW / 2)
                .attr("y", boxTitleY)
                .attr("width", boxBtnW)
                .attr("height", boxBtnH)
                .append("xhtml:div")
                .attr("class", "boxBtn")
                .text(leftTitleText);
        }
 
        if (rightTitleText) {
            gZoom
                .append("foreignObject")
                .attr("x", RIGHT_BOUNDARY_X + (CANVAS_W - RIGHT_BOUNDARY_X) / 2 - boxBtnW / 2)
                .attr("y", boxTitleY)
                .attr("width", boxBtnW)
                .attr("height", boxBtnH)
                .append("xhtml:div")
                .attr("class", "boxBtn")
                .text(rightTitleText);
        }
 
        // -------------------- LINKS --------------------
        gZoom
            .append("g")
            .selectAll("line")
            .data(links)
            .enter()
            .append("line")
            .attr("class", (d) => getLinkClass(d))
            .attr("x1", (d) => getLinkEndpoints(d, nodeMap).x1)
            .attr("y1", (d) => getLinkEndpoints(d, nodeMap).y1)
            .attr("x2", (d) => getLinkEndpoints(d, nodeMap).x2)
            .attr("y2", (d) => getLinkEndpoints(d, nodeMap).y2)
            .on("mousemove", function (event, d) {
                onLinkHoverIn?.(event as unknown as MouseEvent, d);
            })
            .on("mouseleave", function () {
                onLinkHoverOut?.();
            });
 
        // -------------------- TEXT LABELS --------------------
        if (showText) {
            gZoom
                .append("g")
                .selectAll("text")
                // .data(nodes.filter((n) => !titleNodeNos.has(n.nodeNo)))
                .data(
                    nodes.filter((n) => {
                        if (titleNodeNos.has(n.nodeNo)) return false;
 
                        //  Hide only v24/v50 kind of VE labels from UI
                        const labelText = n.nodeType === "VE" ? (n.portName ?? n.nodeName ?? "") : (n.nodeName ?? "");
                        if (n.nodeType === "VE" && isVNumberLabel(labelText)) return false;
                        return true;
                    })
                )
 
                .enter()
                .append("text")
                .attr("class", "nameText")
                /**
                 * VE nodes show portName (like Ots0/1/0/1),
                 * other nodes show nodeName.
                 */
                .text((d) => (d.nodeType === "VE" ? (d.portName ?? d.nodeName) : d.nodeName))
                .style("letter-spacing", "0.2px")
                .style("dominant-baseline", "middle")
                .attr("x", (d) => {
                    const x = Number(d.x ?? 0);
                    const labelText = d.nodeType === "VE" ? (d.portName ?? d.nodeName) : d.nodeName;
 
                    // FIX #2: v24/v50 shift to the right so they sit clearly on the link
                    if (d.nodeType === "VE" && isVNumberLabel(labelText)) return x + 6;
 
                    if (d.nodeType === "VE" && d.tier === "T6") return x - 45;
                    if (d.tier === "T1" || d.tier === "T2") return x;
                    if (d.tier === "T3" || d.tier === "T4") return x - 27;
                    if (d.tier === "T5") return x - 95;
                    if (d.tier === "T6") return x - 20;
                    if (d.tier === "T10") return x + 20;
                    if (d.tier === "T7" || d.tier === "T8") return x - 12;
                    if (d.tier === "T11" || d.tier === "T12") return x - 132;
                    return x - 70;
                })
                .attr("y", (d) => {
                    const y = Number(d.y ?? 0);
                    if (d.nodeType === "VE") return y - 5;
                    if (d.tier === "T1" || d.tier === "T2") return y - 135;
                    if (d.tier === "T3" || d.tier === "T4") return y - 45;
                    if (d.tier === "T5" || d.tier === "T6") return y - 50;
                    return y - 20;
                });
        }
 
        // -------------------- NODE ICONS --------------------
        gZoom
            .append("g")
            // VE nodes are only text labels => DO NOT render icon
            .selectAll("image")
            .data(nodes.filter((n) => n.nodeType !== "VE"))
            .enter()
            .append("image")
            .attr("href", (d) => getIconHref(d))
            .attr("x", (d) => getXY(d).x)
            .attr("y", (d) => getXY(d).y)
            .attr("width", (d) => getWH(d).w)
            .attr("height", (d) => getWH(d).h)
            .style("cursor", "pointer")
            .on("click", function (_event, d) {
                onNodeClick?.(d);
            });
 
        // -------------------- ZOOM + PAN --------------------
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.25, 3.5])
            .wheelDelta((event: any) => -event.deltaY * 0.002)
            .on("zoom", (event) => {
                gZoom.attr("transform", event.transform.toString());
            });
 
        svg.call(zoom as any);
        svg.on("dblclick.zoom", null);
    }, [nodes, links, nodeMap, showText, onNodeClick, onLinkHoverIn, onLinkHoverOut]);
 
    return (
        <svg
            ref={svgRef}
            id="svg_topology"
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
                width: "100%",
                height: "100%",
                display: "block",
            }}
        />
    );
};
 
export default TopologyCanvasD3;