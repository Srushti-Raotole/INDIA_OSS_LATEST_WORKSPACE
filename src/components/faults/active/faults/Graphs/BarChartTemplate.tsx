import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, Typography, Box, useMediaQuery, useTheme } from '@mui/material';

interface BarChartProps {
  title?: string;
  isSidebarOpen?: boolean;
  data: (string | number)[][];
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#d32f2f',
  Major: '#f57c00',
  Minor: '#fbc02d',
  MinorWarn: '#fbc02d',
};

const BarChartTemplate: React.FC<BarChartProps> = ({
  title = 'Severity Bar Graph',
  isSidebarOpen,
  data,
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const severities = data?.[0]?.slice(1) as string[] ?? [];

  const option = {
    legend: {
      top: 0,
      left: 'center',
      itemWidth: isXs ? 10 : 12,
      itemHeight: isXs ? 10 : 12,
      textStyle: {
        fontSize: isXs ? 10 : 11,
        fontWeight: 500,
        color: '#64748b',
      },
    },
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' }, 
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
    // Added dataZoom slider configuration window to handle extreme spike distributions cleanly
    dataZoom: [
      {
        type: 'slider',
        show: true,
        height: 14,
        bottom: 5,
        start: 0,
        end: 100, // Provides full layout visualization on mount, zoomable via layout handles
        handleSize: '100%',
        handleStyle: {
          color: '#cbd5e1',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
        },
        textStyle: { color: 'transparent' }, // Keeps text metrics compact
        borderColor: 'transparent',
        fillerColor: 'rgba(15, 118, 110, 0.08)',
        moveHandleStyle: { color: '#e2e8f0' }
      }
    ],
    grid: {
      left: isXs ? 45 : 55, 
      right: 15,
      top: 35,
      bottom: isXs ? 55 : 60, // Expanded slightly to provide padding parameters for the zoom viewport
    },
    dataset: { source: data },
    xAxis: {
      type: 'category',
      nameLocation: 'middle',
      axisLine: {
        lineStyle: { color: '#cbd5e1' }
      },
      axisLabel: {
        fontSize: isXs ? 9 : 11,
        fontWeight: 500,
        color: '#64748b'
      },
    },
    yAxis: {
      type: 'value',
      nameLocation: 'middle',
      nameRotate: 90,
      nameGap: isXs ? 35 : 40, 
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { 
        fontSize: isXs ? 10 : 11, 
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
    series: severities.map((sev) => ({
      type: 'bar',
      barWidth: isXs ? '40%' : '25%',
      itemStyle: { 
        color: SEVERITY_COLORS[sev] || '#fbc02d',
        borderRadius: [4, 4, 0, 0]
      },
    })),
  };

  return (
    <Card 
      sx={{
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        borderRadius: 3,
        height: '100%',
        width: '100%',
        border: '1px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff'
      }}
    >
      <CardContent 
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          p: 2,
          '&:last-child': { pb: 2 },
        }}
      >
        {/* --------- TOP HEADER --------- */}
        <Box 
          sx={{
            mb: 1,
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            pb: 0.75,
            borderBottom: '1px solid #f8fafc'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Dot removed successfully */}
            <Typography
              sx={{ 
                fontWeight: 700, 
                fontSize: '0.75rem', 
                color: '#334155',
                letterSpacing: '0.03em',
                textTransform: 'uppercase'
              }}
            >
              {title}
            </Typography>
          </Box>
        </Box>

        {/* --------- CHART CONTAINER --------- */}
        <Box sx={{ flex: 1, width: '100%', height: '100%', position: 'relative', mt: 1 }}>
          <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
            opts={{ renderer: 'canvas' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default BarChartTemplate;