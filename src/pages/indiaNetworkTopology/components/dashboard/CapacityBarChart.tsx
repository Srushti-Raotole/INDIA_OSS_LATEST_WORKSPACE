// ============================================
// Capacity Bar Chart Component
// ============================================

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend,
} from 'recharts';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { CityWiseCapacity, DashboardFilterState } from './types';
import { formatCapacityCompact, formatCapacityToTB } from '../../utils/cityAbbreviations';

interface CapacityBarChartProps {
  data: CityWiseCapacity[];
  filters: DashboardFilterState;
}

const CHART_COLORS = {
  created: 'hsl(217, 91%, 60%)',
  used: 'hsl(142, 71%, 45%)',
};

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const fullCity = payload[0]?.payload?.fullCity || label;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
        <p className="font-semibold text-sm mb-2 truncate">{fullCity}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}</span>
            </div>
            <span className="font-medium">{formatCapacityToTB(entry.value)}</span>
          </div>
        ))}
        {payload.length >= 2 && (
          <div className="mt-2 pt-2 border-t border-border text-xs">
            <div className="flex justify-between">
              <span>Utilization:</span>
              <span className="font-medium">{((payload[1].value / payload[0].value) * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}

function ChartContent({ chartData }: { chartData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 20, right: 15, left: 5, bottom: 40 }} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', fontWeight: 600 }} angle={-45} textAnchor="end" height={45} interval={0} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => formatCapacityCompact(val)} width={50} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Created Capacity" fill={CHART_COLORS.created} radius={[3, 3, 0, 0]} name="Created">
          <LabelList dataKey="createdTB" position="top" fontSize={10} fill="hsl(var(--foreground))" fontWeight={700} />
        </Bar>
        <Bar dataKey="Used Capacity" fill={CHART_COLORS.used} radius={[3, 3, 0, 0]} name="Used">
          <LabelList dataKey="usedTB" position="top" fontSize={10} fill="hsl(var(--foreground))" fontWeight={700} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CapacityBarChart({ data, filters }: CapacityBarChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chartData = useMemo(() => {
    let filteredData = [...data];
    if (filters.type !== 'ALL') filteredData = filteredData.filter(row => row.Type === filters.type);
    if (filters.city) filteredData = filteredData.filter(row => row.City === filters.city);
    if (filters.technology !== 'ALL') filteredData = filteredData.filter(row => row['Technology Name'] === filters.technology);

    filteredData.sort((a, b) => b['Sum Of Created Capacity'] - a['Sum Of Created Capacity']);
    return filteredData.slice(0, 10).map(row => ({
      shortName: row['Short Name'] || row.City.substring(0, 4).toUpperCase(),
      fullCity: row.City || 'Unknown',
      'Created Capacity': row['Sum Of Created Capacity'],
      'Used Capacity': row['Sum Of Used Capacity'],
      createdTB: `${(row['Sum Of Created Capacity'] / 1000).toFixed(1)}T`,
      usedTB: `${(row['Sum Of Used Capacity'] / 1000).toFixed(1)}T`,
      utilization: row['AVG Of Utilization Percent'],
    }));
  }, [data, filters]);

  return (
    <>
      <Card className="h-full flex flex-col border-border/60 shadow-sm">
        <CardHeader className="py-2 px-3 flex-shrink-0 flex flex-row items-center justify-between border-b border-border/30">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xs font-semibold text-foreground">CAPACITY BY CITY (TOP 10)</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.created }} /><span className="text-[10px] text-muted-foreground font-medium">Created</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.used }} /><span className="text-[10px] text-muted-foreground font-medium">Used</span></div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted/50" onClick={() => setIsFullscreen(true)}><Maximize2 className="h-3.5 w-3.5" /></Button>
        </CardHeader>
        <CardContent className="p-1 flex-1 overflow-hidden min-h-0">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data matching filters</div>
          ) : (<ChartContent chartData={chartData} />)}
        </CardContent>
      </Card>
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-foreground">CAPACITY BY CITY (TOP 10)</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}><Minimize2 className="h-4 w-4" /></Button>
          </DialogHeader>
          <div className="h-[400px]"><ChartContent chartData={chartData} /></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
