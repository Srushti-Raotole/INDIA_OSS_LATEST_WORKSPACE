import React, { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
 
import tier1Icon from "../../../assets/tier1infineraBlack.png";
import tier2Icon from "../../../assets/splitter1.png";
import tier3Icon from "../../../assets/tier3infinera.png";
import otherIcon from "../../../assets/other.png";
import { TopologyLink, TopologyNode } from "./topologyTypes";
 
const getNodeIcon = (node: TopologyNode): string => {
  if (node.nodeType === "VN") return tier2Icon;
  switch (node.tier) {
    case "T1":
      return tier1Icon;
    case "T2":
      return tier2Icon;
    case "T3":
      return tier3Icon;
    default:
      return otherIcon;
  }
};
 
const getNodeIconSize = (node: TopologyNode) => {
  if (node.nodeType === "VN") return { width: 8, height: 20 };
  if (node.tier === "T1" || node.tier === "T3") return { width: 120, height: 55 };
  if (node.tier === "T2") return { width: 35, height: 22 };
  return { width: 24, height: 24 };
};
 
const getLinkStrokeProps = (status: number) => {
  if (status === 0) return { stroke: "#FF0000", strokeWidth: 2.5, strokeDasharray: undefined as any };
  if (status === 1) return { stroke: "#000000", strokeWidth: 2.5, strokeDasharray: "5,5" };
  return { stroke: "#28a745", strokeWidth: 3.5, strokeDasharray: undefined as any };
};
 
interface TopologyCanvasProps {
  nodes: TopologyNode[];
  links: TopologyLink[];
  dragEnabled: boolean; // kept for compatibility (unused)
  onNodeClick: (node: TopologyNode) => void;
  onLinkHoverIn: (e: any, link: TopologyLink) => void;
  onLinkHoverOut: () => void;
  onNodePositionCommit: (nodeName: string, x: number, y: number) => void | Promise<void>; // kept (unused)
}
 
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
 
type NodeDraw = TopologyNode & { _sx: number; _sy: number };
 
type LinkDraw = {
  key: string;
  link: TopologyLink;
  src: NodeDraw;
  dst: NodeDraw;
  dx: number;
  dy: number;
};
 
function quadPath(
  src: { x: number; y: number },
  dst: { x: number; y: number },
  dx: number,
  dy: number
) {
  const mx = (src.x + dst.x) / 2;
  const my = (src.y + dst.y) / 2;
  const cx = mx + dx;
  const cy = my + dy;
  return `M ${src.x} ${src.y} Q ${cx} ${cy} ${dst.x} ${dst.y}`;
}
 
const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  nodes,
  links,
  onNodeClick,
  onLinkHoverIn,
  onLinkHoverOut,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
 
  // in-memory positions (still used so layout stays stable)
  const nodePosRef = useRef<Record<number, { sx: number; sy: number }>>({});
  const bendsRef = useRef<Record<string, { dx: number; dy: number }>>({});
 
  const { svgSize, offset, nodeByNo, visibleNodesKey } = useMemo(() => {
    if (!nodes.length) {
      return {
        svgSize: { width: 1600, height: 900 },
        offset: { x: 0, y: 0 },
        nodeByNo: new Map<number, TopologyNode>(),
        visibleNodesKey: "",
      };
    }
 
    const m = new Map<number, TopologyNode>();
    nodes.forEach((n) => m.set(n.nodeNo, n));
 
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
 
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
 
    const padding = 200;
    const offsetX = padding - minX;
    const offsetY = padding - minY;
 
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
 
    const visKey = nodes.filter((n) => n.nodeType !== "VN").map((n) => n.nodeNo).join(",");
 
    return {
      svgSize: { width, height },
      offset: { x: offsetX, y: offsetY },
      nodeByNo: m,
      visibleNodesKey: visKey,
    };
  }, [nodes]);
 
  const adjacency = useMemo(() => {
    const adj = new Map<number, Array<{ nb: number; link: TopologyLink }>>();
    const add = (a: number, b: number, lk: TopologyLink) => {
      if (!adj.has(a)) adj.set(a, []);
      adj.get(a)!.push({ nb: b, link: lk });
    };
 
    for (const lk of links) {
      add(lk.oriNodeNumber, lk.terNodeNumber, lk);
      add(lk.terNodeNumber, lk.oriNodeNumber, lk);
    }
    return adj;
  }, [links]);
 
  const resolveThroughVN = (cur: number, prev: number): { end: number | null; along: TopologyLink[] } => {
    const along: TopologyLink[] = [];
    let current = cur;
    let previous = prev;
 
    for (let guard = 0; guard < 50; guard++) {
      const node = nodeByNo.get(current);
      if (!node) return { end: null, along };
      if (node.nodeType !== "VN") return { end: current, along };
 
      const nbs = adjacency.get(current) ?? [];
      const next = nbs.find((x) => x.nb !== previous);
      if (!next) return { end: null, along };
 
      along.push(next.link);
      previous = current;
      current = next.nb;
    }
    return { end: null, along };
  };
 
  const collapsedLinks = useMemo(() => {
    const out = new Map<string, { a: number; b: number; linksAlong: TopologyLink[] }>();
 
    const worstStatus = (arr: TopologyLink[]) => {
      let has0 = false;
      let has1 = false;
      for (const l of arr) {
        if (l.status === 0) has0 = true;
        else if (l.status === 1) has1 = true;
      }
      return has0 ? 0 : has1 ? 1 : 2;
    };
 
    for (const lk of links) {
      const a0 = lk.oriNodeNumber;
      const b0 = lk.terNodeNumber;
 
      const na = nodeByNo.get(a0);
      const nb = nodeByNo.get(b0);
      if (!na || !nb) continue;
 
      const ra = na.nodeType === "VN" ? resolveThroughVN(a0, b0) : { end: a0, along: [] as TopologyLink[] };
      const rb = nb.nodeType === "VN" ? resolveThroughVN(b0, a0) : { end: b0, along: [] as TopologyLink[] };
 
      if (!ra.end || !rb.end) continue;
      if (ra.end === rb.end) continue;
 
      const min = Math.min(ra.end, rb.end);
      const max = Math.max(ra.end, rb.end);
      const key = `${min}-${max}`;
 
      const chain = [lk, ...ra.along, ...rb.along].filter(Boolean);
 
      const existing = out.get(key);
      if (!existing) out.set(key, { a: min, b: max, linksAlong: chain });
      else {
        const s1 = worstStatus(existing.linksAlong);
        const s2 = worstStatus(chain);
        if (s2 < s1) out.set(key, { a: min, b: max, linksAlong: chain });
      }
    }
 
    return Array.from(out.entries()).map(([key, v]) => ({ key, ...v }));
  }, [links, nodeByNo, adjacency]);
 
  // init node positions (in-memory)
  useEffect(() => {
    const next: Record<number, { sx: number; sy: number }> = {};
 
    for (const n of nodes) {
      if (n.nodeType === "VN") continue;
      next[n.nodeNo] = { sx: n.x + offset.x, sy: n.y + offset.y };
    }
 
    nodePosRef.current = next;
  }, [visibleNodesKey, nodes, offset.x, offset.y]);
 
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
 
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
 
    const gRoot = svg.append("g").attr("class", "g-root");
    const gZoom = gRoot.append("g").attr("class", "g-zoom");
 
    let currentTransform = d3.zoomIdentity;
 
    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    svgEl.addEventListener("wheel", wheelHandler, { passive: false });
 
    // Background for capturing mouse events
    gZoom
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", svgSize.width)
      .attr("height", svgSize.height)
      .attr("fill", "transparent")
      .style("pointer-events", "all")
      .on("mousemove", () => onLinkHoverOut())
      .on("mousedown", () => onLinkHoverOut())
      .on("click", () => onLinkHoverOut());
 
    // Nodes (VN hidden)
    const nodeDraw: NodeDraw[] = nodes
      .filter((n) => n.nodeType !== "VN")
      .map((n) => {
        const stored = nodePosRef.current[n.nodeNo];
        return { ...n, _sx: stored?.sx ?? n.x + offset.x, _sy: stored?.sy ?? n.y + offset.y };
      });
 
    const nodeDrawByNo = new Map<number, NodeDraw>();
    nodeDraw.forEach((n) => nodeDrawByNo.set(n.nodeNo, n));
 
    // Links (collapsed through VN)
    const linkDraw: LinkDraw[] = collapsedLinks
      .map((c, idx) => {
        const src = nodeDrawByNo.get(c.a);
        const dst = nodeDrawByNo.get(c.b);
        if (!src || !dst) return null;
 
        if (!bendsRef.current[c.key]) {
          bendsRef.current[c.key] = { dx: 0, dy: (idx % 2 === 0 ? -1 : 1) * 90 };
        }
 
        // synthetic status
        const chain = c.linksAlong ?? [];
        let has0 = false;
        let has1 = false;
        for (const l of chain) {
          if (l.status === 0) has0 = true;
          else if (l.status === 1) has1 = true;
        }
        const status = has0 ? 0 : has1 ? 1 : 2;
 
        const base = chain[0] ?? ({} as any);
        const synthetic: TopologyLink = { ...base, oriNodeNumber: src.nodeNo, terNodeNumber: dst.nodeNo, status };
 
        return {
          key: c.key,
          link: synthetic,
          src,
          dst,
          dx: bendsRef.current[c.key].dx,
          dy: bendsRef.current[c.key].dy,
        };
      })
      .filter(Boolean) as LinkDraw[];
 
    const linksG = gZoom.append("g").attr("class", "links");
 
    // hit area (for hover only)
    const linksHit = linksG
      .selectAll("path.link-hit")
      .data(linkDraw, (d: any) => d.key)
      .enter()
      .append("path")
      .attr("class", "link-hit")
      .attr("d", (d) => quadPath({ x: d.src._sx, y: d.src._sy }, { x: d.dst._sx, y: d.dst._sy }, d.dx, d.dy))
      .attr("stroke", "transparent")
      .attr("stroke-width", 22)
      .attr("fill", "none")
      .style("cursor", "default")
      .style("pointer-events", "stroke")
      .style("touch-action", "none");
 
    // visible path
    const linksVisible = linksG
      .selectAll("path.link-visible")
      .data(linkDraw, (d: any) => d.key)
      .enter()
      .append("path")
      .attr("class", "link-visible")
      .attr("d", (d) => quadPath({ x: d.src._sx, y: d.src._sy }, { x: d.dst._sx, y: d.dst._sy }, d.dx, d.dy))
      .attr("fill", "none")
      .style("pointer-events", "none");
 
    linksVisible.each(function (d) {
      const stroke = getLinkStrokeProps(d.link.status);
      const s = d3.select(this).attr("stroke", stroke.stroke).attr("stroke-width", stroke.strokeWidth);
      if (stroke.strokeDasharray) s.attr("stroke-dasharray", stroke.strokeDasharray);
    });
 
    // hover handlers remain
    linksHit
      .on("mouseenter", (event, d) => onLinkHoverIn(event, d.link))
      .on("mousemove", (event, d) => onLinkHoverIn(event, d.link))
      .on("mouseleave", () => onLinkHoverOut())
      .on("mousedown", (event) => event.stopPropagation());
 
    const nodesG = gZoom.append("g").attr("class", "nodes");
 
    const nodeSel = nodesG
      .selectAll("g.node")
      .data(nodeDraw, (d: any) => String(d.nodeNo))
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (n) => `translate(${n._sx},${n._sy})`)
      .style("pointer-events", "all")
      .on("mouseenter", () => onLinkHoverOut())
      .on("mousedown", (event) => event.stopPropagation());
 
    // node image (NO DRAG)
    nodeSel
      .append("image")
      .attr("href", (node) => getNodeIcon(node))
      .attr("width", (node) => getNodeIconSize(node).width)
      .attr("height", (node) => getNodeIconSize(node).height)
      .attr("x", (node) => -getNodeIconSize(node).width / 2)
      .attr("y", (node) => -getNodeIconSize(node).height / 2)
      .style("cursor", "pointer")
      .style("pointer-events", "all")
      .style("user-select", "none")
      .style("-webkit-user-drag", "none")
      .on("dragstart", (event) => event.preventDefault())
      .on("click", (event, node) => {
        event.stopPropagation();
        onLinkHoverOut();
        onNodeClick({
          ...node,
          x: node._sx - offset.x,
          y: node._sy - offset.y,
        });
      });
 
    // labels
    const labelsG = gZoom.append("g").attr("class", "labels");
    const labelSel = labelsG
      .selectAll("g.label")
      .data(nodeDraw, (d: any) => String(d.nodeNo))
      .enter()
      .append("g")
      .attr("class", "label")
      .attr("transform", (node) => {
        const { height } = getNodeIconSize(node);
        const labelX = node._sx - 60;
        const labelY = node._sy - height / 2 - 8;
        return `translate(${labelX},${labelY})`;
      })
      .style("pointer-events", "none");
 
    labelSel.each(function (node) {
      const g = d3.select(this);
      const labelWidth = node.nodeName.length * 7 + 6;
      const labelHeight = 14;
 
      g.append("rect")
        .attr("x", -3)
        .attr("y", -labelHeight + 3)
        .attr("width", labelWidth)
        .attr("height", labelHeight)
        .attr("fill", "#fff7f8")
        .attr("stroke", "none");
 
      g.append("text")
        .text(node.nodeName)
        .attr("x", 0)
        .attr("y", 0)
        .attr("font-size", 12)
        .attr("font-weight", 500)
        .attr("letter-spacing", "0.05em");
    });
 
    // zoom/pan (unchanged)
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .filter((event: any) => {
        const t = event.target as Element | null;
        if (t?.closest?.(".node")) return false;
        if (t?.closest?.(".link-hit")) return false;
        return true;
      })
      .on("start", () => onLinkHoverOut())
      .on("zoom", (event) => {
        currentTransform = event.transform;
        gZoom.attr("transform", event.transform.toString());
      });
 
    svg.call(zoomBehavior as any);
 
    return () => {
      svg.on(".zoom", null);
      svgEl.removeEventListener("wheel", wheelHandler);
    };
  }, [
    visibleNodesKey,
    collapsedLinks,
    nodes,
    links,
    offset.x,
    offset.y,
    svgSize.width,
    svgSize.height,
    onNodeClick,
    onLinkHoverIn,
    onLinkHoverOut,
  ]);
 
  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
      style={{
        display: "block",
        userSelect: "none",
        WebkitUserSelect: "none",
        msUserSelect: "none",
        cursor: "default",
        touchAction: "none",
      }}
    />
  );
};
 
export default TopologyCanvas;