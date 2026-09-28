

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent } from '../../../../components/ui/card';
import { Progress } from '../../../../components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../../components/ui/collapsible';
import { Network, Zap, Shield, Activity, Users, BarChart3, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchSectorSummary, type MergedSectorSummary } from '../../services/sectorSummaryApi';

interface SectorSummaryDashboardProps {
  sectorName: string;
}

// Pie chart colors
const TECH_COLORS: Record<string, string> = {
  CIENA: 'hsl(217, 91%, 60%)',
  NOKIA: 'hsl(187, 78%, 42%)',
};
const TYPE_COLORS: Record<string, string> = {
  NLD: 'hsl(160, 84%, 39%)',
  METRO: 'hsl(262, 83%, 58%)',
  OTHER: 'hsl(220, 9%, 46%)',
};
const DOMAIN_COLORS: Record<string, string> = {
  IP: 'hsl(217, 91%, 60%)',
  OPTICAL: 'hsl(24, 95%, 53%)',
};
const UTIL_COLORS = {
  HIGH: 'hsl(0, 84%, 60%)',
  MEDIUM: 'hsl(45, 93%, 47%)',
  LOW: 'hsl(142, 76%, 36%)',
};

const renderLabel = ({ name, value, percent }: any) =>
  `${name} ${value} (${(percent * 100).toFixed(0)}%)`;

