

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { TypeWiseCapacity, DashboardFilterState } from './types';

interface CustomerPieChartProps {
  data: TypeWiseCapacity[];
  filters: DashboardFilterState;
}

const CHART_COLORS: Record<string, string> = {
  NLD: 'hsl(217, 91%, 60%)',
  METRO: 'hsl(270, 70%, 60%)',
  OTHER: 'hsl(220, 9%, 46%)',
};

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
        <p className="font-semibold text-sm mb-2">{data.name}</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span>Channel:</span><span className="font-medium">{data.value}</span></div>
          <div className="flex justify-between"><span>Percentage:</span><span className="font-medium">{data.percent.toFixed(1)}%</span></div>
        </div>
      </div>
    );
  }
  return null;
}

function renderOutsideLabel({ cx, cy, midAngle, outerRadius, name, value, percent }: any) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 22;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={13} fontWeight={700}>
      {name} {value} ({(percent * 100).toFixed(0)}%)
    </text>
  );
}

function ChartContent({ chartData, isCompact = false }: { chartData: any[]; isCompact?: boolean }) {
  const outerRadius = isCompact ? '55%' : '65%';
  const innerRadius = isCompact ? '20%' : '30%';
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={3} dataKey="value"
          label={renderOutsideLabel} labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}>
          {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="none" />))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CustomerPieChart({ data, filters }: CustomerPieChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chartData = useMemo(() => {
    let filtered = data;
    if (filters.technology !== 'ALL') filtered = filtered.filter(d => d.Technology === filters.technology);

    const map = new Map<string, number>();
    filtered.forEach(row => {
      map.set(row.type, (map.get(row.type) || 0) + row['Sum Of Customer Name']);
    });

    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries()).map(([type, value]) => ({
      name: type,
      value,
      percent: total > 0 ? (value / total) * 100 : 0,
      color: CHART_COLORS[type] || 'hsl(var(--muted))',
    }));
  }, [data, filters.technology]);

  const totalCustomers = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <>
      <Card className="h-full flex flex-col border-border/60 shadow-sm">
        <CardHeader className="py-2 px-3 flex-shrink-0 flex flex-row items-center justify-between border-b border-border/30">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs font-semibold leading-tight text-foreground">Channel</CardTitle>
            <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded font-medium">{totalCustomers}</span>
            <div className="flex items-center gap-2">
              {chartData.map(d => (
                <div key={d.name} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-muted-foreground font-medium">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-muted/50" onClick={() => setIsFullscreen(true)}><Maximize2 className="h-3 w-3" /></Button>
        </CardHeader>
        <CardContent className="p-1 flex-1 min-h-0"><ChartContent chartData={chartData} isCompact /></CardContent>
      </Card>
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-foreground">Channel</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}><Minimize2 className="h-4 w-4" /></Button>
          </DialogHeader>
          <div className="h-[300px]"><ChartContent chartData={chartData} /></div>
          <div className="text-center text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{totalCustomers}</span> channels</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
