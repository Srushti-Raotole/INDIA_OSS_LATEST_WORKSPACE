import React, { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import type { ConcNode, ResolvedLink, TooltipState } from "./concDCTopologyTypes";
import ICON_T1 from "../../../assets/dc3.png";
import ICON_T2 from "../../../assets/splitter1.png";
import ICON_OTHER from "../../../assets/other.png";
 
/* ---------------- helpers ---------------- */
/**
 * Clamp ensures a value stays inside [min, max].
 * Used to keep control-points (curve bend points) from going too far away,
 * so links never "explode" off-screen during zoom/pan.
 */
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
 
/* ---------------- ICONS ---------------- */
const getIcon = (n: ConcNode) => {
  if (n.tier === "T1") return ICON_T1;
  if (n.tier === "T2") return ICON_T2;
  return ICON_OTHER;
};
 
const getW = (n: ConcNode) => (n.tier === "T1" ? 130 : n.tier === "T2" ? 30 : 20);
const getH = (n: ConcNode) => (n.tier === "T1" ? 95 : n.tier === "T2" ? 18 : 20);
 
// IMPORTANT: These offsets must match your node image x/y positioning
const getXOffset = (n: ConcNode) => (n.tier === "T1" ? -80 : -18);
const getYOffset = (n: ConcNode) => (n.tier === "T1" ? -40 : -12);
 
/* ---------------- LINK STYLE ---------------- */
/**
 * Converts link "status" into visual style.
 * status=0 => down(red, thicker)
 * else    => up(green)
 */
const getLinkStrokeProps = (status: number | string) => {
  const s = Number(status);
  if (s === 0) return { stroke: "#FF0000", strokeWidth: 2.5, strokeDasharray: undefined as any };
  return { stroke: "#28a745", strokeWidth: 2, strokeDasharray: undefined as any };
};
 
/* ---------------- CURVE PATH ---------------- */
/**
 * Quadratic curve from src to dst with one control-point (cx,cy).
 * This is the core of curved links.
 */
function quadPathAbs(src: { x: number; y: number }, dst: { x: number; y: number }, cx: number, cy: number) {
  return `M ${src.x} ${src.y} Q ${cx} ${cy} ${dst.x} ${dst.y}`;
}
 
/**
 * Tangent (derivative) of quadratic bezier at t
 * B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
 */
const quadTangentAtT = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number
) => {
  const u = 1 - t;
  const dx = 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return { dx, dy };
};
 
/** Keep text readable (avoid upside-down) */
const normalizeAngleDeg = (deg: number) => {
  let a = deg;
  // put angle in [-180..180]
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  // flip if upside down
  if (a > 90) a -= 180;
  if (a < -90) a += 180;
  return a;
};
 
 
/* ---------------- INTERNAL TYPES ---------------- */
type NodeDraw = ConcNode & { _sx: number; _sy: number };
type BendAbs = { cx: number; cy: number };
 
type LinkDraw = {
  key: string;
  link: ResolvedLink;
  src: NodeDraw;
  dst: NodeDraw;
  cx: number;
  cy: number;
 
  /** NEW: index within pair-group (for label placement) */
  idx: number;
  /** NEW: total links in that pair-group */
  count: number;
};
 
type Props = {
  nodes: ConcNode[];
  linksResolved: ResolvedLink[];
  showText: boolean;
  canvas: { width: number; height: number };
  baseScale?: number;
  onNodeClick: (n: ConcNode) => void;
  onTooltip: (t: TooltipState) => void;
};
 
/**
 * Zoom bounds (almost unlimited)
 */
const MIN_ZOOM = 0.001;
const MAX_ZOOM = 100;
 
/* ---------------- stable stringify ---------------- */
/**
 * Stable stringify makes object key order deterministic.
 * Used for consistent link signatures so our dedupe is stable across renders.
 */
