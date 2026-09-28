import Grid from '@mui/material/Grid';
import { Box, Typography } from '@mui/material';
import styled from '@emotion/styled';
import { DynamicTableRow } from '../../../../store/types';

const StatusCard = styled(Box)(() => ({
  backgroundColor: '#455a64',
  borderRadius: '1.5vh',
  padding: '1vh 0.6vw',
  minWidth: '9vw',
  textAlign: 'center' as const,
}));

// Ticket State based chip colors
type TicketState = 'Open' | 'Resolved' | 'Creation failed' | 'Resolution failed';
type ChipColor = TicketState | 'default';

const StatusChip = styled('div')<{
  chipcolor?: ChipColor;
  selected?: boolean;
  disabled?: boolean;
}>(({ chipcolor = 'default', selected = false, disabled = false }) => ({
  minWidth: '2.5vw',
  height: '3vh',
  fontSize: '1.7vh',
  fontWeight: 'bold',
  borderRadius: '1vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  cursor: disabled ? 'not-allowed' : 'pointer',
  pointerEvents: disabled ? 'none' : 'auto',
  opacity: disabled ? 0.45 : 1,

  border: selected ? '0.1vw solid white' : 'none',

  //  Colours matching table Ticket State colors
  ...(chipcolor === 'Resolved' && {
    backgroundColor: '#d4edda !important',
    color: '#155724',
  }),
  ...(chipcolor === 'Creation failed' && {
    backgroundColor: '#f8d7da !important',
    color: '#721c24',
  }),
  ...(chipcolor === 'Open' && {
    backgroundColor: '#ffe5b4 !important',
    color: '#856404',
  }),
  ...(chipcolor === 'default' && {
    backgroundColor: '#b0ababff',
    color: 'white',
  }),
}));

// Table field keys
const F = { TRAP_SOURCE: 'Adapter', TICKET_STATE: 'Ticket State' };
const NORM = (v?: string | null) => (v ?? '').toString().trim();
const NORM_UP = (v?: string | null) => NORM(v).toUpperCase();

// Ticket State normalizer – string -> exact TicketState label
const normStateForChip = (s?: string | null): TicketState | 'UNKNOWN' => {
  const u = NORM_UP(s);
  if (u === 'OPEN') return 'Open';
  if (u === 'RESOLVED') return 'Resolved';
  if (u === 'CREATION FAILED') return 'Creation failed';
  if (u === 'RESOLUTION FAILED') return 'Creation failed';
  return 'UNKNOWN';
};

interface AlarmSummaryCardsProps {
  tableData: DynamicTableRow[];
  // alarmSeveritySelected store state of ticket: 'ALL' | 'Open' | 'Resolved' | 'Creation failed'
  alarmSeveritySelected: string;
  setAlarmSeveritySelected: (severity: string) => void;
  alarmSourceSelected: string; // 'ALL' | 'MCP' | 'NEC'
  setAlarmSourceSelected: (src: string) => void;
}

