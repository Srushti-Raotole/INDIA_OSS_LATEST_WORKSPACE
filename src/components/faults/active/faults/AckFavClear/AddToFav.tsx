import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, TextField, Autocomplete, Chip,
  Typography, Divider, Tooltip, CircularProgress, Snackbar, Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Balanced Project Standard MUI v5 Core Layout Engine Import
import axiosClient from "@/api/axiosClient";
import {
  CREATE_OR_UPDATE_FAV_GROUP,
  DISTINCT_Adapter_LIST_API,
  DISTINCT_GROUP_TRAP_Adapter_LIST_API,
  DISTINCT_TRAP_TYPES_LIST_API,
} from "@/api/apis";

/** ---------- Types & Helpers ---------- */
export type IdLabel = { id: string; label: string };

type GroupTrap = {
  groupName: string;
  combinedTraptypes: string[];
  combinedAdapters: string[];
};

export type ApplyPayload = {
  groupIds: string[];
  adapters: string[];
  trapTypes: string[];
};

export interface AddToFavContentProps {
  onApplied?: (payload: ApplyPayload) => void;
  onCleared?: () => void;
}

const mapIdLabel = (x: any, nameKey = 'name', idKey = 'id'): IdLabel => ({
  id: String(x?.[idKey] ?? x?.id ?? x?.value ?? x),
  label: String(x?.[nameKey] ?? x?.label ?? x?.toString?.() ?? x),
});

const toIdLabelsFromStrings = (arr: unknown): IdLabel[] =>
  Array.isArray(arr)
    ? (arr as unknown[])
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
      .map((s: any) => ({ id: String(s), label: String(s) }))
    : [];

const uniqueSorted = (arr: string[]) =>
  Array.from(new Set(arr.filter(Boolean).map((s) => s.trim()))).sort();

const ensureOptionsContain = (opts: IdLabel[], neededIds: string[]): IdLabel[] => {
  const have = new Set(opts.map((o) => o.id));
  const missing = neededIds.filter((id) => !have.has(id)).map((id) => ({ id, label: id }));
  return [...opts, ...missing];
};

const csv = (items: IdLabel[]) => items.map((x) => x.id).join(',');

const API = {
  adapters: DISTINCT_Adapter_LIST_API,
  alarms: DISTINCT_TRAP_TYPES_LIST_API,
  groups: DISTINCT_GROUP_TRAP_Adapter_LIST_API,
  createOrUpdate: CREATE_OR_UPDATE_FAV_GROUP,
};

