import { useState, useEffect, useCallback, useRef } from "react";
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
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  UploadCloud,
  Layers,
  FileSpreadsheet,
  Download,
  FileUp
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { cn } from "../../../lib/utils";
import * as XLSX from "xlsx";
import {
  ALARM_MASKING_GETALL,
  ALARM_MASKING_ADD_DEVICE,
  ALARM_MASKING_ADD_BULK_DEVICES,
  ALARM_MASKING_DELETE_DEVICE,
  ALARM_MASKING_EDIT_DEVICE,
  ALARM_MASKING_VENDOR_DEVICES,
} from "../../../api/apis";

/* ================= TYPES ================= */
interface MaskedDeviceRow {
  id?: number;
  device: string; // Mapped from backend 'deviceName'
  reason: string;
  flag: string; // "enable" or "disable" (Mapped from 'isTicketBlocked')
  adapter: string;
}

interface ParsedExcelRow {
  device: string;
  reason: string;
  flag: string;
  adapter: string;
  isValid: boolean;
  isWarning: boolean;
  errorOrWarningMsg?: string;
}

const ADAPTERS = ["MCP", "NFMT", "EPNM", "CONC", "ADVA", "IFNR", "TLMR"];

/* ================= EXACT HEX COLOR MAPPING ================= */
const getAdapterHexColor = (val?: string): string => {
  const v = (val ?? "").trim().toUpperCase();
  if (v === "MCP") return "#009688";
  if (v === "NFMT") return "#8283eb";
  if (v === "EPNM") return "#4CAF50";
  if (v === "CONC") return "#FF9800";
  if (v === "ADVA") return "#9C27B0";
  if (v === "IFNR") return "#3F51B5";
  if (v === "TLMR") return "#E91E63";
  return "#607D8B";
};