export function SectorSummaryDashboard({ sectorName }: SectorSummaryDashboardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const { data: stats, isLoading, isError } = useQuery<MergedSectorSummary>({
    queryKey: ['sectorSummary', sectorName],
    queryFn: () => fetchSectorSummary(sectorName),
    enabled: !!sectorName,
    staleTime: 5 * 60 * 1000,
  });

  // Derived pie data
  const techPie = stats ? Object.entries(stats.techCounts).map(([name, value]) => ({ name, value })) : [];
  const typePie = stats ? Object.entries(stats.typeCounts).map(([name, value]) => ({ name, value })) : [];
  const domainPie = stats ? Object.entries(stats.domainCounts).map(([name, value]) => ({ name, value })) : [];
  const utilPie = stats ? [
    { name: 'HIGH', value: stats.utilizationType === 'HIGH' ? 1 : 0 },
  ].filter(d => d.value > 0) : [];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex-shrink-0 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-muted/10 overflow-hidden">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-primary/20 hover:bg-primary/15 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm text-foreground">📍 {sectorName}</span>
              {stats && (
                <>
                  <Badge variant="outline" className="text-xs">Pairs: {stats.pairs}</Badge>
                  <Badge variant="secondary" className="text-xs">Channels: {stats.channels}</Badge>
                  <Badge variant="secondary" className="text-xs">Circuits: {stats.circuits}</Badge>
                  <Badge variant="secondary" className="text-xs">Customers: {stats.customers}</Badge>
                </>
              )}
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            {stats && (
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-bold text-foreground">{(stats.capacityUsed / 1000).toFixed(1)} / {(stats.capacityTotal / 1000).toFixed(1)} TB</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Path:</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">⚡ Working {stats.working}</Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">🛡️ Protected {stats.protected}</Badge>
                </div>
              </div>
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading sector data...</span>
            </div>
          )}

          {isError && (
            <div className="text-sm text-destructive text-center py-6">Failed to load sector data</div>
          )}

          {stats && (
            <div className="grid grid-cols-12 gap-3 p-3">
              {/* Row 1: Stat Cards */}
              <StatCard icon={<Network className="h-4 w-4" />} label="Distinct Channels" value={stats.channels} className="col-span-2" />
              <StatCard icon={<Activity className="h-4 w-4" />} label="Avg Utilization" className="col-span-2">
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-lg font-bold ${stats.avgUtilization >= 80 ? 'text-destructive' : stats.avgUtilization >= 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {stats.avgUtilization}%
                  </span>
                  <Progress value={stats.avgUtilization} className="flex-1 h-2" />
                </div>
              </StatCard>
              <StatCard icon={<Zap className="h-4 w-4" />} label="Used / Total (TB)" className="col-span-2">
                <span className="text-lg font-bold text-foreground mt-1">
                  {(stats.capacityUsed / 1000).toFixed(1)} / {(stats.capacityTotal / 1000).toFixed(1)}
                </span>
              </StatCard>
              {/* Technology tags */}
              <div className="col-span-3 flex flex-col gap-1.5 justify-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Technology</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(stats.techCounts).map(([t, c]) => (
                    <span key={t} className={`px-2 py-1 rounded-md font-semibold text-xs ${t === 'NOKIA' ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30' : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'}`}>
                      {t}: {c}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Type</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(stats.typeCounts).map(([t, c]) => (
                    <Badge key={t} variant={t === 'NLD' ? 'default' : 'secondary'} className="text-xs px-2 py-0.5">
                      {t}: {c}
                    </Badge>
                  ))}
                </div>
              </div>
              {/* Domain tags */}
              <div className="col-span-3 flex flex-col gap-1.5 justify-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Domain</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(stats.domainCounts).map(([d, c]) => (
                    <span key={d} className={`px-2 py-1 rounded-md font-semibold text-xs ${d === 'IP' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' : 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30'}`}>
                      {d}: {c}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Path</span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs px-2 py-0.5">⚡ Working: {stats.working}</Badge>
                  <Badge variant="outline" className="text-xs px-2 py-0.5">🛡️ Protected: {stats.protected}</Badge>
                </div>
              </div>

              {/* Row 2: Pie Charts + Customers */}
              <MiniPieChart title="Technology" data={techPie} colors={TECH_COLORS} className="col-span-2" />
              <MiniPieChart title="Type (NLD/METRO)" data={typePie} colors={TYPE_COLORS} className="col-span-2" />
              <MiniPieChart title="Domain (IP/OPTICAL)" data={domainPie} colors={DOMAIN_COLORS} className="col-span-2" />
              
              {/* Utilization Breakdown - matches map panel */}
              <Card className="col-span-2 shadow-sm border-border/50">
                <div className="px-3 py-1.5 border-b border-border/50">
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Utilization</span>
                </div>
                <CardContent className="p-3">
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-1.5 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-[10px] text-destructive font-semibold">🔴 High</p>
                      <p className="text-sm font-bold text-destructive">{stats.utilHigh}</p>
                    </div>
                    <div className="p-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-semibold">🟡 Medium</p>
                      <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{stats.utilMed}</p>
                    </div>
                    <div className="p-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">🟢 Low</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">{stats.utilLow}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Customers – name badges only */}
              <Card className="col-span-4 shadow-sm border-border/50">
                <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">Customers</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">{stats.customerNames.length}</Badge>
                </div>
                <div className="p-3 max-h-[180px] overflow-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {stats.customerNames.map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs px-2 py-1">
                        {c}
                      </Badge>
                    ))}
                    {stats.customerNames.length === 0 && (
                      <span className="text-xs text-muted-foreground">No customer data</span>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================
// Sub-components
// ============================================

function StatCard({ icon, label, value, children, className = '' }: {
  icon: React.ReactNode;
  label: string;
  value?: number | string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`shadow-sm border-border/50 ${className}`}>
      <CardContent className="p-3 flex flex-col">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
        </div>
        {value !== undefined && (
          <span className="text-xl font-bold text-foreground mt-1">{value}</span>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

function MiniPieChart({ title, data, colors, className = '' }: {
  title: string;
  data: { name: string; value: number }[];
  colors: Record<string, string>;
  className?: string;
}) {
  if (data.length === 0) return null;

  const defaultColors = ['hsl(217, 91%, 60%)', 'hsl(24, 95%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)'];

  return (
    <Card className={`shadow-sm border-border/50 ${className}`}>
      <div className="px-3 py-1.5 border-b border-border/50">
        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{title}</span>
      </div>
      <CardContent className="p-1">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={50}
              innerRadius={20}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
              fontSize={9}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={colors[entry.name] || defaultColors[i % defaultColors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
              formatter={(value: number, name: string) => [`${value}`, name]}
            />
            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
