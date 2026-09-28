import { useState, useEffect, useCallback, useMemo } from "react";
import { logActivity } from "../../../utils/activityLogger";
import {
  Play,
  RefreshCw,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
  Search,
  Info,
  CalendarClock,
  Inbox,
  WifiOff,
  CalendarDays,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { Input } from "../../../components/ui/input";
import { useToast } from "../../../hooks/use-toast";

import {
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableContainer as MuiTableContainer,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  TablePagination,
  Paper,
  Box,
} from "@mui/material";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import axiosClient from "@/api/axiosClient";
import {
  FETCH_DISCOVERY_LOGS,
  RUN_DISCOVERY,
  WRITE_DISCOVERY_LOGS,
  FETCH_DAILY_DISCOVERY_LOGS
} from "@/api/apis";

/* ═══════════════════════════════════════════════
   TIMING RULES
   ═══════════════════════════════════════════════ */
const SCHEDULED_RUN_TIME = "10:00 AM Daily";
const RESTRICTED_WINDOW_LABEL = "9:30 AM – 10:30 AM";
const LOCK_DURATION_MINUTES = 60;
const RESTRICTED_START_HOUR = 9;
const RESTRICTED_START_MIN = 30;
const RESTRICTED_END_HOUR = 10;
const RESTRICTED_END_MIN = 30;

/* ===================== VENDORS ===================== */
const VENDORS = ["MCP", "NFMT", "CONC", "IFNR"] as const;
type Vendor = (typeof VENDORS)[number];

const VENDOR_COLORS: Record<Vendor, string> = {
  MCP: "#3b82f6",
  NFMT: "#6366f1",
  CONC: "#f59e0b",
  IFNR: "#10b981",
};

const getVendorColor = (v: string): string => VENDOR_COLORS[v as Vendor] ?? "#64748b";

const muiDarkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "transparent", paper: "transparent" },
  },
});

/* ===================== UTILS ===================== */
const toISTString = (date: Date) => {
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + offset).toISOString().replace("T", " ").split(".")[0];
};

