import React, { useMemo, useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import axiosClient from "@/api/axiosClient";

interface SeverityTrendData {
  name: string;
  color?: string;
  data: { time: string | Date; value: number }[];
}

interface SeverityTrendGraphProps {
  title?: string;
  yLabel?: string;
  xLabel?: string;
}

interface SeverityTrendApiRow {
  date: string;
  countCritical: string;
  countMajor: string;
  countMinor: string;
}

const ADAPTER_OPTIONS: string[] = [
  "CONC",
  "ADVA",
  "IFNR",
  "TLMR",
  "EPNM",
  "MCP",
  "NFMT",
];

const formatDateInput = (d: Date): string => {
  return d.toISOString().slice(0, 10);
};

const GraphTemplateSeverityTrend: React.FC<SeverityTrendGraphProps> = ({
  title = "Alarm Severity Trend",
  yLabel = "Count",
  xLabel = "",
}) => {
  // -------------------- FILTER STATES --------------------
  const [adapterName, setAdapterName] = useState<string>("CONC");

  const today = useMemo(() => new Date(), []);
  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const [dateStart, setDateStart] = useState<string>(
    formatDateInput(sevenDaysAgo)
  );
  const [dateEnd, setDateEnd] = useState<string>(formatDateInput(today));

  const [autoSeriesData, setAutoSeriesData] = useState<SeverityTrendData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const finalSeriesData = autoSeriesData;

  // -------------------- API CALL --------------------
  const fetchSeverityTrend = async () => {
    try {
      setLoading(true);

      const params = {
        AdapterName: adapterName,
        dateStart: `${dateStart} 00:00:00`,
        dateEnd: `${dateEnd} 00:00:00`,
      };

      const response = await axiosClient.get<SeverityTrendApiRow[]>(
        `/v1/faultbrowser/active-traps/graphtrend`,
        { params }
      );
      
      const rows = response.data ?? [];

      const criticalSeries: SeverityTrendData = {
        name: "Critical",
        color: "#d32f2f",
        data: rows.map((r) => ({
          time: r.date,
          value: Number(r.countCritical) || 0,
        })),
      };
      
      const majorSeries: SeverityTrendData = {
        name: "Major",
        color: "#f57c00",
        data: rows.map((r) => ({
          time: r.date,
          value: Number(r.countMajor) || 0,
        })),
      };

      const minorSeries: SeverityTrendData = {
        name: "Minor",
        color: "#fbc02d",
        data: rows.map((r) => ({
          time: r.date,
          value: Number(r.countMinor) || 0,
        })),
      };

      setAutoSeriesData([criticalSeries, majorSeries, minorSeries]);
    } catch (error) {
      console.error("Error fetching severity trend:", error);
      setAutoSeriesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeverityTrend();
  }, [dateStart, dateEnd, adapterName]);

  // -------------------- ECHARTS OPTION --------------------
  const option = useMemo(() => {
    return {
      title: { show: false },
      tooltip: { 
        trigger: "axis", 
        confine: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          fontSize: 11,
          color: '#334155'
        },
        extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-radius: 6px;'
      },
      legend: {
        data: finalSeriesData.map((s) => s.name),
        orient: "horizontal",
        top: 0,
        left: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 11,
          fontWeight: 500,
          color: '#64748b',
        },
      },
      grid: { top: 35, left: 50, right: 15, bottom: 45 },
      xAxis: {
        type: "time",
        name: xLabel,
        nameLocation: "middle",
        nameGap: 25,
        axisLine: {
          lineStyle: { color: '#cbd5e1' }
        },
        axisLabel: {
          fontSize: 9,
          fontWeight: 500,
          color: '#64748b'
        },
        splitLine: {
          show: true,
          lineStyle: { 
            type: 'dashed',
            color: '#f1f5f9'
          },
        },
      },
      yAxis: {
        type: "value",
        nameLocation: "middle",
        nameRotate: 90,
        nameGap: 35,
        min: 0,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          fontWeight: 500,
          color: '#64748b'
        },
        splitLine: {
          show: true,
          lineStyle: { 
            type: 'dashed',
            color: '#f1f5f9'
          },
        },
      },
      series: finalSeriesData.map((s) => ({
        name: s.name,
        type: "line",
        smooth: true, // Swapped to a smooth interpolation profile
        showSymbol: false,
        symbolSize: 4,
        sampling: "lttb",
        lineStyle: { width: 2 },
        data: s.data.map((d) => [d.time, d.value]),
        itemStyle: { color: s.color || undefined },
        areaStyle: { opacity: 0.06 }, // Muted background areas under curves
        animation: true,
      })),
    };
  }, [yLabel, xLabel, finalSeriesData]);

  return (
    <Card
      sx={{
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        borderRadius: 3,
        height: "100%",
        width: "100%",
        border: '1px solid #f1f5f9',
        display: "flex",
        flexDirection: "column",
        backgroundColor: '#ffffff'
      }}
    >
      <CardContent
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          p: 2,
          "&:last-child": { pb: 2 },
        }}
      >
        {/* --------- TOP HEADER + FILTERS --------- */}
        <Box
          sx={{
            mb: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            pb: 0.75,
            borderBottom: '1px solid #f8fafc'
          }}
        >
          <Typography
            sx={{ 
              fontWeight: 700, 
              fontSize: '0.75rem', 
              color: '#334155',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              whiteSpace: "nowrap"
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              "& .MuiInputBase-root": {
                height: 28,
                borderRadius: '6px',
                fontSize: '0.72rem',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                '& fieldset': { border: 'none' },
              },
              "& .MuiInputLabel-root": {
                fontSize: '0.75rem',
                color: '#64748b',
                top: -3,
              }
            }}
          >
            {/* Adapter dropdown */}
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select
                value={adapterName}
                onChange={(e) => setAdapterName(e.target.value as string)}
                displayEmpty
                inputProps={{ 'aria-label': 'Select Adapter' }}
                sx={{
                  fontWeight: 600,
                  "& .MuiSelect-select": {
                    py: 0,
                    display: "flex",
                    alignItems: "center",
                  },
                }}
              >
                {ADAPTER_OPTIONS.map((ad) => (
                  <MenuItem key={ad} value={ad} sx={{ fontSize: "0.75rem" }}>
                    {ad}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* From date */}
            <TextField
              size="small"
              type="date"
              label="From"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 130 }}
            />

            {/* To date */}
            <TextField
              size="small"
              type="date"
              label="To"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 130 }}
            />
          </Box>
        </Box>

        {/* --------- CHART CONTAINER --------- */}
        <Box sx={{ flex: 1, width: "100%", height: "100%", position: "relative", mt: 1 }}>
          <ReactECharts
            option={option}
            style={{ height: "100%", width: "100%" }}
            notMerge={true}
            lazyUpdate={true}
            showLoading={loading}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default GraphTemplateSeverityTrend;