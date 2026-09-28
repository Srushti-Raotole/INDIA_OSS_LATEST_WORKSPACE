import { useState, useEffect, useCallback } from "react";
import { logActivity } from "../../../utils/activityLogger";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { toast } from "sonner";
import {
  History,
  AlertTriangle,
  ArrowRightLeft,
  Info,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy, 
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { cn } from "../../../lib/utils";
import {
  ACTIVE_SERVER_INFO,
  ACTIVE_SERVER_LOGS,
  ACTIVE_SERVER_SWITCH,
  ACTIVE_SERVER_SWITCH_LOGS,
  ACTIVE_SERVER_SWITCH_LAST_SWITCH,
} from "../../../api/apis";

/* ================= TYPES ================= */
interface AuditEntry {
  time: string;
  from: "PRIMARY" | "SECONDARY";
  to: "PRIMARY" | "SECONDARY";
  user: string;
}

interface ServerRow {
  adapter: string;
  primaryServer: string;
  secondaryServer: string;
  active: "PRIMARY" | "SECONDARY";
  lastSwitched?: string;
  audit: AuditEntry[];
}

/* ================= DEFAULTS ================= */
const DEFAULT_ROWS: ServerRow[] = [
  { adapter: "MCP", primaryServer: "Loading...", secondaryServer: "Loading...", active: "PRIMARY", audit: [] },
  { adapter: "NFMT", primaryServer: "Loading...", secondaryServer: "Loading...", active: "PRIMARY", audit: [] },
  { adapter: "EPNM", primaryServer: "Loading...", secondaryServer: "Loading...", active: "PRIMARY", audit: [] },
  { adapter: "CONC", primaryServer: "Loading...", secondaryServer: "Loading...", active: "PRIMARY", audit: [] },
  { adapter: "ADVA", primaryServer: "Loading...", secondaryServer: "Loading...", active: "PRIMARY", audit: [] },
  { adapter: "IFNR", primaryServer: "Loading...", secondaryServer: "Loading...", active: "PRIMARY", audit: [] },
];

const DISABLED_ADAPTERS = ["ADVA", "IFNR"];

const ADAPTER_COLORS: Record<string, string> = {
  MCP: "bg-teal-600 hover:bg-teal-600",
  NFMT: "bg-indigo-500 hover:bg-indigo-500",
  EPNM: "bg-green-600 hover:bg-green-600",
  CONC: "bg-orange-500 hover:bg-orange-500",
  ADVA: "bg-purple-600 hover:bg-purple-600",
  IFNR: "bg-blue-700 hover:bg-blue-700",
};

/* ================= COMPONENT ================= */
export default function ActiveServer() {
  const [rows, setRows] = useState<ServerRow[]>(DEFAULT_ROWS);
  const [loadingAll, setLoadingAll] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRow, setPendingRow] = useState<ServerRow | null>(null);
  const [switching, setSwitching] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRow, setHistoryRow] = useState<ServerRow | null>(null);
  const [historyData, setHistoryData] = useState<AuditEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const getUsername = () => {
    try {
      // Security Issue Fix - Read token from sessionStorage instead of localStorage.
      const token = sessionStorage.getItem("LS_AUTH_TOKEN");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.sub) return payload.sub;
      }
      const user = sessionStorage.getItem("LS_AUTH_USER");
      if (user) {
        const parsed = JSON.parse(user);
        return parsed?.username ?? parsed?.userName ?? "User";
      }
    } catch { /* ignore */ }
    return "User";
  };

  /* ================= LOAD SERVERS ================= */
  const loadServers = useCallback(async () => {
    setLoadingAll(true);
    await Promise.all(
      DEFAULT_ROWS.map(async (row) => {
        try {
          const res = await axiosClient.get(`${ACTIVE_SERVER_INFO}?adapter=${row.adapter}`);
          const data = res.data;

          let primary = "—";
          let secondary = "—";
          let active: "PRIMARY" | "SECONDARY" = "PRIMARY";

          data.forEach((item: any) => {
            if (item.SERVER === "PRIMARY") {
              primary = item.IP;
              if (item.Flag === "ACTIVE") active = "PRIMARY";
            }
            if (item.SERVER === "SECONDARY") {
              secondary = item.IP;
              if (item.Flag === "ACTIVE") active = "SECONDARY";
            }
          });

          setRows((prev) =>
            prev.map((r) =>
              r.adapter === row.adapter
                ? { ...r, primaryServer: primary, secondaryServer: secondary, active }
                : r
            )
          );

          const timeRes = await axiosClient.get(
            `${ACTIVE_SERVER_SWITCH_LAST_SWITCH}?adapter=${row.adapter}`
          );
          setRows((prev) =>
            prev.map((r) =>
              r.adapter === row.adapter ? { ...r, lastSwitched: timeRes.data || "—" } : r
            )
          );
        } catch {
          setRows((prev) =>
            prev.map((r) =>
              r.adapter === row.adapter
                ? { ...r, primaryServer: "Data not found", secondaryServer: "Data not found", lastSwitched: "—" }
                : r
            )
          );
        }
      })
    );
    setLoadingAll(false);
  }, []);

  useEffect(() => {
    logActivity({ activity: "Active Server Switch page opened", actionName: "ACTIVE_SERVER_PAGE", module: "ADMIN" });
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  /* ================= SWITCH ================= */
  const handleToggleRequest = useCallback((row: ServerRow) => {
    setPendingRow(row);
    setConfirmOpen(true);
  }, []);

  const handleConfirmSwitch = async () => {
    if (!pendingRow) return;
    setSwitching(true);

    const targetIp =
      pendingRow.active === "PRIMARY" ? pendingRow.secondaryServer : pendingRow.primaryServer;
    const from = pendingRow.active;
    const to = pendingRow.active === "PRIMARY" ? "SECONDARY" : "PRIMARY";
    const username = getUsername();

    try {
      const res = await axiosClient.post(
        `${ACTIVE_SERVER_SWITCH}?adapter=${pendingRow.adapter}&ip=${targetIp}`
      );

      if (res.data === "SUCCESS") {
        toast.success(`${pendingRow.adapter} switched successfully`);

        await axiosClient.post(
          `${ACTIVE_SERVER_SWITCH_LOGS}?adapter=${pendingRow.adapter}&serverFrom=${from}&serverTo=${to}&userName=${username}`
        );

        const timeRes = await axiosClient.get(
          `${ACTIVE_SERVER_SWITCH_LAST_SWITCH}?adapter=${pendingRow.adapter}`
        );

        setRows((prev) =>
          prev.map((r) =>
            r.adapter === pendingRow.adapter
              ? { ...r, active: to as "PRIMARY" | "SECONDARY", lastSwitched: timeRes.data || "—" }
              : r
          )
        );
      } else {
        toast.error(res.data);
      }
    } catch {
      toast.error("Switch request failed");
    }

    setSwitching(false);
    setConfirmOpen(false);
    setPendingRow(null);
  };

  /* ================= HISTORY ================= */
  const openHistory = async (row: ServerRow) => {
    setHistoryLoading(true);
    setHistoryRow(row);
    setHistoryOpen(true);

    try {
      const res = await axiosClient.get(`${ACTIVE_SERVER_LOGS}?adapter=${row.adapter}`);
      const mapped = res.data.map((item: any) => ({
        from: item.from ?? item.serverFrom,
        to: item.to ?? item.serverTo,
        time: item.time ?? item.switchTime,
        user: item.user ?? item.userName,
      }));
      setHistoryData(mapped);
    } catch {
      toast.error("Failed to load history");
      setHistoryData([]);
    }
    setHistoryLoading(false);
  };

  /* ================= COPY TO CLIPBOARD ================= */
  /* ================= COPY TO CLIPBOARD AS HTML TABLE ================= */
  const handleCopyTable = async () => {
    const headers = ["Adapter", "Primary Server", "Secondary Server", "Active Status", "Last Switched"];

    // 1. Create Plain Text (TSV) for Excel or Notepad
    const tsvHeader = headers.join("\t");
    const tsvBody = rows.map(row =>
      [row.adapter, row.primaryServer, row.secondaryServer, row.active, row.lastSwitched || "—"].join("\t")
    ).join("\n");
    const tsvData = `${tsvHeader}\n${tsvBody}`;

    // 2. Create Rich HTML Table for Word, Outlook, Emails, Confluence
    const htmlHeader = `<tr>${headers.map(h =>
      `<th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f8fafc; text-align: left; color: #334155; font-size: 14px;">${h}</th>`
    ).join("")}</tr>`;

    const htmlBody = rows.map(row => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; color: #475569;"><strong>${row.adapter}</strong></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; color: #475569;">${row.primaryServer}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; color: #475569;">${row.secondaryServer}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; color: ${row.active === 'PRIMARY' ? '#16a34a' : '#ea580c'};"><strong>${row.active}</strong></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; color: #475569;">${row.lastSwitched || "—"}</td>
      </tr>
    `).join("");

    const htmlData = `
      <table style="border-collapse: collapse; width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <thead>${htmlHeader}</thead>
        <tbody>${htmlBody}</tbody>
      </table>
    `;

    try {
      // 3. Write both formats to the clipboard simultaneously
      const clipboardItem = new ClipboardItem({
        "text/plain": new Blob([tsvData], { type: "text/plain" }),
        "text/html": new Blob([htmlData], { type: "text/html" })
      });
      await navigator.clipboard.write([clipboardItem]);
      toast.success("Table copied to clipboard!");
    } catch (err) {
      // Fallback for older browsers that don't support ClipboardItem
      try {
        await navigator.clipboard.writeText(tsvData);
        toast.success("Table text copied to clipboard!");
      } catch (fallbackErr) {
        toast.error("Failed to copy to clipboard.");
      }
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-4 flex flex-col h-full w-full bg-white overflow-hidden">

        {/* UNIFIED COMPACT SINGLE-LINE TOOLBAR */}
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/50 p-2.5 rounded-xl mb-3 gap-4 flex-wrap sm:flex-nowrap flex-shrink-0">
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
              Active Server Configuration
            </h1>
            <p className="text-[0.72rem] text-slate-500 truncate mt-0.5">
              Manage Primary / Secondary NMS Active Server for Adapters
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">

            {/*  NEW COPY BUTTON */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyTable}
              className="h-8 text-xs font-semibold px-3 border-slate-200"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
              Copy
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadServers}
              disabled={loadingAll}
              className="h-8 text-xs font-semibold px-3 border-slate-200"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5 text-slate-500", loadingAll && "animate-spin")} />
              Refresh
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold px-3 border-slate-200">
                  <Info className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  Legend
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 bg-white border border-slate-200 shadow-xl rounded-xl p-4 z-[1300]">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Info className="h-4 w-4 text-blue-500" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Status Indicators</h4>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 h-3.5 w-3.5 rounded border border-emerald-500 bg-emerald-50 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Green — Active
                      </div>
                      <p className="text-[0.7rem] text-slate-500 mt-0.5 leading-relaxed">
                        This server is currently NMS active server.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 h-3.5 w-3.5 rounded border border-rose-500 bg-rose-50 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-rose-600">
                        <XCircle className="h-3.5 w-3.5" />
                        Red — Standby
                      </div>
                      <p className="text-[0.7rem] text-slate-500 mt-0.5 leading-relaxed">
                        This server is on standby. Toggle the switch to make it active.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[0.68rem] text-slate-400 font-medium leading-normal">
                    Disabled adapters ({DISABLED_ADAPTERS.join(", ")}) cannot be switched.
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* FULL-WIDTH SINGLE COLUMN LIST */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-2",
            "[&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full transition-colors"
          )}
        >
          {rows.map((row) => {
            const isPrimaryActive = row.active === "PRIMARY";
            const isDisabled = DISABLED_ADAPTERS.includes(row.adapter);

            return (
              <div
                key={row.adapter}
                className={cn(
                  "rounded-xl border border-slate-200/80 bg-white p-2 grid grid-cols-[80px_1fr_1fr_45px_35px] gap-2 items-center transition-all flex-shrink-0",
                  "hover:shadow-sm hover:border-slate-300",
                  isDisabled && "opacity-65"
                )}
              >
                {/* Adapter Badge */}
                <div className="flex items-center pl-0.5">
                  <Badge
                    className={cn(
                      "text-[0.68rem] font-bold text-white px-2 py-0.5 rounded shadow-sm tracking-wider w-[72px] justify-center h-5 border-none",
                      ADAPTER_COLORS[row.adapter] ?? "bg-slate-400"
                    )}
                  >
                    {row.adapter}
                  </Badge>
                </div>

                {/* Primary Server Box */}
                <div
                  className={cn(
                    "rounded-lg border-2 p-1.5 transition-all duration-200",
                    isPrimaryActive
                      ? "border-green-500 bg-green-500/10 shadow-sm"
                      : "border-red-500 bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[0.65rem] font-bold text-slate-700 uppercase tracking-wide">Primary</span>
                    {isPrimaryActive && (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                  <div className="text-[0.7rem] text-slate-600 mt-0.5 font-mono font-medium truncate">
                    {row.primaryServer}
                  </div>
                </div>

                {/* Secondary Server Box */}
                <div
                  className={cn(
                    "rounded-lg border-2 p-1.5 transition-all duration-200",
                    !isPrimaryActive
                      ? "border-green-500 bg-green-500/10 shadow-sm"
                      : "border-red-500 bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[0.65rem] font-bold text-slate-700 uppercase tracking-wide">Secondary</span>
                    {!isPrimaryActive && (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                  <div className="text-[0.7rem] text-slate-600 mt-0.5 font-mono font-medium truncate">
                    {row.secondaryServer}
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="flex justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Switch
                          checked={!isPrimaryActive}
                          onCheckedChange={() => handleToggleRequest(row)}
                          disabled={isDisabled}
                          className={cn("scale-90", isDisabled && "opacity-40 cursor-not-allowed")}
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {isDisabled
                        ? `${row.adapter} switching is disabled`
                        : `Switch to ${isPrimaryActive ? "SECONDARY" : "PRIMARY"}`}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* History Button */}
                <div className="flex justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        onClick={() => openHistory(row)}
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Switch History</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm Switch Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md rounded-xl bg-white p-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-800">
                <AlertTriangle className="h-4 w-4 text-amber-500 fill-current" />
                Confirm Server Switch
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-xs text-slate-500 pt-2 leading-relaxed">
                  {pendingRow && (
                    <>
                      Switch <strong>{pendingRow.adapter}</strong> from{" "}
                      <Badge variant="outline" className="mx-1 text-[10px] font-bold text-slate-700 bg-slate-50 border-slate-200 px-1.5 py-0">{pendingRow.active}</Badge> to{" "}
                      <Badge variant="outline" className="mx-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border-emerald-200 px-1.5 py-0">
                        {pendingRow.active === "PRIMARY" ? "SECONDARY" : "PRIMARY"}
                      </Badge>?
                    </>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)} disabled={switching} className="text-xs h-8">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSwitch}
                disabled={switching}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs h-8 px-4"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                {switching ? "Switching..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] bg-white p-5 rounded-xl flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Switch History — {historyRow?.adapter}
              </DialogTitle>
            </DialogHeader>

            <div
              className={cn(
                "flex-1 min-h-0 overflow-auto border border-slate-200 rounded-lg mt-3",
                "[&::-webkit-scrollbar]:w-1.5",
                "[&::-webkit-scrollbar-track]:bg-transparent",
                "[&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full transition-colors"
              )}
            >
              {historyLoading ? (
                <div className="p-8 text-center text-xs font-semibold text-slate-400">Loading...</div>
              ) : historyData.length === 0 ? (
                <div className="p-8 text-center text-xs font-semibold text-slate-400">No history found</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider py-2 px-4">From</TableHead>
                      <TableHead className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider py-2 px-4">To</TableHead>
                      <TableHead className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider py-2 px-4">Time</TableHead>
                      <TableHead className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider py-2 px-4">User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyData.map((entry, idx) => (
                      <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="py-2 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold px-1.5 h-4 border",
                              entry.from === "PRIMARY"
                                ? "text-green-600 border-green-200 bg-emerald-50"
                                : "text-amber-600 border-amber-200 bg-amber-50"
                            )}
                          >
                            {entry.from}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold px-1.5 h-4 border",
                              entry.to === "PRIMARY"
                                ? "text-green-600 border-green-200 bg-emerald-50"
                                : "text-amber-600 border-amber-200 bg-amber-50"
                            )}
                          >
                            {entry.to}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[0.72rem] text-slate-600 font-medium font-mono py-2 px-4">
                          {entry.time}
                        </TableCell>
                        <TableCell className="text-[0.72rem] text-slate-700 font-semibold py-2 px-4">
                          {entry.user}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <DialogFooter className="flex-shrink-0 mt-4">
              <Button variant="outline" size="sm" onClick={() => setHistoryOpen(false)} className="text-xs h-8">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}