const stableStringify = (val: any): string => {
  if (val === null || val === undefined) return String(val);
  if (typeof val !== "object") return JSON.stringify(val);
  if (Array.isArray(val)) return `[${val.map(stableStringify).join(",")}]`;
  const keys = Object.keys(val).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableStringify((val as any)[k])).join(",")}}`;
};
 
/* ---------------- undirected signature ---------------- */
/**
 * Creates a "pair signature" ignoring direction.
 * So A->B and B->A can be treated as same for dedupe/grouping.
 */
const linkSignatureUndirected = (lk: ResolvedLink): string => {
  const a = Number((lk as any).oriNodeNumber);
  const b = Number((lk as any).terNodeNumber);
  const min = Math.min(a, b);
  const max = Math.max(a, b);
 
  const clean: any = { ...(lk as any) };
  // remove fields that change per render / are directional
  delete clean.__src;
  delete clean.__dst;
  delete clean.oriNodeNumber;
  delete clean.terNodeNumber;
  delete clean.status;
  delete clean.key;
  delete clean.pairKey;
 
  return `${min}-${max}::${stableStringify(clean)}`;
};
 
/**
 * Dedupe links so we don't draw duplicate A<->B lines.
 * If duplicates exist, we compute a "worst status":
 * - if any status=0 => worst=0 (down)
 * - else if any status=1 => worst=1
 * - else => worst=2
 */
const dedupeUndirectedLinks = (arr: ResolvedLink[]): ResolvedLink[] => {
  const m = new Map<string, ResolvedLink[]>();
  for (const lk of arr) {
    const sig = linkSignatureUndirected(lk);
    if (!m.has(sig)) m.set(sig, []);
    m.get(sig)!.push(lk);
  }
 
  const worstStatus = (links: ResolvedLink[]) => {
    let has0 = false;
    let has1 = false;
    for (const l of links) {
      const s = Number((l as any).status);
      if (s === 0) has0 = true;
      else if (s === 1) has1 = true;
    }
    return has0 ? 0 : has1 ? 1 : 2;
  };
 
  const out: ResolvedLink[] = [];
  for (const [, group] of m) {
    const rep = { ...(group[0] as any) } as ResolvedLink;
    (rep as any).status = worstStatus(group);
    out.push(rep);
  }
  return out;
};
 
/* ---------------- GROUP BOX CONFIG ---------------- */
type GroupBoxCfg = {
  id: string;
  title: string;
  membersByName: string[];
  labelPosition?: "top" | "bottom";
};
 
const GROUPS: GroupBoxCfg[] = [
  {
    id: "ctrls",
    title: "CTRLS AMBATTUR",
    membersByName: ["MAA21 DC(L)", "MAA21 RNG24", "MAA21 RNG4"],
    labelPosition: "top",
  },
  {
    id: "ntt",
    title: "NTT AMBATTUR",
    membersByName: ["MAA37 RNG3"],
    labelPosition: "bottom",
  },
  {
    id: "stt",
    title: "STT AMBATTUR",
    membersByName: ["MAA01 DC(S)", "MAA20 DC(M)"],
    labelPosition: "top",
  },
];
 
/* ---------------- YOUR NEW FIX CONFIG ---------------- */
/**
 * 1) These nodes must show label above the icon for better readability.
 */
const LABEL_ABOVE_NAMES = new Set<string>(["MAA21 DC(L)", "MAA21 RNG4"]);
 
/**
 * 2) Fine-tune node Y position (pixel offsets in viewBox coordinates).
 * Positive => move down, Negative => move up.
 */
const NODE_Y_TWEAK: Record<string, number> = {
  "MAA37 RNG3": 40,
};
 
/* ---------------- BBOX FOR A NODE IMAGE ---------------- */
const computeNodeBBox = (n: NodeDraw) => {
  const x0 = n._sx + getXOffset(n);
  const y0 = n._sy + getYOffset(n);
  const x1 = x0 + getW(n);
  const y1 = y0 + getH(n);
  return { x0, y0, x1, y1 };
};
 
/**
 * Label anchor point is computed from icon center.
 */
const computeLabelAnchor = (n: NodeDraw) => {
  const iconCenterX = n._sx + getXOffset(n) + getW(n) / 2;
 
  const iconTopY = n._sy + getYOffset(n);
  const iconBottomY = iconTopY + getH(n);
 
  const isAbove = LABEL_ABOVE_NAMES.has(String(n.nodeName).trim());
 
  const ABOVE_GAP = 10;
  const BELOW_GAP = 18;
 
  let y = isAbove ? iconTopY - ABOVE_GAP : iconBottomY + BELOW_GAP;
 
  // ONLY move label text slightly up (NOT node, NOT box)
  if (String(n.nodeName).trim() === "MAA37 RNG3") {
    y -= 12;
  }
 
  return { x: iconCenterX, y, isAbove };
};
 
/* ---------------- LINK LABEL HELPERS (SUBNET) ---------------- */
const normalUnit = (src: { x: number; y: number }, dst: { x: number; y: number }) => {
  const vx = dst.x - src.x;
  const vy = dst.y - src.y;
  const len = Math.hypot(vx, vy) || 1;
  const ux = vx / len;
  const uy = vy / len;
  return { nx: -uy, ny: ux };
};
 
/** clamp [0..1] for bezier t */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
 
/**
 * Point on Quadratic Bezier curve at parameter t.
 * P(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
 */
const quadPointAtT = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number
) => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
};
 
const ConcDCTopologyCanvasImpl: React.FC<Props> = ({
  nodes,
  linksResolved,
  showText,
  canvas,
  baseScale = 0.6,
  onNodeClick,
  onTooltip,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
 
  /** keep link bend points stable */
  const bendsRef = useRef<Record<string, BendAbs>>({});
 
  /** auto-fit only once after data exists */
  const didAutoFitRef = useRef(false);
 
  /* tooltip throttle */
  const rafRef = useRef<number | null>(null);
  const lastTooltipRef = useRef<TooltipState>({ open: false });
  const emitTooltip = (next: TooltipState) => {
    lastTooltipRef.current = next;
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      onTooltip(lastTooltipRef.current);
    });
  };
 
  const linksUnique: ResolvedLink[] = useMemo(() => dedupeUndirectedLinks(linksResolved || []), [linksResolved]);
 
  const nodeByNo = useMemo(() => {
    const m = new Map<number, ConcNode>();
    nodes.forEach((n) => m.set(n.nodeNo, n));
    return m;
  }, [nodes]);
 
  const adjacency = useMemo(() => {
    const adj = new Map<number, Array<{ nb: number; link: ResolvedLink }>>();
    const add = (a: number, b: number, lk: ResolvedLink) => {
      if (!adj.has(a)) adj.set(a, []);
      adj.get(a)!.push({ nb: b, link: lk });
    };
    for (const lk of linksUnique) {
      add(lk.oriNodeNumber, lk.terNodeNumber, lk);
      add(lk.terNodeNumber, lk.oriNodeNumber, lk);
    }
    return adj;
  }, [linksUnique]);
 
  /** VN collapsing */
  const resolveThroughVN = (cur: number, prev: number) => {
    const along: ResolvedLink[] = [];
    const pathNodes: number[] = [prev, cur];
    let current = cur;
    let previous = prev;
 
    for (let guard = 0; guard < 80; guard++) {
      const node = nodeByNo.get(current);
      if (!node) return { end: null as number | null, along, pathNodes };
      if (node.nodeType !== "VN") return { end: current, along, pathNodes };
 
      const nbs = adjacency.get(current) ?? [];
      const next = nbs.find((x) => x.nb !== previous);
      if (!next) return { end: null as number | null, along, pathNodes };
 
      along.push(next.link);
      previous = current;
      current = next.nb;
      pathNodes.push(current);
    }
    return { end: null as number | null, along, pathNodes };
  };
 
  /** collapse links */
  const collapsedLinks = useMemo(() => {
    const worstStatus = (arr: Array<ResolvedLink>) => {
      let has0 = false;
      let has1 = false;
      for (const l of arr) {
        const s = Number((l as any).status);
        if (s === 0) has0 = true;
        else if (s === 1) has1 = true;
      }
      return has0 ? 0 : has1 ? 1 : 2;
    };
 
    const out: Array<{ key: string; a: number; b: number; linksAlong: ResolvedLink[]; worst: number; pairKey: string }> = [];
 
    for (const lk of linksUnique) {
      const a0 = lk.oriNodeNumber;
      const b0 = lk.terNodeNumber;
 
      const na = nodeByNo.get(a0);
      const nb = nodeByNo.get(b0);
      if (!na || !nb) continue;
      if (na.nodeType === "VN") continue;
 
      const ra = na.nodeType === "VN" ? resolveThroughVN(a0, b0) : { end: a0, along: [], pathNodes: [b0, a0] };
      const rb = nb.nodeType === "VN" ? resolveThroughVN(b0, a0) : { end: b0, along: [], pathNodes: [a0, b0] };
 
      if (!ra.end || !rb.end) continue;
      if (ra.end === rb.end) continue;
 
      const chain = [lk, ...ra.along, ...rb.along].filter(Boolean);
      const w = worstStatus(chain);
 
      const minEnd = Math.min(ra.end, rb.end);
      const maxEnd = Math.max(ra.end, rb.end);
      const pairKey = `${minEnd}-${maxEnd}`;
 
      out.push({ key: `${pairKey}-${out.length}`, a: minEnd, b: maxEnd, linksAlong: chain, worst: w, pairKey });
    }
    return out;
  }, [linksUnique, nodeByNo, adjacency]);
 
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
 
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
 
    const vbW = canvas.width / baseScale;
    const vbH = canvas.height / baseScale;
 
    const gRoot = svg.append("g").attr("class", "zoom-root");
    const gZoom = gRoot.append("g").attr("class", "g-zoom");
 
    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    svgEl.addEventListener("wheel", wheelHandler, { passive: false });
 
    gZoom
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", vbW)
      .attr("height", vbH)
      .attr("fill", "transparent")
      .style("pointer-events", "all")
      .on("mousemove", () => emitTooltip({ open: false }))
      .on("mousedown", () => emitTooltip({ open: false }))
      .on("click", () => emitTooltip({ open: false }));
 
    /** NodeDraw */
    const nodeDraw: NodeDraw[] = nodes
      .filter((n) => n.nodeType !== "VN")
      .map((n) => {
        const nm = String(n.nodeName).trim();
        const tweakY = NODE_Y_TWEAK[nm] ?? 0;
        return {
          ...n,
          _sx: n.x,
          _sy: n.y + tweakY,
        };
      });
 
    const nodeDrawByNo = new Map<number, NodeDraw>();
    const nodeDrawByName = new Map<string, NodeDraw>();
    nodeDraw.forEach((n) => {
      nodeDrawByNo.set(n.nodeNo, n);
      nodeDrawByName.set(String(n.nodeName).trim(), n);
    });
 
    /* ===== GROUP BOXES ===== */
    const groupsG = gZoom.append("g").attr("class", "group-boxes");
 
    const BOX_PAD_X = 70;
    const BOX_PAD_Y = 70;
    const LABEL_H = 84;
    const LABEL_W_MIN = 220;
 
    const groupBounds: Array<{ x0: number; y0: number; x1: number; y1: number }> = [];
 
    const drawGroup = (cfg: GroupBoxCfg) => {
      const members = cfg.membersByName
        .map((nm) => nodeDrawByName.get(String(nm).trim()))
        .filter(Boolean) as NodeDraw[];
 
      if (!members.length) return;
 
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
 
      for (const n of members) {
        const bb = computeNodeBBox(n);
        minX = Math.min(minX, bb.x0);
        minY = Math.min(minY, bb.y0);
        maxX = Math.max(maxX, bb.x1);
        maxY = Math.max(maxY, bb.y1);
      }
 
      const x = minX - BOX_PAD_X;
      const y = minY - (BOX_PAD_Y + LABEL_H);
      const w = maxX - minX + BOX_PAD_X * 2;
      const h = maxY - minY + BOX_PAD_Y * 2 + LABEL_H;
 
      groupBounds.push({ x0: x, y0: y, x1: x + w, y1: y + h });
 
      const g = groupsG.append("g").attr("class", `group-${cfg.id}`);
 
      g.append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", w)
        .attr("height", h)
        .attr("rx", 18)
        .attr("ry", 18)
        .attr("fill", "rgba(255, 255, 255, 0.55)")
        .attr("stroke", "#990033")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "10 8");
 
      const labelW = Math.max(LABEL_W_MIN, cfg.title.length * 12);
      const isBottom = cfg.labelPosition === "bottom";
      let pillX = x + 20;
      // Only STT: right aligned inside the same group box
      if (cfg.id === "stt") {
        pillX = x + w - labelW - 20; // right padding = 20
      }
      const pillY = isBottom ? y + h - 44 : y + 14;
 
      g.append("rect")
        .attr("x", pillX)
        .attr("y", pillY)
        .attr("width", labelW)
        .attr("height", 30)
        .attr("rx", 14)
        .attr("ry", 14)
        .attr("fill", "rgba(167, 243, 208, 0.95)")
        .attr("stroke", "#34D399")
        .attr("stroke-width", 2);
 
      g.append("text")
        .attr("x", pillX + 14)
        .attr("y", pillY + 20)
        .text(cfg.title)
        .attr("font-size", 14)
        .attr("font-weight", 900)
        .attr("fill", "#064420")
        .attr("letter-spacing", "0.08em");
    };
 
    GROUPS.forEach(drawGroup);
 
    /* ===== LINKS ===== */
    const getNormal = (src: { _sx: number; _sy: number }, dst: { _sx: number; _sy: number }) => {
      const vx = dst._sx - src._sx;
      const vy = dst._sy - src._sy;
      const len = Math.hypot(vx, vy) || 1;
      const ux = vx / len;
      const uy = vy / len;
      return { nx: -uy, ny: ux };
    };
 
    const temp = collapsedLinks
      .map((c) => {
        const src = nodeDrawByNo.get(c.a);
        const dst = nodeDrawByNo.get(c.b);
        if (!src || !dst) return null;
 
        const base = c.linksAlong?.[0] ?? ({} as any);
        const synthetic: ResolvedLink = {
          ...base,
          oriNodeNumber: src.nodeNo,
          terNodeNumber: dst.nodeNo,
          status: c.worst,
          __src: src,
          __dst: dst,
        };
        return { c, src, dst, link: synthetic };
      })
      .filter(Boolean) as Array<{ c: any; src: NodeDraw; dst: NodeDraw; link: ResolvedLink }>;
 
    const pairGroups = new Map<string, typeof temp>();
    for (const t of temp) {
      const k = t.c.pairKey;
      if (!pairGroups.has(k)) pairGroups.set(k, []);
      pairGroups.get(k)!.push(t);
    }
 
    const GAP = 40;
    const linkDraw: LinkDraw[] = [];
    const nextBends: Record<string, BendAbs> = {};
 
    const CP_MIN_X = -vbW * 50;
    const CP_MAX_X = vbW * 50;
    const CP_MIN_Y = -vbH * 50;
    const CP_MAX_Y = vbH * 50;
 
    for (const [pairKey, arr] of pairGroups) {
      arr.sort((a, b) => String(a.c.key).localeCompare(String(b.c.key)));
      const n = arr.length;
 
      for (let i = 0; i < n; i++) {
        const it = arr[i];
        const stableKey = `${pairKey}::${i}`;
 
        const { nx, ny } = getNormal(it.src, it.dst);
        const offset = (i - (n - 1) / 2) * GAP;
 
        const mx = (it.src._sx + it.dst._sx) / 2;
        const my = (it.src._sy + it.dst._sy) / 2;
 
        const defaultCx = mx + nx * offset;
        const defaultCy = my + ny * offset;
 
        const stored = bendsRef.current[stableKey];
        let cx = stored?.cx ?? defaultCx;
        let cy = stored?.cy ?? defaultCy;
 
        cx = clamp(cx, CP_MIN_X, CP_MAX_X);
        cy = clamp(cy, CP_MIN_Y, CP_MAX_Y);
 
        nextBends[stableKey] = { cx, cy };
 
        linkDraw.push({
          key: stableKey,
          link: it.link,
          src: it.src,
          dst: it.dst,
          cx,
          cy,
          idx: i,
          count: n,
        });
      }
    }
 
    bendsRef.current = nextBends;
 
    const linksG = gZoom.append("g").attr("class", "links");
 
    const linksHit = linksG
      .selectAll("path.link-hit")
      .data(linkDraw, (d: any) => d.key)
      .enter()
      .append("path")
      .attr("class", "link-hit")
      .attr("d", (d) => quadPathAbs({ x: d.src._sx, y: d.src._sy }, { x: d.dst._sx, y: d.dst._sy }, d.cx, d.cy))
      .attr("stroke", "transparent")
      .attr("stroke-width", 22)
      .attr("fill", "none")
      .style("cursor", "default")
      .style("pointer-events", "stroke");
 
    const linksVisible = linksG
      .selectAll("path.link-visible")
      .data(linkDraw, (d: any) => d.key)
      .enter()
      .append("path")
      .attr("class", "link-visible")
      .attr("d", (d) => quadPathAbs({ x: d.src._sx, y: d.src._sy }, { x: d.dst._sx, y: d.dst._sy }, d.cx, d.cy))
      .attr("fill", "none")
      .style("pointer-events", "none");
 
    linksVisible.each(function (d) {
      const st = getLinkStrokeProps((d.link as any).status);
      d3.select(this).attr("stroke", st.stroke).attr("stroke-width", st.strokeWidth).attr("stroke-dasharray", null);
    });
 
    linksHit
      .on("mousedown", (event) => {
        event.stopPropagation();
        emitTooltip({ open: false });
      })
      .on("mousemove", (event, d) => {
        emitTooltip({ open: true, x: event.clientX + 12, y: event.clientY + 12, link: d.link });
      })
      .on("mouseleave", () => emitTooltip({ open: false }));
 
    /* ===== LINK SUBNET LABELS (ROTATED ON CURVE, BOUND TO showText) ===== */
    const linkLabelsG = gZoom.append("g").attr("class", "link-labels");
 
    // label sits slightly above the link
    const LINK_LABEL_OFFSET = 10;
 
    // spread along curve for same pair
    const T_SPREAD = 0.08;
 
    // (optional) tiny shift along tangent so it doesn't touch node area
    const T_ALONG_SHIFT = 0.0;
 
    linkLabelsG
      .selectAll("text")
      .data(linkDraw, (d: any) => d.key)
      .enter()
      .append("text")
      .text((d) => {
        const subnet = String((d.link as any)?.subnet ?? "").trim();
        if (!subnet || subnet.toUpperCase() === "NA") return "";
        return subnet;
      })
      // we will position using transform, so keep x/y = 0
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", 12)
      .attr("font-weight", 800)
      .attr("fill", "#111")
      .attr("paint-order", "stroke")
      .attr("stroke", "#fff")
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round")
      .attr("letter-spacing", "0.08em")
      .style("display", showText ? "inline" : "none")
      .style("pointer-events", "none")
      .attr("transform", (d) => {
        const p0 = { x: d.src._sx, y: d.src._sy };
        const p1 = { x: d.cx, y: d.cy };
        const p2 = { x: d.dst._sx, y: d.dst._sy };
 
        const t = clamp01(0.5 + (d.idx - (d.count - 1) / 2) * T_SPREAD + T_ALONG_SHIFT);
 
        const pt = quadPointAtT(p0, p1, p2, t);
 
        // normal to line (src->dst) for "above"
        const { nx, ny } = normalUnit(p0, p2);
        const x = pt.x + nx * (-LINK_LABEL_OFFSET);
        const y = pt.y + ny * (-LINK_LABEL_OFFSET);
 
        // tangent for rotation
        const tg = quadTangentAtT(p0, p1, p2, t);
        const angleDegRaw = (Math.atan2(tg.dy, tg.dx) * 180) / Math.PI;
        const angleDeg = normalizeAngleDeg(angleDegRaw);
 
        return `translate(${x},${y}) rotate(${angleDeg})`;
      });
    /* ===== NODES ===== */
    const nodesG = gZoom.append("g").attr("class", "nodes");
 
    const nodeSel = nodesG
      .selectAll("g.node")
      .data(nodeDraw, (d: any) => String(d.nodeNo))
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (n) => `translate(${n._sx},${n._sy})`)
      .style("pointer-events", "all")
      .on("mousedown", (event) => event.stopPropagation());
 
    nodeSel
      .append("image")
      .attr("href", (d) => getIcon(d))
      .attr("width", (d) => getW(d))
      .attr("height", (d) => getH(d))
      .attr("x", (d) => getXOffset(d))
      .attr("y", (d) => getYOffset(d))
      .style("cursor", "pointer")
      .style("pointer-events", "all")
      .on("mousedown", (event) => {
        event.stopPropagation();
        emitTooltip({ open: false });
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        emitTooltip({ open: false });
        onNodeClick({ ...d, x: d._sx, y: d._sy });
      });
 
    /* ===== NODE LABELS ===== */
    const labelsG = gZoom.append("g").attr("class", "labels");
 
    labelsG
      .selectAll("text")
      .data(nodeDraw, (d: any) => String(d.nodeNo))
      .enter()
      .append("text")
      .text((d) => d.nodeName)
      .attr("x", (d) => computeLabelAnchor(d).x)
      .attr("y", (d) => computeLabelAnchor(d).y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", (d) => (computeLabelAnchor(d).isAbove ? "auto" : "hanging"))
      .attr("font-size", 12)
      .attr("font-weight", 700)
      .attr("fill", "#000")
      .attr("letter-spacing", "0.08em")
      .style("display", showText ? "inline" : "none")
      .style("pointer-events", "none");
 
    /* ===== ZOOM ===== */
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .filter((event: any) => {
        const t = event.target as Element | null;
        if (t?.closest?.(".node")) return false;
        if (t?.closest?.(".link-hit")) return false;
        return true;
      })
      .on("start", () => emitTooltip({ open: false }))
      .on("zoom", (event) => {
        gZoom.attr("transform", event.transform.toString());
      });
 
    svg.call(zoomBehavior as any);
 
    /* ===== AUTO-FIT ===== */
    const autoFit = () => {
      if (!nodeDraw.length) return false;
 
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
 
      for (const n of nodeDraw) {
        const bb = computeNodeBBox(n);
        minX = Math.min(minX, bb.x0);
        minY = Math.min(minY, bb.y0);
        maxX = Math.max(maxX, bb.x1);
        maxY = Math.max(maxY, bb.y1);
      }
 
      for (const gb of groupBounds) {
        minX = Math.min(minX, gb.x0);
        minY = Math.min(minY, gb.y0);
        maxX = Math.max(maxX, gb.x1);
        maxY = Math.max(maxY, gb.y1);
      }
 
      const MARGIN = 140;
      minX -= MARGIN;
      minY -= MARGIN;
      maxX += MARGIN;
      maxY += MARGIN;
 
      const boundsW = Math.max(1, maxX - minX);
      const boundsH = Math.max(1, maxY - minY);
 
      const kFit = Math.min(vbW / boundsW, vbH / boundsH) * 1.2;
      const k = clamp(kFit, 0.05, MAX_ZOOM);
 
      const tx = (vbW - boundsW * k) / 2 - minX * k;
      const ty = (vbH - boundsH * k) / 2 - minY * k;
 
      const t0 = d3.zoomIdentity.translate(tx, ty).scale(k);
      svg.call(zoomBehavior.transform as any, t0);
      return true;
    };
 
    if (!didAutoFitRef.current) {
      const ok = autoFit();
      if (ok) didAutoFitRef.current = true;
    } else {
      const prevT = d3.zoomTransform(svgEl);
      svg.call(zoomBehavior.transform as any, prevT);
    }
 
    return () => {
      svg.on(".zoom", null);
      svgEl.removeEventListener("wheel", wheelHandler);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [nodes, linksUnique, collapsedLinks, showText, canvas.width, canvas.height, baseScale, onNodeClick, onTooltip]);
 
  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${canvas.width / baseScale} ${canvas.height / baseScale}`}
      style={{
        display: "block",
        background: "transparent",
        userSelect: "none",
        WebkitUserSelect: "none",
        msUserSelect: "none",
        touchAction: "none",
      }}
    />
  );
};
 
const ConcDCTopologyCanvas = React.memo(ConcDCTopologyCanvasImpl);
export default ConcDCTopologyCanvas;