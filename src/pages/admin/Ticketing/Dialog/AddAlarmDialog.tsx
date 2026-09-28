import React from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  MenuItem, 
  Box, 
  CircularProgress, 
  Autocomplete 
} from "@mui/material";
import axiosClient from "@/api/axiosClient";
import { FETCH_TICKETING_ALARM_LIST } from "@/api/apis";

const ADAPTERS = ["CONC", "ADVA", "NFMT", "IFNR", "TLMR", "EPNM", "MCP"];
const FAMILY_MAP: Record<string, string> = {
  CONC: "CISCO", TLMR: "CISCO", EPNM: "CISCO", IFNR: "INFINERA", ADVA: "ADVA", "MCP": "CIENA", NFMT: "NOKIA",
};

interface FormState {
  adapter: string;
  family: string;
  alarm: string;
  treatedAction: string;
  persistenceTime: number;
  shortPeriod: number;
  shortRepetition: number;
}

const AddAlarmDialog: React.FC<any> = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = React.useState<FormState>({ 
    adapter: "", 
    family: "", 
    alarm: "", 
    treatedAction: "N", 
    persistenceTime: 0, 
    shortPeriod: 0, 
    shortRepetition: 0 
  });
  const [alarmOptions, setAlarmOptions] = React.useState<string[]>([]);
  const [loadingAlarms, setLoadingAlarms] = React.useState(false);

  // Sync family map and reset alarm selection when adapter changes
  React.useEffect(() => {
    if (form.adapter) {
      setForm(prev => ({ ...prev, family: FAMILY_MAP[form.adapter] || "", alarm: "" }));
      setAlarmOptions([]);
    }
  }, [form.adapter]);

  // Fetch alarms from API
  React.useEffect(() => {
    if (!form.adapter || !form.family) return;
    const fetchAlarms = async () => {
      setLoadingAlarms(true);
      try {
        const res = await axiosClient.get(FETCH_TICKETING_ALARM_LIST, {
          params: { adapter: form.adapter, family: form.family } 
        });
        setAlarmOptions(res.data || []);
      } catch { 
        setAlarmOptions([]); 
      } finally { 
        setLoadingAlarms(false); 
      }
    };
    fetchAlarms();
  }, [form.adapter, form.family]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>Add Alarm Rule</DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 1 }}>
          
          {/* Adapter Dropdown */}
          <TextField 
            select 
            size="small" 
            label="Adapter" 
            fullWidth 
            value={form.adapter} 
            onChange={(e) => setForm(f => ({ ...f, adapter: e.target.value }))}
          >
            {ADAPTERS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </TextField>

          {/* Family Read-Only Field */}
          <TextField size="small" label="Family" fullWidth value={form.family} disabled />

          {/* Searchable, Scrollable, and Customizable Alarm Autocomplete */}
          <Autocomplete
            freeSolo
            size="small"
            options={alarmOptions}
            loading={loadingAlarms}
            disabled={!form.adapter}
            value={form.alarm}
            // Handles item selection from the list
            onChange={(_, newValue) => {
              setForm(f => ({ ...f, alarm: newValue || "" }));
            }}
            // Handles user typing custom text strings
            onInputChange={(_, newInputValue) => {
              setForm(f => ({ ...f, alarm: newInputValue || "" }));
            }}
            sx={{ gridColumn: "span 2" }}
            slotProps={{
              paper: {
                sx: {
                  maxHeight: 250,
                  "& .MuiAutocomplete-listbox": {
                    maxHeight: 250,
                  }
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Alarm"
                required
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingAlarms ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Performance Rules Parameters */}
          <TextField size="small" type="number" label="Persistence (s)" fullWidth value={form.persistenceTime} onChange={(e) => setForm(f => ({ ...f, persistenceTime: Number(e.target.value) }))} />
          <TextField size="small" type="number" label="Short Period" fullWidth value={form.shortPeriod} onChange={(e) => setForm(f => ({ ...f, shortPeriod: Number(e.target.value) }))} />
          <TextField size="small" type="number" label="Short Repetition" fullWidth value={form.shortRepetition} onChange={(e) => setForm(f => ({ ...f, shortRepetition: Number(e.target.value) }))} />
          
          {/* Status Dropdown */}
          <TextField select size="small" label="Treated" fullWidth value={form.treatedAction} onChange={(e) => setForm(f => ({ ...f, treatedAction: e.target.value }))}>
            <MenuItem value="Y">YES</MenuItem>
            <MenuItem value="N">NO</MenuItem>
          </TextField>

        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button 
          variant="contained" 
          onClick={() => onSubmit(form)} 
          disabled={!form.adapter || !form.alarm.trim()} 
          sx={{ bgcolor: "#354a6b", "&:hover": { bgcolor: "#283852" } }}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAlarmDialog;