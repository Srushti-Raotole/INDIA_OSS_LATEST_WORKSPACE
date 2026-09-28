import React, { forwardRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
} from "recharts";
import { Box } from "@mui/material";

/* ================= TYPES ================= */
export type LineSeriesConfig = {
  label: string;
  key: string;
  color: string;
};

type Props = {
  data: any[];
  xKey: string;
  series: LineSeriesConfig[];
  xAxisLabel?: string;   
  yAxisLabel?: string;   
  yMin?: number;
  yTickCount?: number;   
  height?: number | string;
};

/* ================= HELPERS ================= */
const formatXAxis = (val: string) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")
    } ${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
};

/* ================= CUSTOM LEGEND ================= */
const BottomCenteredLegend = ({ payload }: any) => {
  if (!payload?.length) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 20,
        fontSize: "0.72rem",
        fontWeight: 700,
        marginTop: 16,
        letterSpacing: "0.02em"
      }}
    >
      {payload.map((item: any) => (
        <span key={item.value} style={{ color: item.color, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "1rem", lineHeight: 0 }}>•</span> {item.value}
        </span>
      ))}
    </div>
  );
};

/* ================= COMPONENT ================= */
const CommonLineChart = forwardRef<HTMLDivElement, Props>(
  (
    {
      data,
      xKey,
      series,
      xAxisLabel = "Time",
      yAxisLabel = "Value",
      yMin = 0,
      yTickCount = 5,   
      height = 280,
    },
    ref
  ) => {
    return (
      <Box ref={ref} sx={{ width: "100%", height, bgcolor: "#ffffff" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, left: 25, bottom: 20 }}
          >
            {/* GRID */}
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            {/* X AXIS */}
            <XAxis
              dataKey={xKey}
              tickFormatter={formatXAxis}
              angle={-25}
              textAnchor="end"
              height={60}
              stroke="#64748b"
              tick={{ fontSize: 10, fontWeight: 500, fill: "#64748b" }}
              label={
                xAxisLabel
                  ? {
                      value: xAxisLabel,
                      position: "insideBottom",
                      offset: -5,
                      fontSize: 11,
                      fontWeight: 700,
                      fill: "#475569",
                    }
                  : undefined
              }
            />

            {/* Y AXIS */}
            <YAxis
              domain={[yMin, "auto"]}
              tickCount={yTickCount}   
              stroke="#64748b"
              tick={{ fontSize: 10, fontWeight: 500, fill: "#64748b" }}
              label={
                yAxisLabel
                  ? {
                      value: yAxisLabel,
                      angle: -90,
                      position: "insideLeft",
                      offset: -12,
                      fontSize: 11,
                      fontWeight: 700,
                      fill: "#475569",
                    }
                  : undefined
              }
            />

            {/* HIGH-DENSITY AUDIT TOOLTIP OVERRIDE */}
            <Tooltip
              wrapperStyle={{ zIndex: 100 }}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "8px 12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              }}
              labelStyle={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#64748b",
                marginBottom: "4px",
                textTransform: "uppercase"
              }}
              itemStyle={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "2px 0",
              }}
              formatter={(v: any) => [`${v}`, ""]}
              labelFormatter={(label) => `Timestamp: ${new Date(label).toLocaleString("en-IN")}`}
            />

            {/* LINES */}
            {series.map((s) => (
              <Line
                key={s.key}
                dataKey={(row) => {
                  const v = row[s.key];
                  return v === null || v === undefined || v === "" ? null : Number(v);
                }}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 1 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                type="monotone"
                connectNulls={false}   
              />
            ))}

            {/* BRUSH */}
            <Brush
              dataKey={xKey}
              height={16}
              travellerWidth={6}
              stroke="#cbd5e1"
              fill="#f8fafc"
              tickFormatter={formatXAxis}
              style={{ fontSize: 9, fill: "#64748b" }}
            />

            {/* LEGEND */}
            <Legend
              verticalAlign="bottom"
              align="center"
              content={<BottomCenteredLegend />}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  }
);

export default CommonLineChart;