const formatTime = (val?: string) => {
  if (!val) return "-";
  return new Date(val).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateOnly = (val?: string) => {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const getDuration = (start?: string, end?: string) => {
  if (!start || !end) return "-";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (isNaN(diff) || diff < 0) return "-";
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  return min > 0 ? `${min}m ${sec % 60}s` : `${sec}s`;
};

const getDurationFromSeconds = (sec?: number) => {
  if (sec === undefined || sec === null) return "-";

  if (sec < 60) {
    return `${Number(sec.toFixed(1))}s`;
  }

  const minutes = Math.floor(sec / 60);
  const seconds = (sec % 60).toFixed(1);

  return `${minutes}m ${seconds}s`;
};

const isRestrictedTime = () => {
  const now = new Date();
  const s = new Date();
  s.setHours(RESTRICTED_START_HOUR, RESTRICTED_START_MIN, 0, 0);
  const e = new Date();
  e.setHours(RESTRICTED_END_HOUR, RESTRICTED_END_MIN, 0, 0);
  return now >= s && now <= e;
};

/* ===================== INTERFACES ===================== */
interface LogEntry {
  vendor: string;
  adapter?: string;
  start_time: string;
  end_time: string;
  status: string;
  username?: string;
}

interface DailyLogEntry {
  adapter: string;
  start_time: string;
  end_time: string;
  job_date: string;
  status: string;
  total_time_seconds: number;
  trigger_type: string;
}

interface VendorDetails {
  start?: string;
  end?: string;
  status?: string;
}

const LOG_COLUMNS = [
  { key: "vendor", label: "Vendor", width: 90 },
  { key: "adapter", label: "Adapter", width: 95 },
  { key: "start_time", label: "Start Time", width: 140 },
  { key: "end_time", label: "End Time", width: 140 },
  { key: "duration", label: "Duration", width: 90 },
  { key: "status", label: "Status", width: 100 },
  { key: "username", label: "User", width: 100 },
] as const;

const DAILY_COLUMNS = [
  { key: "adapter", label: "Adapter", width: 100 },
  { key: "job_date", label: "Date", width: 120 },
  { key: "start_time", label: "Start Time", width: 140 },
  { key: "end_time", label: "End Time", width: 140 },
  { key: "duration", label: "Duration", width: 100 },
  { key: "trigger_type", label: "Type", width: 110 },
  { key: "status", label: "Status", width: 100 },
] as const;

/* ===================== COMPONENT ===================== */
const Discovery = () => {
  const { toast } = useToast();

  const [runningVendor, setRunningVendor] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [locks, setLocks] = useState<Record<string, boolean>>({});
  const [detailsMap, setDetailsMap] = useState<Record<string, VendorDetails>>({});
  const [avgTimeMap, setAvgTimeMap] = useState<Record<string, string>>({});
  const [lastDurationMap, setLastDurationMap] = useState<Record<string, number>>({});

  // Manual On-Demand Logs State
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsSearch, setLogsSearch] = useState("");
  const [logsVendorFilter, setLogsVendorFilter] = useState("ALL");
  const [logsPage, setLogsPage] = useState(0);
  const [logsRowsPerPage, setLogsRowsPerPage] = useState(10);

  // Automated Daily Logs State
  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>([]);
  const [dailyLogsLoading, setDailyLogsLoading] = useState(false);
  const [dailyLogsError, setDailyLogsError] = useState<string | null>(null);
  const [dailyLogsOpen, setDailyLogsOpen] = useState(false);
  const [dailySearch, setDailySearch] = useState("");
  const [dailyVendorFilter, setDailyVendorFilter] = useState("ALL");
  const [dailyPage, setDailyPage] = useState(0);
  const [dailyRowsPerPage, setDailyRowsPerPage] = useState(10);

  const [infoOpen, setInfoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  /* --------- Fetch On-Demand Logs --------- */
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(null);
    let data: LogEntry[] = [];

    try {
      const res = await axiosClient.get(FETCH_DISCOVERY_LOGS);
      data = (res.data?.data || res.data || []) as LogEntry[];
      setAllLogs(data);
    } catch (err) {
      setAllLogs([]);
      setLogsError("Unable to fetch discovery logs from server");
    } finally {
      setLogsLoading(false);
    }

    const latest: Record<string, number> = {};
    const lockMap: Record<string, boolean> = {};
    const details: Record<string, VendorDetails> = {};
    const lastDurationMs: Record<string, number> = {};
    const now = Date.now();

    data.forEach((log) => {
      const v = log.vendor?.toUpperCase();
      if (!v) return;
      const start = new Date(log.start_time).getTime();
      if (isNaN(start)) return;

      if (!latest[v] || start > latest[v]) {
        latest[v] = start;
        details[v] = { start: log.start_time, end: log.end_time, status: log.status };

        if (log.end_time) {
          const dur = new Date(log.end_time).getTime() - start;
          if (!isNaN(dur) && dur > 0) lastDurationMs[v] = dur;
        }
      }
    });

    Object.keys(latest).forEach((v) => {
      if ((now - latest[v]) / (1000 * 60) < LOCK_DURATION_MINUTES) lockMap[v] = true;
    });

    const avgTime: Record<string, string> = {};
    Object.entries(lastDurationMs).forEach(([v, ms]) => {
      const sec = Math.floor(ms / 1000);
      const min = Math.floor(sec / 60);
      avgTime[v] = min > 0 ? `${min}m ${sec % 60}s` : `${sec}s`;
    });

    setLocks(lockMap);
    setDetailsMap(details);
    setAvgTimeMap(avgTime);
    setLastDurationMap(lastDurationMs);
  }, []);

  /* --------- Fetch Daily Logs --------- */
  const fetchDailyLogs = useCallback(async () => {
    setDailyLogsLoading(true);
    setDailyLogsError(null);
    try {
      const res = await axiosClient.get(FETCH_DAILY_DISCOVERY_LOGS);
      const data = (res.data?.data || res.data || []) as DailyLogEntry[];
      setDailyLogs(data);
    } catch (err) {
      setDailyLogs([]);
      setDailyLogsError("Unable to fetch daily discovery logs from server");
    } finally {
      setDailyLogsLoading(false);
    }
  }, []);

  /* --------- Run Discovery --------- */
  const runInventory = async (vendor: string) => {
    if (locks[vendor]) {
      toast({
        title: "Vendor Locked",
        description: `${vendor} was run less than ${LOCK_DURATION_MINUTES} minutes ago. Please wait.`,
        variant: "destructive",
      });
      return;
    }

    setRunningVendor(vendor);
    const startDate = new Date();

    setProgressMap((prev) => ({ ...prev, [vendor]: 0 }));

    // Older infinite asymptotic movement progression logic
    const interval = setInterval(() => {
      setProgressMap((prev) => {
        const current = prev[vendor] || 0;
        const next = current + (99 - current) * 0.015;
        return { ...prev, [vendor]: next };
      });
    }, 500);

    try {
      await axiosClient.get(RUN_DISCOVERY, {
        params: { adapter: vendor },
        timeout: 0
      });

      clearInterval(interval);
      setProgressMap((prev) => ({ ...prev, [vendor]: 100 }));

      const endDate = new Date();
      await axiosClient.post(WRITE_DISCOVERY_LOGS, null, {
        params: {
          vendor,
          adapter: vendor,
          startTime: toISTString(startDate),
          endTime: toISTString(endDate),
          status: "SUCCESS",
          username: "admin",
        },
      });

      toast({ title: "Discovery Complete", description: `Inventory triggered successfully for ${vendor}` });
      fetchLogs();
    } catch {
      clearInterval(interval);
      setProgressMap((prev) => ({ ...prev, [vendor]: 100 }));

      const endDate = new Date();
      try {
        await axiosClient.post(WRITE_DISCOVERY_LOGS, null, {
          params: {
            vendor,
            adapter: vendor,
            startTime: toISTString(startDate),
            endTime: toISTString(endDate),
            status: "FAILED",
            username: "admin",
          },
        });
      } catch { }

      toast({ title: "Discovery Failed", description: `Inventory failed for ${vendor}`, variant: "destructive" });
      fetchLogs();
    }

    setTimeout(() => {
      setRunningVendor(null);
      setProgressMap((prev) => ({ ...prev, [vendor]: 0 }));
    }, 1500);
  };

  useEffect(() => {
    logActivity({ activity: "Inventory Discovery page opened", actionName: "DISCOVERY_PAGE", module: "ADMIN" });
  }, []);

  useEffect(() => {
    fetchLogs();
    const i = setInterval(fetchLogs, 60000);
    return () => clearInterval(i);
  }, [fetchLogs]);

  const restricted = isRestrictedTime();

  /* --------- Filter Memoizations --------- */
  const filteredLogs = useMemo(() => {
    return allLogs
      .filter((l) => {
        if (logsVendorFilter !== "ALL" && l.vendor?.toUpperCase() !== logsVendorFilter) return false;
        if (!logsSearch) return true;
        const q = logsSearch.toLowerCase();
        return (
          l.vendor?.toLowerCase().includes(q) ||
          l.status?.toLowerCase().includes(q) ||
          l.username?.toLowerCase().includes(q)
        );
      })
      .slice()
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .map((l, i) => ({ ...l, id: i }));
  }, [allLogs, logsSearch, logsVendorFilter]);

  const filteredDailyLogs = useMemo(() => {
    return dailyLogs
      .filter((l) => {
        if (dailyVendorFilter !== "ALL" && l.adapter?.toUpperCase() !== dailyVendorFilter) return false;
        if (!dailySearch) return true;
        const q = dailySearch.toLowerCase();
        return (
          l.adapter?.toLowerCase().includes(q) ||
          l.status?.toLowerCase().includes(q) ||
          l.trigger_type?.toLowerCase().includes(q)
        );
      })
      .slice()
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .map((l, i) => ({ ...l, id: i }));
  }, [dailyLogs, dailySearch, dailyVendorFilter]);

  const StatusBadge = ({ vendor }: { vendor: string }) => {
    if (restricted)
      return (
        <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/5 px-2 py-0.5 text-[0.68rem] font-bold">
          <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />RESTRICTED
        </Badge>
      );
    if (locks[vendor])
      return (
        <Badge variant="outline" className="border-rose-500/40 text-rose-500 bg-rose-50/5 px-2 py-0.5 text-[0.68rem] font-bold">
          <Lock className="h-3 w-3 mr-1 shrink-0" />LOCKED ({LOCK_DURATION_MINUTES}m)
        </Badge>
      );
    return (
      <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-50/5 px-2 py-0.5 text-[0.68rem] font-bold">
        <CheckCircle className="h-3 w-3 mr-1 shrink-0" />AVAILABLE
      </Badge>
    );
  };

  return (
    <div className="h-full w-full bg-white p-5 flex flex-col overflow-hidden">
      {/* UNIFIED ONE-LINE SYSTEM TOOLBAR */}
      <div className="flex items-center justify-between border border-slate-100 bg-slate-50/50 p-3 rounded-xl mb-4 gap-4 flex-wrap sm:flex-nowrap">
        <div className="min-w-0">
          <h1 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
            Inventory Discovery
          </h1>
          <p className="text-[0.72rem] text-slate-500 truncate mt-0.5">
            On-demand inventory discovery across all vendors
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setDailyLogsOpen(true); fetchDailyLogs(); }}
            className="h-8 text-xs font-semibold px-3 border-slate-200"
          >
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Daily Status
          </Button>

          {/* <Button variant="outline" size="sm" onClick={() => setLogsOpen(true)} className="h-8 text-xs font-semibold px-3 border-slate-200">
            <FileText className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            View Logs
          </Button> */}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200" onClick={() => setInfoOpen(true)} aria-label="Discovery rules">
                  <Info className="h-3.5 w-3.5 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Discovery rules & timing configs</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" size="sm" onClick={fetchLogs} className="h-8 text-xs font-semibold px-3 border-slate-200">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-slate-500 ${logsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {restricted && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          Discovery manual runs are disabled between {RESTRICTED_WINDOW_LABEL} (Scheduled Run Lock window)
        </div>
      )}

      {/* CORE CONFIG CARD PANEL */}
      <Card className="border border-slate-200/80 shadow-sm rounded-xl overflow-hidden flex-1">
        <CardContent className="p-0 h-full overflow-auto scrollbar-thin">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[120px] text-[0.7rem] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Vendor</TableHead>
                <TableHead className="w-[150px] text-[0.7rem] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Status</TableHead>
                {/*  REMOVED Last Run Timestamp Column Header from Main Panel Table */}
                <TableHead className="text-[0.7rem] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Daily Scheduled</TableHead>
                <TableHead className="text-[0.7rem] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Last Run Duration</TableHead>
                <TableHead className="w-[240px] text-[0.7rem] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Execution Progress</TableHead>
                <TableHead className="w-[90px] text-[0.7rem] font-bold text-slate-600 uppercase tracking-wider py-3 px-4 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {VENDORS.map((vendor) => {
                const progress = progressMap[vendor] || 0;
                const color = getVendorColor(vendor);
                const isRunning = runningVendor === vendor;
                const isLocked = locks[vendor];
                const isDisabled = isRunning || isLocked || restricted;

                return (
                  <TableRow
                    key={vendor}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                    style={{ borderLeft: `4px solid ${color}` }}
                  >
                    <TableCell className="py-3.5 px-4">
                      <span className="font-bold text-xs tracking-wider" style={{ color }}>
                        {vendor}
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5 px-4">
                      <StatusBadge vendor={vendor} />
                    </TableCell>

                    {/*  REMOVED Last Run Timestamp Column Data Cell from Main Panel Table */}

                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[0.72rem] text-slate-600 font-medium">
                        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                        {SCHEDULED_RUN_TIME}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[0.72rem] text-slate-600 font-medium">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {avgTimeMap[vendor] || "-"}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Progress
                          value={progress}
                          className="h-1.5 flex-1 bg-slate-100"
                          style={{ "--progress-color": color } as React.CSSProperties}
                        />
                        {progress > 0 && (
                          <span className="text-[0.68rem] font-bold font-mono w-8 text-right" style={{ color }}>
                            {Math.round(progress)}%
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 px-4 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setConfirmOpen(true);
                        }}
                        className="h-7 w-7 p-0 rounded-full transition-all hover:scale-105"
                        style={{
                          color: isDisabled ? undefined : color,
                          backgroundColor: isDisabled ? undefined : `${color}10`,
                        }}
                      >
                        {isRunning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CONFIRMATION OVERLAY */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold tracking-wide uppercase text-slate-800">
              Confirm On-Demand Inv Discovery Execution
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1.5">
              <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100" style={{ color: getVendorColor(selectedVendor || "") }}>
                {selectedVendor}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)} className="text-xs h-8">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedVendor) runInventory(selectedVendor);
                setConfirmOpen(false);
              }}
              size="sm"
              style={{ backgroundColor: getVendorColor(selectedVendor || "") }}
              className="text-white text-xs h-8 font-semibold shadow-sm"
            >
              <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INFORMATION TIMELINE RULES */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-800">
              <Info className="h-4 w-4 text-blue-500" />
              Discovery Rules & Timings
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              How on-demand inventory discovery works
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 my-2">
            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
              <CalendarClock className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
              <div>
                <div className="text-[0.72rem] font-bold text-slate-700 uppercase tracking-wide">Daily Scheduled Run</div>
                <div className="text-[0.7rem] text-slate-500 mt-0.5">
                  Inventory runs automatically at<span className="font-semibold text-slate-700">{SCHEDULED_RUN_TIME}</span> for every vendor.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/40 p-2.5">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
              <div>
                <div className="text-[0.72rem] font-bold text-slate-700 uppercase tracking-wide">Restricted Window</div>
                <div className="text-[0.7rem] text-slate-500 mt-0.5">
                  On-demand discovery is disabled between <span className="font-semibold text-slate-700">{RESTRICTED_WINDOW_LABEL}</span> to avoid clashing with the scheduled run.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-rose-100 bg-rose-50/40 p-2.5">
              <Lock className="h-4 w-4 mt-0.5 text-rose-500 shrink-0" />
              <div>
                <div className="text-[0.72rem] font-bold text-slate-700 uppercase tracking-wide">{LOCK_DURATION_MINUTES}-Minute Cooldown</div>
                <div className="text-[0.7rem] text-slate-500 mt-0.5">
                  After a vendor is run, it is locked for <span className="font-semibold text-slate-700">{LOCK_DURATION_MINUTES} minutes</span>. The lock is calculated from the last start time recorded in logs.
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setInfoOpen(false)} size="sm" className="h-8 text-xs font-semibold">Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------------
          ON-DEMAND DISCOVERY LOGS DIALOG
      ------------------------------------------------------------------------- */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] flex flex-col overflow-hidden p-0 rounded-xl">
          <div className="px-5 pt-5 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Discovery Logs (On-Demand)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 pt-0.5">
                History of all manual inventory discovery runs
              </DialogDescription>
            </DialogHeader>

            {logsError && (
              <div className="mt-2.5 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-[0.7rem] font-medium text-rose-700">
                <WifiOff className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                {logsError}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search logs..."
                  value={logsSearch}
                  onChange={(e) => {
                    setLogsSearch(e.target.value);
                    setLogsPage(0);
                  }}
                  className="pl-9 h-8 text-xs bg-slate-50 border-slate-200"
                />
              </div>
              <Select
                value={logsVendorFilter}
                onValueChange={(v) => {
                  setLogsVendorFilter(v);
                  setLogsPage(0);
                }}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-50 border-slate-200 font-semibold text-slate-700">
                  <SelectValue placeholder="Filter Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">All Adapters</SelectItem>
                  {VENDORS.map((v) => (
                    <SelectItem key={v} value={v} className="text-xs">
                      <span style={{ color: getVendorColor(v) }} className="font-bold">{v}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchLogs} disabled={logsLoading} className="h-8 border-slate-200 text-xs font-semibold">
                <RefreshCw className={`h-3 w-3 mr-1.5 text-slate-500 ${logsLoading ? "animate-spin" : ""}`} />
                Reload
              </Button>
            </div>
          </div>

          <MuiThemeProvider theme={muiDarkTheme}>
            <Box className="flex flex-col flex-1 min-h-0 px-5 pb-5 overflow-hidden">
              <MuiTableContainer component={Paper} elevation={0} className="flex-1 min-h-0" sx={{ border: "1px solid #e2e8f0", borderRadius: "8px", bgcolor: "transparent", overflow: "auto", scrollbarWidth: "thin" }}>
                <MuiTable stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
                  <MuiTableHead>
                    <MuiTableRow>
                      {LOG_COLUMNS.map((col) => (
                        <MuiTableCell key={col.key} sx={{ width: col.width, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", bgcolor: "#354a6b", color: "#ffffff", py: 1, px: 1.5, borderBottom: "none" }}>
                          {col.label}
                        </MuiTableCell>
                      ))}
                    </MuiTableRow>
                  </MuiTableHead>
                  <MuiTableBody>
                    {logsLoading ? (
                      <MuiTableRow>
                        <MuiTableCell colSpan={LOG_COLUMNS.length} align="center" sx={{ py: 6, borderBottom: "none" }}>
                          <Loader2 className="h-5 w-5 animate-spin inline-block text-slate-400" />
                          <div className="text-[0.7rem] text-slate-500 font-semibold mt-1.5">Scanning log records...</div>
                        </MuiTableCell>
                      </MuiTableRow>
                    ) : filteredLogs.length === 0 ? (
                      <MuiTableRow>
                        <MuiTableCell colSpan={LOG_COLUMNS.length} align="center" sx={{ py: 6, borderBottom: "none" }}>
                          <Inbox className="h-6 w-6 inline-block text-slate-300" />
                          <div className="text-xs font-bold text-slate-600 mt-1.5">
                            {logsError ? "Database Sync Fault" : "No trace records detected"}
                          </div>
                        </MuiTableCell>
                      </MuiTableRow>
                    ) : (
                      filteredLogs
                        .slice(logsPage * logsRowsPerPage, logsPage * logsRowsPerPage + logsRowsPerPage)
                        .map((log) => {
                          const isSuccess = String(log.status).toUpperCase() === "SUCCESS";
                          return (
                            <MuiTableRow key={log.id} sx={{ "& td": { fontSize: "0.72rem", py: 0.8, px: 1.5, borderBottom: "1px solid #f1f5f9", color: "#334155" }, "&:hover": { bgcolor: "#f8fafc" } }}>
                              <MuiTableCell>
                                <span className="font-bold" style={{ color: getVendorColor(log.vendor) }}>{log.vendor}</span>
                              </MuiTableCell>
                              <MuiTableCell>
                                <span className="font-semibold text-slate-600">{log.adapter || log.vendor}</span>
                              </MuiTableCell>
                              <MuiTableCell>{formatTime(log.start_time)}</MuiTableCell>
                              <MuiTableCell>{formatTime(log.end_time)}</MuiTableCell>
                              <MuiTableCell sx={{ fontFamily: "monospace", fontWeight: 500 }}>{getDuration(log.start_time, log.end_time)}</MuiTableCell>
                              <MuiTableCell>
                                <Badge variant="outline" className={isSuccess ? "border-emerald-500/30 text-emerald-600 bg-emerald-50/50 text-[0.65rem] font-bold px-1.5 h-5" : "border-rose-500/30 text-rose-600 bg-rose-50/50 text-[0.65rem] font-bold px-1.5 h-5"}>
                                  {isSuccess ? "Success" : "Failed"}
                                </Badge>
                              </MuiTableCell>
                              <MuiTableCell sx={{ color: "#64748b !important" }}>{log.username || "-"}</MuiTableCell>
                            </MuiTableRow>
                          );
                        })
                    )}
                  </MuiTableBody>
                </MuiTable>
              </MuiTableContainer>

              <TablePagination
                component="div"
                count={filteredLogs.length}
                page={logsPage}
                onPageChange={(_, newPage) => setLogsPage(newPage)}
                rowsPerPage={logsRowsPerPage}
                onRowsPerPageChange={(e) => { setLogsRowsPerPage(parseInt(e.target.value, 10)); setLogsPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{ color: "#475569", borderTop: "1px solid #e2e8f0", "& .MuiToolbar-root": { minHeight: "36px !important", height: "36px" }, "& .MuiTablePagination-selectIcon": { color: "#64748b" }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.68rem", fontWeight: 500 }, "& .MuiInputBase-root": { fontSize: "0.68rem" } }}
              />
            </Box>
          </MuiThemeProvider>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------------
          DAILY STATUS LOGS DIALOG
      ------------------------------------------------------------------------- */}
      <Dialog open={dailyLogsOpen} onOpenChange={setDailyLogsOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] flex flex-col overflow-hidden p-0 rounded-xl">
          <div className="px-5 pt-5 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                Daily Discovery Status
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 pt-0.5">
                Monitoring logs for the automated scheduled daily discovery runs
              </DialogDescription>
            </DialogHeader>

            {dailyLogsError && (
              <div className="mt-2.5 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-[0.7rem] font-medium text-rose-700">
                <WifiOff className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                {dailyLogsError}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search daily logs..."
                  value={dailySearch}
                  onChange={(e) => {
                    setDailySearch(e.target.value);
                    setDailyPage(0);
                  }}
                  className="pl-9 h-8 text-xs bg-slate-50 border-slate-200"
                />
              </div>
              <Select
                value={dailyVendorFilter}
                onValueChange={(v) => {
                  setDailyVendorFilter(v);
                  setDailyPage(0);
                }}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-50 border-slate-200 font-semibold text-slate-700">
                  <SelectValue placeholder="Filter Adapter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">All Adapters</SelectItem>
                  {VENDORS.map((v) => (
                    <SelectItem key={v} value={v} className="text-xs">
                      <span style={{ color: getVendorColor(v) }} className="font-bold">{v}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchDailyLogs} disabled={dailyLogsLoading} className="h-8 border-slate-200 text-xs font-semibold">
                <RefreshCw className={`h-3 w-3 mr-1.5 text-slate-500 ${dailyLogsLoading ? "animate-spin" : ""}`} />
                Reload
              </Button>
            </div>
          </div>

          <MuiThemeProvider theme={muiDarkTheme}>
            <Box className="flex flex-col flex-1 min-h-0 px-5 pb-5 overflow-hidden">
              <MuiTableContainer component={Paper} elevation={0} className="flex-1 min-h-0" sx={{ border: "1px solid #e2e8f0", borderRadius: "8px", bgcolor: "transparent", overflow: "auto", scrollbarWidth: "thin" }}>
                <MuiTable stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
                  <MuiTableHead>
                    <MuiTableRow>
                      {DAILY_COLUMNS.map((col) => (
                        <MuiTableCell key={col.key} sx={{ width: col.width, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", bgcolor: "#354a6b", color: "#ffffff", py: 1, px: 1.5, borderBottom: "none" }}>
                          {col.label}
                        </MuiTableCell>
                      ))}
                    </MuiTableRow>
                  </MuiTableHead>
                  <MuiTableBody>
                    {dailyLogsLoading ? (
                      <MuiTableRow>
                        <MuiTableCell colSpan={DAILY_COLUMNS.length} align="center" sx={{ py: 6, borderBottom: "none" }}>
                          <Loader2 className="h-5 w-5 animate-spin inline-block text-slate-400" />
                          <div className="text-[0.7rem] text-slate-500 font-semibold mt-1.5">Fetching scheduled logs...</div>
                        </MuiTableCell>
                      </MuiTableRow>
                    ) : filteredDailyLogs.length === 0 ? (
                      <MuiTableRow>
                        <MuiTableCell colSpan={DAILY_COLUMNS.length} align="center" sx={{ py: 6, borderBottom: "none" }}>
                          <Inbox className="h-6 w-6 inline-block text-slate-300" />
                          <div className="text-xs font-bold text-slate-600 mt-1.5">
                            {dailyLogsError ? "Database Sync Fault" : "No scheduled records detected"}
                          </div>
                        </MuiTableCell>
                      </MuiTableRow>
                    ) : (
                      filteredDailyLogs
                        .slice(dailyPage * dailyRowsPerPage, dailyPage * dailyRowsPerPage + dailyRowsPerPage)
                        .map((log) => {
                          const isSuccess = String(log.status).toUpperCase() === "SUCCESS";
                          return (
                            <MuiTableRow key={log.id} sx={{ "& td": { fontSize: "0.72rem", py: 0.8, px: 1.5, borderBottom: "1px solid #f1f5f9", color: "#334155" }, "&:hover": { bgcolor: "#f8fafc" } }}>
                              <MuiTableCell>
                                <span className="font-bold" style={{ color: getVendorColor(log.adapter) }}>{log.adapter}</span>
                              </MuiTableCell>
                              <MuiTableCell sx={{ fontWeight: 600 }}>{formatDateOnly(log.job_date)}</MuiTableCell>
                              <MuiTableCell>{formatTime(log.start_time)}</MuiTableCell>
                              <MuiTableCell>{formatTime(log.end_time)}</MuiTableCell>
                              <MuiTableCell sx={{ fontFamily: "monospace", fontWeight: 500 }}>{getDurationFromSeconds(log.total_time_seconds)}</MuiTableCell>
                              <MuiTableCell sx={{ color: "#64748b !important", fontWeight: 600 }}>{log.trigger_type || "SCHEDULED"}</MuiTableCell>
                              <MuiTableCell>
                                <Badge variant="outline" className={isSuccess ? "border-emerald-500/30 text-emerald-600 bg-emerald-50/50 text-[0.65rem] font-bold px-1.5 h-5" : "border-rose-500/30 text-rose-600 bg-rose-50/50 text-[0.65rem] font-bold px-1.5 h-5"}>
                                  {isSuccess ? "Success" : "Failed"}
                                </Badge>
                              </MuiTableCell>
                            </MuiTableRow>
                          );
                        })
                    )}
                  </MuiTableBody>
                </MuiTable>
              </MuiTableContainer>

              <TablePagination
                component="div"
                count={filteredDailyLogs.length}
                page={dailyPage}
                onPageChange={(_, newPage) => setDailyPage(newPage)}
                rowsPerPage={dailyRowsPerPage}
                onRowsPerPageChange={(e) => { setDailyRowsPerPage(parseInt(e.target.value, 10)); setDailyPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{ color: "#475569", borderTop: "1px solid #e2e8f0", "& .MuiToolbar-root": { minHeight: "36px !important", height: "36px" }, "& .MuiTablePagination-selectIcon": { color: "#64748b" }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.68rem", fontWeight: 500 }, "& .MuiInputBase-root": { fontSize: "0.68rem" } }}
              />
            </Box>
          </MuiThemeProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discovery;