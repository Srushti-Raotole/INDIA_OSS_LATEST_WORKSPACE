// ============================================
// Top Customers Bar Chart Component
// ============================================

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell,
} from 'recharts';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { TopCustomerData, DashboardFilterState, TECHNOLOGY_COLORS } from './types';

interface TopCustomersBarChartProps {
  data?: TopCustomerData[];
  filters: DashboardFilterState;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const tech = payload[0]?.payload?.technology;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[150px]">
        <p className="font-semibold text-sm mb-1">{label}</p>
        <div className="flex justify-between items-center gap-4 text-xs">
          <span>Total Circuits:</span>
          <span className="font-medium">{payload[0].value}</span>
        </div>
        <div className="flex justify-between items-center gap-4 text-xs mt-1">
          <span>Technology:</span>
          <span className="font-medium">{tech}</span>
        </div>
      </div>
    );
  }
  return null;
}

function renderBarLabel(props: any) {
  const { x, y, width, height, value } = props;
  const isSmallBar = width < 30;
  return (
    <text x={isSmallBar ? x + width + 5 : x + width - 8} y={y + height / 2}
      fill={isSmallBar ? 'hsl(var(--foreground))' : 'white'}
      textAnchor={isSmallBar ? 'start' : 'end'} dominantBaseline="middle" fontSize={12} fontWeight={700}>{value}</text>
  );
}

function ChartContent({ data }: { data: any[] }) {
  return (
    <div className="h-full w-full min-w-0 min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 45, left: 5, bottom: 5 }} layout="vertical" barCategoryGap="15%">
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={true} vertical={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 600 }} width={90} interval={0} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Circuits">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={TECHNOLOGY_COLORS[entry.technology] || 'hsl(142, 71%, 45%)'} />
            ))}
            <LabelList dataKey="count" content={renderBarLabel} position="right"/>
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopCustomersBarChart({ data = [], filters }: TopCustomersBarChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chartData = useMemo(() => {
    let filtered = data;
    if (filters.technology !== 'ALL') {
      filtered = filtered.filter(d => d.Technology === filters.technology);
    }
    const sorted = [...filtered].sort((a, b) => b['Total Count'] - a['Total Count']).slice(0, 10);
    return sorted.map(d => ({
      name: d['Customer Name'],
      count: d['Total Count'],
      technology: d.Technology,
    }));
  }, [data, filters.technology]);

  return (
    <>
      <Card className="h-full min-w-0 flex flex-col border-border/60 shadow-sm">
        <CardHeader className="py-2 px-3 flex-shrink-0 flex flex-row items-center justify-between border-b border-border/30">
          <div className="flex items-center gap-3 min-w-0">
            <CardTitle className="text-xs font-semibold text-foreground">TOP 10 CUSTOMERS</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: TECHNOLOGY_COLORS.CIENA }} /><span className="text-[10px] text-muted-foreground font-medium">CIENA</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: TECHNOLOGY_COLORS.NOKIA }} /><span className="text-[10px] text-muted-foreground font-medium">NOKIA</span></div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-muted/50" onClick={() => setIsFullscreen(true)}><Maximize2 className="h-3 w-3" /></Button>
        </CardHeader>
        <CardContent className="p-1 flex-1 min-h-[180px] min-w-0">
          <ChartContent data={chartData} />
        </CardContent>
      </Card>
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-foreground">TOP 10 CUSTOMERS</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}><Minimize2 className="h-4 w-4" /></Button>
          </DialogHeader>
          <div className="h-[500px]"><ChartContent data={chartData} /></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
