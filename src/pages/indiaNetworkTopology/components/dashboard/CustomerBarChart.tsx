


import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { ScrollArea, ScrollBar } from '../../../../components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { CityWiseCapacity, DashboardFilterState } from './types';
import { getAbbreviatedCityPair } from '../../utils/cityAbbreviations';

interface CustomerBarChartProps {
  /** City-wise capacity data */
  data: CityWiseCapacity[];
  /** Current filter state */
  filters: DashboardFilterState;
}

// Chart color
const BAR_COLOR = 'hsl(142, 71%, 45%)';

/**
 * Custom tooltip content
 */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const fullCity = payload[0]?.payload?.fullCity || label;
    const type = payload[0]?.payload?.type;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
        <p className="font-semibold text-sm mb-1 truncate">{fullCity}</p>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            type === 'NLD' 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
          }`}>
            {type}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span>Customers:</span>
          <span className="font-medium">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Chart content (reused in fullscreen)
 */
function ChartContent({ chartData, height }: { chartData: any[]; height: number }) {
  const chartWidth = Math.max(400, chartData.length * 50);
  
  return (
    <ScrollArea className="h-full w-full">
      <div style={{ width: chartWidth, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 50 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="city" 
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="Customer Count" 
              fill={BAR_COLOR}
              radius={[4, 4, 0, 0]}
              name="Customers"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

/**
 * Customer Bar Chart
 * Shows top 10 cities by customer count with abbreviated names
 * 
 * POSITION: Bottom-right of dashboard
 */
export function CustomerBarChart({ data, filters }: CustomerBarChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Filter and transform data for chart
  const chartData = useMemo(() => {
    let filteredData = [...data];
    
    // Filter by type
    if (filters.type !== 'ALL') {
      filteredData = filteredData.filter(row => row.Type === filters.type);
    }
    
    // Filter by city
    if (filters.city) {
      filteredData = filteredData.filter(row => row.City === filters.city);
    }
    
    // Sort by customer count descending and take top 10
    filteredData.sort((a, b) => b['Sum Of Customer Name'] - a['Sum Of Customer Name']);
    
    // Transform for chart with abbreviated city names
    return filteredData.slice(0, 10).map(row => ({
      city: getAbbreviatedCityPair(row.City),
      fullCity: row.City || 'Unknown',
      type: row.Type,
      'Customer Count': row['Sum Of Customer Name'],
    }));
  }, [data, filters]);

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="py-2 px-3 flex-shrink-0 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xs font-semibold">CUSTOMERS BY CITY (TOP 10)</CardTitle>
            {/* Legend inline */}
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: BAR_COLOR }} />
              <span className="text-[10px] text-muted-foreground">Count</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-2 flex-1 overflow-hidden min-h-0">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No data matching filters
            </div>
          ) : (
            <ChartContent chartData={chartData} height={180} />
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-4">
              CUSTOMERS BY CITY (TOP 10)
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: BAR_COLOR }} />
                <span className="text-sm text-muted-foreground">Count</span>
              </div>
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsFullscreen(false)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="h-[400px]">
            <ChartContent chartData={chartData} height={400} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