/** Center title + right count header (count clickable) */
const HeaderRow = ({
  title,
  total,
  onTotalClick,
}: {
  title: string;
  total: number;
  onTotalClick?: () => void;
}) => (
  <Box
    sx={{
      position: 'relative',
      mb: '0.5vh',
      px: '0.2vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '2.2vh',
    }}
  >
    {/* Title center */}
    <Box
      onClick={total > 0 ? onTotalClick : undefined}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6vw',
        px: "0.4vw",
        py: "0.1vh",
        borderRadius: '1vh',
        cursor: total > 0 ? 'pointer' : 'not-allowed',
        pointerEvents: total > 0 ? 'auto' : 'none',
        opacity: total > 0 ? 1 : 0.45,
        userSelect: 'none',

        backgroundColor: 'rgba(255,255,255,0.15)',
        transition: 'all 0.15s ease',

        '&:hover': total > 0
          ? { backgroundColor: 'rgba(255,255,255,0.28)' }
          : undefined,

        '&:active': total > 0
          ? {
            backgroundColor: 'rgba(255,255,255,0.35)',
            transform: 'scale(0.94)',
          }
          : undefined,
      }}
    >
      {/* Title */}
      <Typography
        variant="body2"
        sx={{
          color: '#ffffff',
          fontSize: '1.6vh',
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </Typography>

      {/* Count */}
      <Box
        sx={{
          px: "0.1vw",
          py: "0.01vh",
          borderRadius: '1vh',
          fontSize: '1.8vh',
          fontWeight: 700,
          color: '#ffffff',
          // backgroundColor: 'rgba(255,255,255,0.25)',
          minWidth: '2.5ch',
          textAlign: 'center',
        }}
      >
        {total}
      </Box>
    </Box>

  </Box>
);

function AlarmSummaryCardsInsideSidebarTicketing({
  tableData,
  alarmSeveritySelected,
  setAlarmSeveritySelected,
  alarmSourceSelected,
  setAlarmSourceSelected,
}: AlarmSummaryCardsProps) {
  // const PRESET_SOURCES = ['MCP', 'NFMT'] as const;
  const PRESET_SOURCES = ['CONC', 'ADVA', 'IFNR', 'TLMR', 'EPNM', 'MCP', 'NFMT'] as const;
  const TICKET_STATES: TicketState[] = ['Open', 'Resolved', 'Creation failed'];

  // overall total count
  const overallTotal = tableData?.length ?? 0;

  function groupBySourceAndState(data: DynamicTableRow[]) {
    return data.reduce(
      (acc, trap) => {
        const source = NORM_UP(trap[F.TRAP_SOURCE] as string) || 'UNKNOWN';
        const st = normStateForChip(trap[F.TICKET_STATE] as string);
        if (st === 'UNKNOWN') return acc; // unknown state ignore

        if (!acc[source]) acc[source] = {} as Record<TicketState, number>;
        if (!acc[source][st]) acc[source][st] = 0;
        acc[source][st] += 1;
        return acc;
      },
      {} as Record<string, Record<TicketState, number>>,
    );

  }

  const grouped = groupBySourceAndState(tableData);

  // Overall counts (sum across all sources actually present in data)
  const overallCounts = TICKET_STATES.map((st) =>
    Object.values(grouped).reduce(
      (sum, stateMap) => sum + (stateMap[st] ?? 0),
      0,
    ),
  );

  // helper to reset filters
  const resetToAll = (source: string) => {
    // Ticket State = ALL, Source = given
    setAlarmSeveritySelected('ALL');
    setAlarmSourceSelected(source);
  };

  return (
    <Grid
      container
      spacing="1vh"
      justifyContent="flex-end"
      alignItems="center"
      sx={{ p: '1vh' }}
    >
      {/* Overall - All Sources */}
      <Grid size={{ xs: 12, sm: 6, md: 12 }}>


        <StatusCard>
          {/* Center All Sources + right count (click => show ALL, only if total > 0) */}
          <HeaderRow
            title="All Sources"
            total={overallTotal}
            onTotalClick={() => resetToAll('ALL')}
          />

          <Grid container spacing="0.5vh" justifyContent="center">
            {TICKET_STATES.map((st, i) => (
              <Grid size={{ xs: 4 }} key={`ALL-${st}`}>
                <StatusChip
                  disabled={overallCounts[i] === 0}
                  onClick={() => {
                    const isSelected =
                      alarmSeveritySelected === st &&
                      alarmSourceSelected === 'ALL';

                    if (isSelected) {
                      // same chip dubara click => full reset
                      resetToAll('ALL');
                    } else {
                      setAlarmSeveritySelected(st); // Ticket State: 'Open' | 'Resolved' | 'Creation failed'
                      setAlarmSourceSelected('ALL');
                    }
                  }}
                  selected={
                    alarmSeveritySelected === st &&
                    alarmSourceSelected === 'ALL'
                  }
                  chipcolor={overallCounts[i] > 0 ? st : 'default'}
                >
                  {overallCounts[i]}
                </StatusChip>
              </Grid>
            ))}
          </Grid>
        </StatusCard>
      </Grid>

      {/* Per-source cards */}
      {PRESET_SOURCES.map((source) => {
        const stateMap = grouped[source] ?? ({} as Record<TicketState, number>);
        const counts = TICKET_STATES.map((st) => stateMap[st] ?? 0);
        const sourceTotal = counts.reduce((a, b) => a + b, 0);

        return (
          <Grid size={{ xs: 12, sm: 6, md: 12 }} key={source}>
            <StatusCard>
              {/* Center source + right count (click => ALL states of this source, only if > 0) */}
              <HeaderRow
                title={source}
                total={sourceTotal}
                onTotalClick={() => resetToAll(source)}
              />

              <Grid container spacing="0.5vh" justifyContent="center">
                {TICKET_STATES.map((st, i) => {
                  const isSelected =
                    alarmSeveritySelected === st &&
                    alarmSourceSelected === source;
                  const count = counts[i];

                  return (
                    <Grid size={{ xs: 4 }} key={`${source}-${st}`}>
                      <StatusChip
                        disabled={count === 0}
                        selected={isSelected}
                        onClick={() => {
                          if (isSelected) {
                            // same chip again => reset
                            resetToAll('ALL');
                          } else {
                            setAlarmSeveritySelected(st); // Ticket State
                            setAlarmSourceSelected(source); // Source: MCP/NEC
                          }
                        }}
                        chipcolor={count > 0 ? st : 'default'}
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
export default AlarmSummaryCardsInsideSidebarTicketing;