/* ================= COMPONENT ================= */
export default function AlarmMasking() {
  // Table state (Single Adapter View)
  const [rows, setRows] = useState<MaskedDeviceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>("MCP");

  // Vendor Devices State (For Autocomplete & Validation)
  const [validInventoryDevices, setValidInventoryDevices] = useState<string[]>([]);
  const [loadingInventory, setLoadingInventory] = useState<boolean>(false);

  // Modal States
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [bulkOpen, setBulkOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

  // Active Target Row for Edit/Delete
  const [targetRow, setTargetRow] = useState<MaskedDeviceRow | null>(null);

  // Form States for Add/Edit
  const [formAdapter, setFormAdapter] = useState<string>("MCP");
  const [formDevice, setFormDevice] = useState<string>("");
  const [formReason, setFormReason] = useState<string>("");
  const [formFlag, setFormFlag] = useState<string>("enable");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Excel Bulk Upload States
  const [bulkAdapter, setBulkAdapter] = useState<string>("MCP");
  const [parsedRows, setParsedRows] = useState<ParsedExcelRow[]>([]);
  const [hasParsed, setHasParsed] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ================= FETCH TABLE DATA ================= */
  const loadTableDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`${ALARM_MASKING_GETALL}?adapter=${activeFilter}`);
      const data = Array.isArray(res.data) ? res.data : [];
      
      // Data Mapping: API Response -> UI State
      const mapped = data.map((item: any) => ({
        id: item.id,
        device: item.deviceName || item.device || "",
        adapter: item.adapter || activeFilter,
        reason: item.reason || "—",
        // isTicketBlocked: true -> enable (masks alarms)
        flag: (item.isTicketBlocked === true || item.isTicketBlocked === "true" || item.flag === "enable") 
              ? "enable" : "disable",
      }));
      setRows(mapped);
    } catch {
      toast.error(`Failed to load excluded devices for ${activeFilter}`);
      setRows([]);
    }
    setLoading(false);
  }, [activeFilter]);

  useEffect(() => {
    logActivity({ activity: "Alarm Masking page opened", actionName: "ALARM_MASKING_PAGE", module: "ADMIN" });
  }, []);

  useEffect(() => {
    loadTableDevices();
  }, [loadTableDevices]);

  /* ================= FETCH INVENTORY DEVICES ================= */
  const fetchValidDevices = async (adapter: string) => {
    setLoadingInventory(true);
    try {
      const res = await axiosClient.get(`${ALARM_MASKING_VENDOR_DEVICES}?adapter=${adapter}`);
      const data = Array.isArray(res.data) ? res.data : [];
      const devices = data
        .map((d: any) => d?.device || d?.deviceName || d?.name || (typeof d === "string" ? d : ""))
        .filter(Boolean);
      setValidInventoryDevices(devices);
    } catch {
      toast.error(`Could not load device inventory for ${adapter}`);
      setValidInventoryDevices([]);
    }
    setLoadingInventory(false);
  };

  useEffect(() => {
    if (addOpen) fetchValidDevices(formAdapter);
  }, [addOpen, formAdapter]);

  useEffect(() => {
    if (bulkOpen) fetchValidDevices(bulkAdapter);
  }, [bulkOpen, bulkAdapter]);

  /* ================= ADD SINGLE DEVICE ================= */
  const handleAddDevice = async () => {
    if (!formDevice.trim()) {
      toast.error("Device IP or Name is required");
      return;
    }
    setSubmitting(true);
    try {
      // Data Mapping: UI State -> API Payload (DeviceAddReq DTO)
      await axiosClient.post(
        `${ALARM_MASKING_ADD_DEVICE}?adapter=${formAdapter}`,
        {
          device: formDevice.trim(),
          reason: formReason.trim() || "Manual Exclusion",
          flag: formFlag, // "enable" or "disable"
        }
      );
      toast.success(`Device added to ${formAdapter} exclusion list`);
      setAddOpen(false);
      resetForms();
      if (formAdapter === activeFilter) {
        loadTableDevices();
      }
    } catch {
      toast.error("Failed to add device");
    }
    setSubmitting(false);
  };

  /* ================= EDIT DEVICE ================= */
  const handleEditSubmit = async () => {
    if (!targetRow) return;
    setSubmitting(true);
    try {
      await axiosClient.put(
        `${ALARM_MASKING_EDIT_DEVICE}?adapter=${targetRow.adapter}`,
        {
          device: targetRow.device,
          reason: formReason.trim(),
          flag: formFlag, // "enable" or "disable"
        }
      );
      toast.success("Device exclusion modified");
      setEditOpen(false);
      resetForms();
      loadTableDevices();
    } catch {
      toast.error("Failed to modify device exclusion");
    }
    setSubmitting(false);
  };

  /* ================= TOGGLE STATUS FLAG ================= */
  const handleToggleFlag = async (row: MaskedDeviceRow) => {
    const newFlag = row.flag === "enable" ? "disable" : "enable";
    try {
      await axiosClient.put(
        `${ALARM_MASKING_EDIT_DEVICE}?adapter=${row.adapter}`,
        {
          device: row.device,
          reason: row.reason,
          flag: newFlag, // "enable" or "disable"
        }
      );
      toast.success(`Device status updated to ${newFlag.toUpperCase()}`);
      setRows((prev) =>
        prev.map((r) =>
          r.device === row.device ? { ...r, flag: newFlag } : r
        )
      );
    } catch {
      toast.error("Failed to change device status");
    }
  };

  /* ================= DELETE DEVICE ================= */
  const handleDeleteConfirm = async () => {
    if (!targetRow) return;
    setSubmitting(true);
    try {
      const res = await axiosClient.delete(
        `${ALARM_MASKING_DELETE_DEVICE}?device=${encodeURIComponent(targetRow.device)}&adapter=${targetRow.adapter}`
      );
      if (res.data?.status === "success" || res.status === 200) {
        toast.success("Device removed from exclusion list");
        setRows((prev) => prev.filter((r) => r.device !== targetRow.device));
      } else {
        toast.error("Failed to delete device");
      }
    } catch {
      toast.error("Failed to execute deletion");
    }
    setSubmitting(false);
    setDeleteOpen(false);
    setTargetRow(null);
  };

  /* ================= EXCEL BULK UPLOAD PIPELINE ================= */
  
  // 1. Download Excel Template
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      { "Device Name": "ADANI_CX", "Reason of Exclusion": "Optical fiber maintenance", "Status": "enable" },
      { "Device Name": "DIST_SWITCH_14", "Reason of Exclusion": "Decommissioned hardware", "Status": "disable" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bulk Add Devices");
    XLSX.writeFile(wb, "Alarm_Masking_Template.xlsx");
    toast.success("Excel template downloaded!");
  };

  // 2. Parse Uploaded Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert Excel rows to JSON objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        if (rawJson.length === 0) {
          toast.error("The uploaded Excel file is empty.");
          return;
        }

        const parsed: ParsedExcelRow[] = rawJson.map((row) => {
          // Look for column names defensively
          const dev = (row["Device Name"] || row["device"] || row["deviceName"] || "")?.toString().trim();
          const reason = (row["Reason of Exclusion"] || row["reason"] || "Bulk Exclusion")?.toString().trim();
          const rawStatus = (row["Status"] || row["flag"] || "")?.toString().trim();

          let isValid = true;
          let isWarning = false;
          let errorOrWarningMsg = "";
          let flagVal = "enable";

          // Basic Validity Checks
          if (!dev) {
            isValid = false;
            errorOrWarningMsg = "Missing Device Name";
          } else if (["1", "YES", "ENABLE", "TRUE"].includes(rawStatus.toUpperCase())) {
            flagVal = "enable";
          } else if (["0", "NO", "DISABLE", "FALSE"].includes(rawStatus.toUpperCase())) {
            flagVal = "disable";
          } else {
            isValid = false;
            errorOrWarningMsg = `Invalid Status '${rawStatus}' (Use enable/disable)`;
          }

          // Inventory Warning Check
          if (isValid && !validInventoryDevices.includes(dev)) {
            isWarning = true;
            errorOrWarningMsg = "Device not in DB, but will be added";
          }

          return {
            device: dev,
            reason: reason,
            flag: flagVal,
            adapter: bulkAdapter,
            isValid,
            isWarning,
            errorOrWarningMsg,
          };
        });

        setParsedRows(parsed);
        setHasParsed(true);

        const validCount = parsed.filter((r) => r.isValid).length;
        const warningCount = parsed.filter((r) => r.isWarning).length;
        const errorCount = parsed.length - validCount;

        if (errorCount > 0) {
          toast.error(`Parsed with ${errorCount} error(s). Errors will be skipped.`);
        } else if (warningCount > 0) {
          toast.warning(`Parsed with ${warningCount} warning(s). You can still proceed.`);
        } else {
          toast.success(`Successfully parsed ${validCount} valid rows from Excel!`);
        }
      } catch (err) {
        toast.error("Failed to parse Excel file. Ensure it is a valid .xlsx file.");
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Clear input so same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. Commit Parsed Rows
  const handleCommitBulkExcel = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid rows to upload");
      return;
    }

    setSubmitting(true);
    // Payload matches DeviceAddReq DTO
    const payload = validRows.map((r) => ({
      device: r.device,
      reason: r.reason,
      flag: r.flag, 
    }));

    try {
      await axiosClient.post(
        `${ALARM_MASKING_ADD_BULK_DEVICES}?adapter=${bulkAdapter}`,
        { devices: payload }
      );
      toast.success(`Successfully uploaded ${validRows.length} devices to ${bulkAdapter}!`);
      setBulkOpen(false);
      resetForms();
      if (bulkAdapter === activeFilter) loadTableDevices();
    } catch {
      toast.error("Bulk upload failed");
    }
    setSubmitting(false);
  };

  const resetForms = () => {
    setFormDevice("");
    setFormReason("");
    setFormFlag("enable");
    setParsedRows([]);
    setHasParsed(false);
    setSelectedFileName(null);
    setTargetRow(null);
  };

  const openEditDialog = (row: MaskedDeviceRow) => {
    setTargetRow(row);
    setFormDevice(row.device);
    setFormReason(row.reason);
    setFormFlag(row.flag);
    setEditOpen(true);
  };

  const openDeleteDialog = (row: MaskedDeviceRow) => {
    setTargetRow(row);
    setDeleteOpen(true);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-4 flex flex-col h-full w-full bg-white overflow-hidden">
        
        {/* UNIFIED COMPACT TOOLBAR */}
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/50 p-2.5 rounded-xl mb-3 gap-4 flex-wrap sm:flex-nowrap flex-shrink-0">
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-wider text-slate-800 uppercase flex items-center gap-2">
            TICKET MASKING
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { resetForms(); setAddOpen(true); }}
              className="h-8 text-xs font-semibold px-3 bg-slate-900 text-white hover:bg-slate-800 hover:text-white border-transparent"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Device
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { resetForms(); setBulkOpen(true); }}
              className="h-8 text-xs font-semibold px-3 border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Excel Bulk Add
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadTableDevices}
                  disabled={loading}
                  className="h-8 w-8 border-slate-200 text-slate-600 hover:text-slate-900"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Refresh Table</TooltipContent>
            </Tooltip>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-slate-200 text-blue-600 hover:bg-blue-50/50"
                >
                  <Info className="h-4 w-4" />
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
                        <CheckCircle2 className="h-3.5 w-3.5" /> ENABLE
                      </div>
                      <p className="text-[0.7rem] text-slate-500 mt-0.5 leading-relaxed">
                        Alarms from this device are actively masked; tickets will NOT be generated.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 h-3.5 w-3.5 rounded border border-rose-500 bg-rose-50 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-rose-600">
                        <XCircle className="h-3.5 w-3.5" /> DISABLE
                      </div>
                      <p className="text-[0.7rem] text-slate-500 mt-0.5 leading-relaxed">
                        Exclusion is temporarily disabled; standard ticketing rules apply.
                      </p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* INTERACTIVE TABLE FILTER PILLS */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 flex-shrink-0">
          <span className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter Adapter:</span>
          {ADAPTERS.map((adp) => {
            const isSelected = activeFilter === adp;
            return (
              <button
                key={adp}
                onClick={() => setActiveFilter(adp)}
                style={{
                  backgroundColor: isSelected ? getAdapterHexColor(adp) : undefined,
                  borderColor: isSelected ? getAdapterHexColor(adp) : undefined,
                }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                  isSelected
                    ? "text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                <span>{adp}</span>
              </button>
            );
          })}
        </div>

        {/* FULL-WIDTH TABLE AREA */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-auto border border-slate-200/80 rounded-xl",
            "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full transition-colors"
          )}
        >
          {loading ? (
            <div className="p-12 text-center text-xs font-semibold text-slate-400">Loading masked devices for {activeFilter}...</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
              <Layers className="h-8 w-8 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">
                No excluded devices found for adapter {activeFilter}
              </p>
              <Button size="sm" variant="outline" onClick={() => { resetForms(); setFormAdapter(activeFilter); setAddOpen(true); }} className="mt-1 text-xs h-7">
                <Plus className="h-3 w-3 mr-1" /> Add Exclusion
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider py-2.5 px-4 w-[110px]">Adapter</TableHead>
                  <TableHead className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider py-2.5 px-4">Device Name / IP</TableHead>
                  <TableHead className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider py-2.5 px-4">Exclusion Reason</TableHead>
                  <TableHead className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider py-2.5 px-4 w-[140px] text-center">Status</TableHead>
                  <TableHead className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider py-2.5 px-4 w-[110px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => {
                  const isEnable = row.flag === "enable";
                  return (
                    <TableRow key={`${row.adapter}-${row.device}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <TableCell className="py-2.5 px-4">
                        <Badge
                          style={{ backgroundColor: getAdapterHexColor(row.adapter) }}
                          className="text-[0.65rem] font-bold text-white px-2 py-0.5 rounded shadow-sm tracking-wider w-[64px] justify-center h-5 border-none"
                        >
                          {row.adapter}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 font-mono font-bold text-xs text-slate-800">
                        {row.device}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-xs text-slate-600 font-medium">
                        {row.reason}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={isEnable}
                            onCheckedChange={() => handleToggleFlag(row)}
                            className="scale-75"
                          />
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold px-2 h-5 border min-w-[65px] justify-center tracking-wider uppercase",
                              isEnable
                                ? "text-green-600 border-green-200 bg-emerald-50"
                                : "text-rose-600 border-rose-200 bg-rose-50"
                            )}
                          >
                            {isEnable ? "ENABLE" : "DISABLE"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(row)}
                                className="h-7 w-7 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Edit Device</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(row)}
                                className="h-7 w-7 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Delete Device</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* ================= MODALS ================= */}

        {/* 1. Add Single Device Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md rounded-xl bg-white p-5 overflow-visible">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-wide text-slate-800">
                Add Ticket Exclusion
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 pt-1">
                Select an adapter and search for a device, or enter a custom one.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider block mb-1">Target Adapter</label>
                <select
                  value={formAdapter}
                  onChange={(e) => setFormAdapter(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400 bg-white font-bold text-slate-800"
                >
                  {ADAPTERS.map((adp) => (
                    <option key={adp} value={adp}>{adp}</option>
                  ))}
                </select>
              </div>
              
              <div className="relative">
                <label className="text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider block mb-1 flex justify-between">
                  <span>Device Hostname / IP</span>
                  {loadingInventory && <span className="text-blue-500 animate-pulse normal-case font-medium">Loading list...</span>}
                </label>
                <input
                  type="text"
                  list="inventory-devices"
                  placeholder="Search device or type custom name..."
                  value={formDevice}
                  onChange={(e) => setFormDevice(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400 font-mono"
                  autoComplete="off"
                />
                <datalist id="inventory-devices">
                  {validInventoryDevices.map((dev) => (
                    <option key={dev} value={dev} />
                  ))}
                </datalist>
                {formDevice && !validInventoryDevices.includes(formDevice) && validInventoryDevices.length > 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Note: This device is not in standard inventory (will be added as custom).
                  </p>
                )}
              </div>

              <div>
                <label className="text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider block mb-1">Exclusion Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Planned Network Maintenance / Decommissioned"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400 resize-none"
                />
              </div>
              <div>
                <label className="text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider block mb-1">Status (Exclude from ticketing?)</label>
                <select
                  value={formFlag}
                  onChange={(e) => setFormFlag(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400 bg-white font-medium"
                >
                  <option value="enable">ENABLE — Alarms Masked</option>
                  <option value="disable">DISABLE — Standard Ticketing</option>
                </select>
              </div>
            </div>
            <DialogFooter className="gap-2 mt-2 border-t border-slate-100 pt-3">
              <Button variant="outline" size="sm" onClick={() => setAddOpen(false)} disabled={submitting} className="text-xs h-8">
                Cancel
              </Button>
              <Button onClick={handleAddDevice} disabled={submitting} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-8 px-4">
                {submitting ? "Saving..." : "Save Device"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 2. Excel Bulk Add Dialog */}
        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] rounded-xl bg-white p-5 flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0 border-b border-slate-100 pb-3">
              <DialogTitle className="text-sm font-bold uppercase tracking-wide text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Excel Bulk Add & Inventory Validation
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 pt-1">
                Download the template, fill in your devices, and upload the <code className="bg-slate-100 px-1 rounded font-bold">.xlsx</code> file.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    1. Target Adapter & Validation Sync
                    {loadingInventory && <span className="text-blue-500 normal-case animate-pulse text-[10px]">(fetching inventory...)</span>}
                  </label>
                  <p className="text-[10px] text-slate-500">Select the adapter to fetch valid devices for checking.</p>
                </div>
                <select
                  value={bulkAdapter}
                  onChange={(e) => {
                    setBulkAdapter(e.target.value);
                    if (hasParsed) {
                      setParsedRows((prev) => prev.map((r) => ({ ...r, adapter: e.target.value })));
                    }
                  }}
                  className="text-xs border border-slate-200 rounded-md px-3 py-1.5 bg-white font-bold text-slate-800 min-w-[120px]"
                >
                  {ADAPTERS.map((adp) => (
                    <option key={adp} value={adp}>{adp}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                  <Download className="h-6 w-6 text-emerald-600 mb-1" />
                  <div className="text-xs font-bold text-slate-800">2. Get the Template</div>
                  <p className="text-[10px] text-slate-500 mb-2">Standardized Excel file with correct columns.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadExcelTemplate}
                    className="h-7 text-[0.7rem] font-semibold text-emerald-700 border-emerald-300 bg-white hover:bg-emerald-50"
                  >
                    Download Template
                  </Button>
                </div>

                <div className="border border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 relative">
                  <FileUp className="h-6 w-6 text-blue-600 mb-1" />
                  <div className="text-xs font-bold text-slate-800">3. Upload File</div>
                  <p className="text-[10px] text-slate-500 mb-2 truncate max-w-[180px]">
                    {selectedFileName || "Select your filled .xlsx file"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[0.7rem] font-semibold text-blue-700 border-blue-300 bg-white hover:bg-blue-50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loadingInventory}
                  >
                    Browse Excel File
                  </Button>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* Staging Validation Preview Table */}
              {hasParsed && (
                <div className="border border-slate-200 rounded-lg overflow-hidden mt-4 shadow-sm">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[0.68rem] font-bold text-slate-700 uppercase tracking-wider">Validation Staging Preview</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[0.68rem] font-bold text-amber-600 flex items-center gap-1">
                         {parsedRows.filter((r) => r.isWarning).length} Warning(s)
                      </span>
                      <span className="text-[0.68rem] font-bold text-emerald-600 flex items-center gap-1">
                         {parsedRows.filter((r) => r.isValid).length} Valid Row(s) Ready
                      </span>
                    </div>
                  </div>
                  <div className="max-h-[30vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 text-[0.65rem] sticky top-0 z-10 shadow-sm">
                        <TableRow className="border-none">
                          <TableHead className="py-2 px-3">Device</TableHead>
                          <TableHead className="py-2 px-3">Reason</TableHead>
                          <TableHead className="py-2 px-3 text-center">Status</TableHead>
                          <TableHead className="py-2 px-3 w-[220px]">Validation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedRows.map((row, idx) => {
                          const isEnable = row.flag === "enable";
                          return (
                            <TableRow key={idx} className={cn(
                              "text-xs border-b border-slate-100", 
                              !row.isValid && "bg-rose-50/60",
                              (row.isValid && row.isWarning) && "bg-amber-50/30"
                            )}>
                              <TableCell className="py-1.5 px-3 font-mono font-bold">{row.device || "—"}</TableCell>
                              <TableCell className="py-1.5 px-3 text-slate-600">{row.reason}</TableCell>
                              <TableCell className="py-1.5 px-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] font-bold px-1.5 h-4 uppercase",
                                    isEnable ? "text-green-600 bg-emerald-50 border-green-200" : "text-rose-600 bg-rose-50 border-rose-200"
                                  )}
                                >
                                  {row.flag}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-1.5 px-3 text-[0.7rem] font-medium">
                                {!row.isValid ? (
                                  <span className="text-rose-600 font-bold flex items-center gap-1"><XCircle className="h-3 w-3 flex-shrink-0" /> {row.errorOrWarningMsg}</span>
                                ) : row.isWarning ? (
                                  <span className="text-amber-600 font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3 flex-shrink-0" /> {row.errorOrWarningMsg}</span>
                                ) : (
                                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 flex-shrink-0" /> Valid in Inventory</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 mt-3 flex-shrink-0 border-t border-slate-100 pt-3">
              <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)} disabled={submitting} className="text-xs h-8">
                Cancel
              </Button>
              <Button
                onClick={handleCommitBulkExcel}
                disabled={submitting || !hasParsed || parsedRows.filter((r) => r.isValid).length === 0}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-8 px-4"
              >
                {submitting ? "Uploading..." : `Upload Valid Rows (${parsedRows.filter((r) => r.isValid).length})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 3. Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md rounded-xl bg-white p-5">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-wide text-slate-800">
                Edit Exclusion ({targetRow?.adapter})
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block mb-1">Device Hostname / IP</label>
                <input
                  type="text"
                  value={formDevice}
                  disabled
                  className="w-full text-xs border border-slate-200 bg-slate-100 text-slate-500 rounded-lg px-3 py-2 font-mono cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider block mb-1">Exclusion Reason</label>
                <textarea
                  rows={2}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400 resize-none"
                />
              </div>
              <div>
                <label className="text-[0.7rem] font-bold text-slate-700 uppercase tracking-wider block mb-1">Status (Exclude from ticketing?)</label>
                <select
                  value={formFlag}
                  onChange={(e) => setFormFlag(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400 bg-white font-medium"
                >
                  <option value="enable">ENABLE — Alarms Masked</option>
                  <option value="disable">DISABLE — Standard Ticketing</option>
                </select>
              </div>
            </div>
            <DialogFooter className="gap-2 mt-2 border-t border-slate-100 pt-3">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} disabled={submitting} className="text-xs h-8">
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} disabled={submitting} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-8 px-4">
                {submitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 4. Delete Confirm Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-md rounded-xl bg-white p-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rose-600">
                <AlertTriangle className="h-4 w-4 text-rose-500 fill-current" />
                Confirm Removal
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-xs text-slate-600 pt-2 leading-relaxed">
                  Are you sure you want to delete exclusion for device <strong className="font-mono text-slate-900">{targetRow?.device}</strong> under adapter <strong>{targetRow?.adapter}</strong>?
                  <p className="mt-1 text-slate-500">Once removed, standard monitoring and ticket generation rules will immediately apply.</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4 border-t border-slate-100 pt-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} disabled={submitting} className="text-xs h-8">
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8 px-4"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                {submitting ? "Deleting..." : "Delete Device"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}