const AddToFavContent: React.FC<AddToFavContentProps> = ({
  onApplied,
  onCleared,
}) => {
  const fieldSx = { width: '100%' };

  /** UI States */
  const [groupName, setGroupName] = useState('');
  const [adapterOptions, setAdapterOptions] = useState<IdLabel[]>([]);
  const [selAdapters, setSelAdapters] = useState<IdLabel[]>([]);
  const [alarmOptions, setAlarmOptions] = useState<IdLabel[]>([]);
  const [selAlarms, setSelAlarms] = useState<IdLabel[]>([]);
  const [groupOptions, setGroupOptions] = useState<IdLabel[]>([]);
  const [selGroups, setSelGroups] = useState<IdLabel[]>([]);
  const [groupsRaw, setGroupsRaw] = useState<GroupTrap[]>([]);

  /** Loading Flags */
  const [loadingAdapters, setLoadingAdapters] = useState(false);
  const [loadingAlarms, setLoadingAlarms] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);

  /** Action Busy Flags */
  const [busySaveUpdate, setBusySaveUpdate] = useState(false);
  const [busyApply, setBusyApply] = useState(false);
  const [busyEdit, setBusyEdit] = useState(false);
  const [busyClear, setBusyClear] = useState(false);

  /** Snackbar Notification State */
  const [snack, setSnack] = useState<{ open: boolean; msg: string; type: 'success' | 'error' | 'info' | 'warning' }>(
    { open: false, msg: '', type: 'info' }
  );
  const notify = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') =>
    setSnack({ open: true, msg, type });

  /** ========== Derived Layout Selectors ========== */
  const groupIndex = useMemo(() => {
    const m = new Map<string, GroupTrap>();
    for (const g of groupsRaw) m.set(g.groupName, g);
    return m;
  }, [groupsRaw]);

  const isUpdateMode = useMemo(() => groupIndex.has(groupName.trim()), [groupIndex, groupName]);

  const canSaveOrUpdate = useMemo(
    () => groupName.trim().length > 0 && selAdapters.length > 0 && selAlarms.length > 0,
    [groupName, selAdapters, selAlarms]
  );

  const selectedGroupsAdapters = useMemo(() => {
    const all: string[] = [];
    for (const g of selGroups) {
      const hit = groupIndex.get(g.id);
      if (hit?.combinedAdapters?.length) all.push(...hit.combinedAdapters);
    }
    return uniqueSorted(all);
  }, [selGroups, groupIndex]);

  const selectedGroupsTraptypes = useMemo(() => {
    const all: string[] = [];
    for (const g of selGroups) {
      const hit = groupIndex.get(g.id);
      if (hit?.combinedTraptypes?.length) all.push(...hit.combinedTraptypes);
    }
    return uniqueSorted(all);
  }, [selGroups, groupIndex]);

  const populateFromGroup = (gName: string) => {
    const g = groupIndex.get(gName);
    if (!g) return;
    setAdapterOptions((opts) => ensureOptionsContain(opts, g.combinedAdapters ?? []));
    setAlarmOptions((opts) => ensureOptionsContain(opts, g.combinedTraptypes ?? []));
    setGroupName(g.groupName);
    setSelAdapters((g.combinedAdapters ?? []).map((id) => ({ id, label: id })));
    setSelAlarms((g.combinedTraptypes ?? []).map((id) => ({ id, label: id })));
  };

  /** ========== Data Fetching Lifecycles ========== */
  useEffect(() => {
    const loadAdapters = async () => {
      setLoadingAdapters(true);
      try {
        const res = await axiosClient.get(`${API.adapters}`);
        const data = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
        const opts = typeof data?.[0] === 'string'
          ? toIdLabelsFromStrings(data)
          : data.map((x: any) => mapIdLabel(x, 'name', 'id'));
        setAdapterOptions(opts);
      } catch {
        setAdapterOptions([]);
        notify('Failed to load adapters', 'error');
      } finally {
        setLoadingAdapters(false);
      }
    };
    loadAdapters();
  }, []);

  useEffect(() => {
    if (selAdapters.length === 0) return;
    const loadAlarms = async () => {
      setAlarmOptions([]);
      setLoadingAlarms(true);
      try {
        const res = await axiosClient.get(`${API.alarms}`, {
          params: { selectedAdaptors: selAdapters.map(s => s.label).join(',') }
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
        const opts = typeof data?.[0] === 'string'
          ? toIdLabelsFromStrings(data)
          : data.map((x: any) => mapIdLabel(x, 'name', 'id'));
        setAlarmOptions(opts);
      } catch {
        setAlarmOptions([]);
        notify('Failed to load alarms', 'error');
      } finally {
        setLoadingAlarms(false);
      }
    };
    loadAlarms();
  }, [selAdapters]);

  const loadGroupsList = async () => {
    setLoadingGroups(true);
    try {
      const res = await axiosClient.get(`${API.groups}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      setGroupsRaw((data ?? []) as GroupTrap[]);
      setGroupOptions(
        (data as GroupTrap[]).filter((g) => g?.groupName).map((g) => ({ id: g.groupName, label: g.groupName }))
      );
    } catch {
      setGroupsRaw([]);
      setGroupOptions([]);
      notify('Failed to load filter groups list', 'error');
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    loadGroupsList();
  }, []);

  /** ========== Execution Actions Callbacks ========== */
  const handleSaveOrUpdate = async () => {
    if (!canSaveOrUpdate) return notify('Please enter a group name and choose active properties.', 'warning');
    setBusySaveUpdate(true);
    try {
      const payload = {
        groupName: groupName.trim(),
        adapters: csv(selAdapters),
        trapTypes: csv(selAlarms),
        action: isUpdateMode ? 'update' : 'create',
      };
      const response = await axiosClient.post(API.createOrUpdate, payload);
      if (response.status === 200 || response.status === 201) {
        notify(isUpdateMode ? 'Group updated successfully' : 'Group saved successfully', 'success');
        await loadGroupsList(); // Refresh saved groups inventory
      }
    } catch (e: any) {
      notify(e?.message ?? 'Action failed', 'error');
    } finally {
      setBusySaveUpdate(false);
    }
  };

  const handleApply = async () => {
    if (!selGroups.length) return notify('Select at least one group to apply.', 'warning');
    setBusyApply(true);
    try {
      onApplied?.({
        groupIds: selGroups.map((g) => g.id),
        adapters: selectedGroupsAdapters,
        trapTypes: selectedGroupsTraptypes,
      });
      notify('Filter applied to side monitor tables.', 'success');
    } catch (e: any) {
      notify(e?.message ?? 'Apply failed', 'error');
    } finally {
      setBusyApply(false);
    }
  };

  const handleEdit = () => {
    if (!selGroups.length) return notify('Choose a group profile row above to edit.', 'warning');
    setBusyEdit(true);
    try {
      populateFromGroup(selGroups[0].id);
      notify('Group configurations loaded down into editor form.', 'info');
    } finally {
      setBusyEdit(false);
    }
  };

  const handleClearGroup = () => {
    setBusyClear(true);
    try {
      onCleared?.();
      setSelGroups([]);
      notify('Active sidebar profile filters cleared.', 'success');
    } finally {
      setBusyClear(false);
    }
  };

  return (
    <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* ================= PANEL 1: PROFILE MANAGEMENT CREATOR / EDITOR ================= */}
      <Box sx={{ p: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>
          Create or Update Favorite Group
        </Typography>

        <Grid container spacing={1.5} alignItems="center" style={{ width: '100%', margin: 0 }}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              size="small"
              sx={fieldSx}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Autocomplete
              multiple
              options={adapterOptions}
              value={selAdapters}
              onChange={(_, v) => setSelAdapters(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disableCloseOnSelect
              loading={loadingAdapters}
              size="small"
              sx={{
                width: '100%', // Ensures it fills the Grid item
                minWidth: '130px', // Forces a minimum width if needed
                '& .MuiOutlinedInput-root': {
                  width: '100%',
                }
              }}
              getOptionLabel={(o) => o.label}
              renderTags={(value, getTagProps) =>
                value.map((opt, i) => (
                  <Chip key={opt.id} label={opt.label} size="small" {...getTagProps({ index: i })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Adapters"
                  placeholder="Select"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingAdapters ? <CircularProgress size={14} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              options={alarmOptions}
              value={selAlarms}
              onChange={(_, v) => setSelAlarms(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disableCloseOnSelect
              loading={loadingAlarms}
              size="small"
              getOptionLabel={(o) => o.label}
              sx={{
                width: '100%', // Ensures it fills the Grid item
                minWidth: '220px', // Forces a minimum width if needed
                '& .MuiOutlinedInput-root': {
                  width: '100%',
                }
              }}
              renderTags={(value, getTagProps) =>
                value.map((opt, i) => (
                  <Chip variant="outlined" key={opt.id} label={opt.label} size="small" {...getTagProps({ index: i })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Alarms"
                  placeholder="Select"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingAlarms ? <CircularProgress size={14} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSaveOrUpdate}
              disabled={busySaveUpdate || !canSaveOrUpdate}
              sx={{
                backgroundColor: '#0f766e',
                '&:hover': { backgroundColor: '#115e59' },
                height: 38,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none'
              }}
            >
              {busySaveUpdate ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : (isUpdateMode ? 'Update Group' : 'Save Group')}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* ================= PANEL 2: PRESET LOADER ACTION DISPATCHER ================= */}
      <Box sx={{ p: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>
          Apply Saved Favorites Filter
        </Typography>

        <Grid container spacing={1.5} alignItems="center" style={{ width: '100%', margin: 0 }}>
          <Grid item xs={12} md={7}>
            <Autocomplete
              multiple
              options={groupOptions}
              value={selGroups}
              onChange={(_, v) => setSelGroups(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disableCloseOnSelect
              loading={loadingGroups}
              size="small"
              sx={{
                width: '100%', // Ensures it fills the Grid item
                minWidth: '250px', // Forces a minimum width if needed
                '& .MuiOutlinedInput-root': {
                  width: '100%',
                }
              }}
              getOptionLabel={(o) => o.label}
              renderTags={(value, getTagProps) =>
                value.map((opt, i) => (
                  <Chip key={opt.id} label={opt.label} size="small" {...getTagProps({ index: i })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Groups"
                  placeholder="Choose presets"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingGroups ? <CircularProgress size={14} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={5} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleApply}
              disabled={busyApply || !selGroups.length}
              sx={{ backgroundColor: '#0f766e', '&:hover': { backgroundColor: '#115e59' }, height: 38, textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
            >
              Apply Filter
            </Button>

            <Button
              variant="outlined"
              onClick={handleEdit}
              disabled={busyEdit || !selGroups.length}
              sx={{ height: 38, textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#475569', backgroundColor: '#ffffff' }}
            >
              Edit
            </Button>

            <Button
              variant="outlined"
              color="error"
              onClick={handleClearGroup}
              disabled={busyClear || !selGroups.length}
              sx={{ height: 38, textTransform: 'none', fontWeight: 600, backgroundColor: '#ffffff' }}
            >
              Clear Filter
            </Button>
          </Grid>
        </Grid>

        {/* Dynamic preview block */}
        <Box sx={{ mt: 2, p: 1.25, backgroundColor: '#ffffff', borderRadius: 1.5, border: '1px solid #f1f5f9' }}>
          <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.72rem', color: '#64748b' }}>
            <strong>Targeting Groups:</strong>{' '}
            {selGroups.length ? selGroups.map((g) => g.label).join(', ') : <em>None Selected</em>}
          </Typography>

          <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.72rem', color: '#64748b' }}>
            <strong>Adapters Evaluated:</strong>{' '}
            {selectedGroupsAdapters.length ? selectedGroupsAdapters.join(', ') : <em>None</em>}
          </Typography>

          <Typography variant="body2" sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            <strong>Alarms Tracked:</strong>{' '}
            {selectedGroupsTraptypes.length ? selectedGroupsTraptypes.join(', ') : <em>None</em>}
          </Typography>
        </Box>
      </Box>

      {/* Toast Feedbacks Alerts */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.type} variant="filled" sx={{ width: '100%', fontSize: '0.75rem' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddToFavContent;