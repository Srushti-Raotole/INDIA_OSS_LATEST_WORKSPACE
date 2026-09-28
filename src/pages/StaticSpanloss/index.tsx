import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logActivity } from "../../utils/activityLogger";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Save as SaveIcon,
  RefreshCw as RefreshIcon,
  RotateCcw as RestartAltIcon,
  Plus as PlusIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
} from "lucide-react";
import { Popover } from "@mui/material";
import { VendorTabs } from "./components/VendorTabs";
import { ClientTabs } from "./components/ClientTabs";
import { SpanLossTable } from "./components/SpanLossTable";
import { AddRowDialog } from "./components/AddRowDialog";
import {
  CsvImportDialog,
  type CsvImportMode,
} from "./components/CsvImportDialog";
import { UnsavedChangesGuard } from "./components/UnsavedChangesGuard";
import {
  bulkInsertSpanLoss,
  fetchClientsByVendor,
  fetchSpanLossRecords,
  SPAN_LOSS_VENDORS,
  type SpanLossVendor,
} from "./services/spanLossApi";
import type { SpanLossRow } from "./types";
import { EDITABLE_FIELDS } from "./types";
import { getVendorColor } from "./constants/vendorColors";
import { downloadCsv, rowsToCsv } from "./utils/csvUtils";
import { rowMatchKey, type DuplicateAnalysis } from "./utils/rowMatching";
import { useToast } from "../../hooks/use-toast";

export default function StaticSpanlossPage() {
  const { toast } = useToast();
  const [vendor, setVendor] = useState<SpanLossVendor>(SPAN_LOSS_VENDORS[0]);

  // Clients per vendor (cached so we don't re-fetch on every tab switch)
  const [clientsByVendor, setClientsByVendor] = useState<
    Record<string, string[]>
  >({});
  const [clientsLoading, setClientsLoading] = useState(false);
  const [client, setClient] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<SpanLossRow[]>([]);
  const originalRef = useRef<Map<string, SpanLossRow>>(new Map());
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  // Save is always a full-table override on the backend now — no mode flag needed.
  const vendorColor = getVendorColor(vendor);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);

  // ---------- Clients ----------
  const loadClients = useCallback(
    async (v: SpanLossVendor) => {
      if (clientsByVendor[v]) {
        // Already cached
        const first = clientsByVendor[v][0] ?? "";
        setClient(first);
        return;
      }
      setClientsLoading(true);
      try {
        const list = await fetchClientsByVendor(v);
        setClientsByVendor((prev) => ({ ...prev, [v]: list }));
        setClient(list[0] ?? "");
      } catch (err) {
        toast({
          title: "Failed to load clients",
          description: String((err as Error).message ?? err),
          variant: "destructive",
        });
        setClient("");
      } finally {
        setClientsLoading(false);
      }
    },
    [clientsByVendor, toast],
  );

  // ---------- Records ----------
  const loadRecords = useCallback(
    async (v: SpanLossVendor, c: string) => {
      if (!c) {
        setRows([]);
        originalRef.current = new Map();
        setDirtyKeys(new Set());
        return;
      }
      setLoading(true);
      try {
        const data = await fetchSpanLossRecords(v, c);
        setRows(data);
        originalRef.current = new Map(
          data.map((r) => [rowMatchKey(r), { ...r }]),
        );
        setDirtyKeys(new Set());
      } catch (err) {
        toast({
          title: "Failed to load span loss data",
          description: String((err as Error).message ?? err),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    logActivity({ activity: "Static Spanloss page opened", actionName: "STATIC_SPANLOSS_PAGE", module: "ADMIN" });
  }, []);

  // Load clients on vendor change
  useEffect(() => {
    loadClients(vendor);
  }, [vendor, loadClients]);

  // Load records on vendor/client change
  useEffect(() => {
    loadRecords(vendor, client);
  }, [vendor, client, loadRecords]);

  const confirmDiscard = (label: string) => {
    if (dirtyKeys.size === 0) return true;
    return window.confirm(
      `You have ${dirtyKeys.size} unsaved change(s). Switch to ${label} and discard?`,
    );
  };

  const handleVendorChange = (next: SpanLossVendor) => {
    if (next === vendor) return;
    if (!confirmDiscard(next)) return;
    setVendor(next);
  };

  const handleClientChange = (next: string) => {
    if (next === client) return;
    if (!confirmDiscard(next)) return;
    setClient(next);
  };

  const recomputeDirty = useCallback((current: SpanLossRow[]) => {
    const next = new Set<string>();
    current.forEach((r) => {
      const key = rowMatchKey(r);
      const base = originalRef.current.get(key);
      if (!base) {
        next.add(key);
        return;
      }
      const isDirty = EDITABLE_FIELDS.some(
        (f) => Number(base[f]) !== Number(r[f]),
      );
      if (isDirty) next.add(key);
    });
    setDirtyKeys(next);
  }, []);

  const handleRowEdit = useCallback(
    (updated: SpanLossRow, original: SpanLossRow): SpanLossRow => {
      const oldKey = rowMatchKey(original);
      setRows((prev) => {
        const nextRows = prev.map((r) =>
          rowMatchKey(r) === oldKey ? updated : r,
        );
        recomputeDirty(nextRows);
        return nextRows;
      });
      return updated;
    },
    [recomputeDirty],
  );

  const handleAddRow = (row: SpanLossRow) => {
    const enriched: SpanLossRow = {
      ...row,
      vendor,
      client: row.client || client,
    };
    setRows((prev) => {
      const nextRows = [enriched, ...prev];
      recomputeDirty(nextRows);
      return nextRows;
    });
    toast({
      title: "Row added",
      description: `${row.spanId} added to ${vendor}/${client}. Click Save to persist.`,
    });
  };

  // ---------- CSV import ----------
  // Save is always a full-table override on the backend, so we just need to
  // shape the in-memory rows correctly. The user picks:
  //   - append:   add CSV rows that don't already exist (5-key match)
  //   - override: replace the entire visible table with the CSV
  // Either way, when they click Save, we send the full current row set.
  const handleCsvImport = (
    incoming: SpanLossRow[],
    mode: CsvImportMode,
    analysis: DuplicateAnalysis,
  ) => {
    const stamp = (r: SpanLossRow): SpanLossRow => ({
      ...r,
      vendor: r.vendor || vendor,
      client: r.client || client,
    });

    if (mode === "override") {
      const next = incoming.map(stamp);
      setRows(next);
      // Force everything to be dirty so Save fires
      const dirty = new Set(next.map((r) => rowMatchKey(r)));
      originalRef.current = new Map();
      setDirtyKeys(dirty);
      toast({
        title: "Table replaced (pending save)",
        description: `Replaced view with ${incoming.length} CSV row(s). On Save, the backend will replace all ${vendor}/${client} rows with the current table.`,
      });
      return;
    }

    // append — add only rows whose 5-key isn't in the table yet
    const map = new Map(rows.map((r) => [rowMatchKey(r), r] as const));
    let added = 0;
    let skipped = 0;
    for (const r of incoming) {
      const tagged = stamp(r);
      const key = rowMatchKey(tagged);
      if (map.has(key)) {
        skipped++;
        continue;
      }
      map.set(key, tagged);
      added++;
    }
    void analysis;

    const nextRows = Array.from(map.values());
    setRows(nextRows);
    recomputeDirty(nextRows);

    toast({
      title: "CSV applied",
      description: `${added} added, ${skipped} skipped (already existed). Click Save to persist.`,
    });
  };

  // ---------- Save ----------
  // Backend deletes (adapter, client) rows and re-inserts everything we send,
  // so we always send the FULL current table — never just dirty rows.
  const persist = useCallback(async () => {
    setSaving(true);
    try {
      const res = await bulkInsertSpanLoss(vendor, rows, { client });
      originalRef.current = new Map(
        rows.map((r) => [rowMatchKey(r), { ...r }]),
      );
      setDirtyKeys(new Set());
      toast({
        title: "Saved",
        description: `${res.saved} row(s) sent for ${vendor}/${client}. ${res.message}`,
      });
    } catch (err) {
      toast({
        title: "Save failed",
        description: String((err as Error).message ?? err),
        variant: "destructive",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }, [rows, vendor, client, toast]);

  const handleSave = async () => {
    if (dirtyKeys.size === 0) {
      toast({ title: "Nothing to save", description: "No changes detected." });
      return;
    }
    try {
      await persist();
    } catch {
      /* toast already shown */
    }
  };

  const handleResetChanges = () => {
    if (dirtyKeys.size === 0) return;
    const restored = rows
      .filter((r) => originalRef.current.has(rowMatchKey(r)))
      .map((r) => originalRef.current.get(rowMatchKey(r)) ?? r);
    setRows(restored);
    setDirtyKeys(new Set());
    toast({
      title: "Changes reverted",
      description: `Reset ${vendor}/${client} to last loaded data.`,
    });
  };

  // const handleExportCsv = () => {
  //   downloadCsv(
  //     `spanloss-${vendor}-${client || 'client'}-${new Date().toISOString().slice(0, 10)}.csv`,
  //     rowsToCsv(rows),
  //   );
  // };

  const handleExportCsv = () => {
    // Clone and escape the port strings to prevent Excel date auto-formatting
    const exportData = rows.map((row) => ({
      ...row,
      // Wrapping in ="..." forces Excel to evaluate the cell as a literal text string
      portA: row.portA ? `="${row.portA}"` : row.portA,
      portB: row.portB ? `="${row.portB}"` : row.portB,
    }));

    downloadCsv(
      `spanloss-${vendor}-${client || "client"}-${new Date().toISOString().slice(0, 10)}.csv`,
      rowsToCsv(exportData),
    );
  };

  const dirtyCount = dirtyKeys.size;
  const existingKeys = useMemo(
    () => new Set(rows.map((r) => rowMatchKey(r))),
    [rows],
  );
  const clients = clientsByVendor[vendor] ?? [];
  const headerGradient = `linear-gradient(90deg, ${vendorColor}1A 0%, ${vendorColor}08 60%, transparent 100%)`;

  return (
    <>
      <UnsavedChangesGuard when={dirtyCount > 0} onSave={persist} />

      <Box
        sx={{
          height: "calc(100vh - 2.3rem)",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 2,
          bgcolor: "background.default",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              pr: 1.5,
              background: headerGradient,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <VendorTabs
                value={vendor}
                onChange={handleVendorChange}
                disabled={loading || saving}
              />
            </Box>

            <Stack
              direction="row"
              gap={0.75}
              alignItems="center"
              sx={{ py: 0.75 }}
            >
              <Chip
                size="small"
                label={`${rows.length} rows`}
                variant="outlined"
                sx={{ fontWeight: 600, height: 26 }}
              />
              <Chip
                size="small"
                label={dirtyCount > 0 ? `${dirtyCount} unsaved` : "All saved"}
                color={dirtyCount > 0 ? "warning" : "success"}
                variant={dirtyCount > 0 ? "filled" : "outlined"}
                sx={{ fontWeight: 700, height: 26 }}
              />
              {dirtyCount > 0 && (
                <Tooltip title="On Save, the backend will replace all rows for this vendor + client with the current table.">
                  <Chip
                    size="small"
                    label="will replace on save"
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 700, height: 26 }}
                  />
                </Tooltip>
              )}
              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 0.5, my: 0.75 }}
              />

              <Tooltip title="Validation rules & assumptions">
                <IconButton
                  size="small"
                  onClick={(e) => setInfoAnchor(e.currentTarget)}
                >
                  <InfoIcon size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add row">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => setAddOpen(true)}
                    disabled={loading || saving || !client}
                  >
                    <PlusIcon size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Import CSV">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => setImportOpen(true)}
                    disabled={loading || saving || !client}
                  >
                    <UploadIcon size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Download table as CSV">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleExportCsv}
                    disabled={rows.length === 0}
                  >
                    <DownloadIcon size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Refresh">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => loadRecords(vendor, client)}
                    disabled={loading || saving || !client}
                  >
                    <RefreshIcon size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Reset unsaved changes">
                <span>
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={handleResetChanges}
                    disabled={dirtyCount === 0 || saving}
                  >
                    <RestartAltIcon size={18} />
                  </IconButton>
                </span>
              </Tooltip>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 0.5, my: 0.75 }}
              />

              <Button
                size="small"
                variant="contained"
                startIcon={<SaveIcon size={16} />}
                onClick={handleSave}
                disabled={dirtyCount === 0 || saving}
                sx={{
                  bgcolor: vendorColor,
                  textTransform: "none",
                  fontWeight: 700,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: vendorColor,
                    opacity: 0.9,
                    boxShadow: "none",
                  },
                }}
              >
                {saving
                  ? "Saving…"
                  : `Save${dirtyCount > 0 ? ` (${dirtyCount})` : ""}`}
              </Button>
            </Stack>
          </Box>

          {/* Client sub-tabs (one per client returned by the vendor's clients endpoint) */}
          <ClientTabs
            clients={clients}
            value={client}
            loading={clientsLoading}
            disabled={loading || saving}
            accentColor={vendorColor}
            onChange={handleClientChange}
          />

          <Box
            sx={{
              p: 1.5,
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SpanLossTable
              rows={rows}
              loading={loading}
              dirtyIds={dirtyKeys}
              onRowEdit={handleRowEdit}
              vendorColor={vendorColor}
            />
          </Box>
        </Paper>
      </Box>

      <AddRowDialog
        open={addOpen}
        vendor={vendor}
        existingKeys={existingKeys}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddRow}
      />
      <CsvImportDialog
        open={importOpen}
        vendor={vendor}
        client={client}
        existingRows={rows}
        onClose={() => setImportOpen(false)}
        onImport={handleCsvImport}
      />

      <Popover
        open={Boolean(infoAnchor)}
        anchorEl={infoAnchor}
        onClose={() => setInfoAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ p: 2, maxWidth: 340 }}>
          <Typography
            variant="caption"
            component="div"
            sx={{ color: "text.secondary", lineHeight: 1.6 }}
          >
            • <b>Fiber Distance (km)</b> cannot be negative.
            <br />
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
