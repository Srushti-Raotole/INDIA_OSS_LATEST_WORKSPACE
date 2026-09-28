
import Grid from '@mui/material/Grid';
import { Box, Typography } from '@mui/material';
import styled from '@emotion/styled';
import { DynamicTableRow } from '../../../store/types';

const StatusCard = styled(Box)(() => ({
  backgroundColor: "#7e7d7dff",
  borderRadius: "1.5vh",
  padding: "1vh 0.6vw",
  minWidth: "9vw",
  textAlign: 'center' as const,
}));

const StatusChip = styled('div')<{
  chipcolor?: "Critical" | "Major" | "Minor" | "default";
  selected?: boolean;
}>(({ chipcolor = "default", selected = false }) => ({
  minWidth: "2.5vw", height: "3vh", fontSize: "1.7vh", fontWeight: "bold",
  borderRadius: "1vh", display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", border: selected ? '0.1vw solid white' : 'none',
  ...(chipcolor === "Major" && { backgroundColor: "#e5990cff", color: "white" }),
  ...(chipcolor === "Critical" && { backgroundColor: "#f11212ff", color: "white" }),
  ...(chipcolor === "Minor" && { backgroundColor: "#eed812ff", color: "white" }),
  ...(chipcolor === "default" && { backgroundColor: "#b0ababff", color: "white" }),
}));

// Table field keys
const F = { TRAP_SOURCE: 'Adapter', SEVERITY: 'Severity' };
const NORM = (v?: string | null) => (v ?? '').toString().trim();
const NORM_UP = (v?: string | null) => NORM(v).toUpperCase();

// Map table severity -> chip palette keys
const normSevForChip = (s?: string | null) => {
  const u = NORM_UP(s);
  if (u === 'CRITICAL' || u === 'CRI') return 'Critical';
  if (u === 'MAJOR' || u === 'MAJ') return 'Major';
  if (u === 'MINOR' || u === 'MIN' || u === 'MINORWARN') return 'Minor';
  return NORM(s);
};

interface AlarmSummaryCardsProps {
  tableData: DynamicTableRow[];
  alarmSeveritySelected: string;
  setAlarmSeveritySelected: (severity: string) => void;
  alarmSourceSelected: string;
  setAlarmSourceSelected: (src: string) => void;
}

/**
 * Renders:
 *  - One "All Sources" card (overall totals)
 *  - One card for each PRESET source, even if not present in data (shows 0s)
 */
function AlarmSummaryCards({
  tableData,
  alarmSeveritySelected,
  setAlarmSeveritySelected,
  alarmSourceSelected,
  setAlarmSourceSelected,
}: AlarmSummaryCardsProps) {

  // Preset sources: always show these in this order  
    const PRESET_SOURCES = ['CONC','ADVA','IFNR','TLMR','EPNM','MCP','NFMT'] as const;
  const ALARM_SEVERITIES: Array<'Critical'|'Major'|'Minor'> = ['Critical','Major','Minor'];

  // Build grouped map from data
  function groupBySourceAndSeverity(data: DynamicTableRow[]) {
    return data.reduce((acc, trap) => {
      const source = NORM_UP(trap[F.TRAP_SOURCE] as string) || 'UNKNOWN';
      const sev = normSevForChip(trap[F.SEVERITY] as string) || 'UNKNOWN';
      if (!acc[source]) acc[source] = {};
      if (!acc[source][sev]) acc[source][sev] = 0;
      acc[source][sev] += 1;
      return acc;
    }, {} as Record<string, Record<string, number>>);
  }

  const grouped = groupBySourceAndSeverity(tableData);

  // Overall counts (sum across all sources actually present in data)
  const overallCounts = ALARM_SEVERITIES.map(sev =>
    Object.values(grouped).reduce((sum, sevMap) => sum + (sevMap[sev] ?? 0), 0)
  );

  return (
    <Grid container spacing='1vh' justifyContent="flex-end" alignItems="center" sx={{p:'1vh'}}>
      {/* Overall */}
      <Grid size={{xs:12,sm:6,md:2}} >
        <StatusCard>
          <Typography variant="body2" sx={{ color: '#ffffff', fontSize: "1.6vh", fontWeight: 600, mb: '0.5vh' }}>
            All Adapters
          </Typography>
          <Grid container spacing='0.5vh' justifyContent="center">
            {ALARM_SEVERITIES.map((sev, i) => (
              <Grid  size={{xs:4}} key={`ALL-${sev}`}>
                {/* <Typography variant="caption" sx={{ fontSize: "1.5vh", display: "block", color: "#171616ff" }}>
                  {sev}
                </Typography> */}
                <StatusChip
                  onClick={() => {
                    const next = alarmSeveritySelected === sev ? 'ALL' : sev;
                    setAlarmSeveritySelected(next);
                    setAlarmSourceSelected('ALL'); // reset source when choosing overall
                  }}
                  selected={alarmSeveritySelected === sev && alarmSourceSelected === 'ALL'}
                  chipcolor={overallCounts[i] > 0 ? sev : "default"}
                >
                  {overallCounts[i]}
                </StatusChip>
              </Grid>
            ))}
          </Grid>
        </StatusCard>
      </Grid>

      {/* Per-source: always render PRESET_SOURCES, even if data has none (counts default to 0) */}
      {PRESET_SOURCES.map((source) => {
        const sevMap = grouped[source] ?? {};
        const counts = ALARM_SEVERITIES.map(sev => sevMap[sev] ?? 0);

        return (
          <Grid size={{xs:12,sm:6,md:2}} key={source} >
            <StatusCard>
              <Typography variant="body2" sx={{ color: '#ffffff', fontSize: "1.6vh", fontWeight: 600, mb: '0.5vh' }}>
                {source}
              </Typography>
              <Grid container spacing='0.5vh' justifyContent="center">
                {ALARM_SEVERITIES.map((sev, i) => {
                  const isSelected = alarmSeveritySelected === sev && alarmSourceSelected === source;
                  const count = counts[i];
                  return (
                    <Grid size={{xs:4}} key={`${source}-${sev}`}>
                      {/* <Typography variant="caption" sx={{ fontSize: "1.5vh", display: "block", color: "#171616ff" }}>
                        {sev}
                      </Typography> */}
                      <StatusChip
                        selected={isSelected}
                        onClick={() => {
                          if (isSelected) {
                            setAlarmSeveritySelected('ALL');
                            setAlarmSourceSelected('ALL');
                          } else {
                            setAlarmSeveritySelected(sev);
                            setAlarmSourceSelected(source); // bind severity + source
                          }
                        }}
                        chipcolor={count > 0 ? sev : "default"}
                      >
                        {count}
                      </StatusChip>
                    </Grid>
                  );
                })}
              </Grid>
            </StatusCard>
          </Grid>
        );
      })}
    </Grid>
  );
}
export default AlarmSummaryCards;
