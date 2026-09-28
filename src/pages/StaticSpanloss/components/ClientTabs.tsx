import { Tabs, Tab, Box, Skeleton, Typography } from '@mui/material';

interface ClientTabsProps {
  clients: string[];
  value: string;
  loading?: boolean;
  disabled?: boolean;
  accentColor: string;
  onChange: (client: string) => void;
}

export function ClientTabs({
  clients,
  value,
  loading,
  disabled,
  accentColor,
  onChange,
}: ClientTabsProps) {
  if (loading) {
    return (
      <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width={110} height={28} />
        ))}
      </Box>
    );
  }

  if (clients.length === 0) {
    return (
      <Box sx={{ px: 2, py: 1.25 }}>
        <Typography variant="caption" color="text.secondary">
          No clients found for this vendor.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Tabs
        value={clients.includes(value) ? value : clients[0]}
        onChange={(_, v) => onChange(String(v))}
        variant="scrollable"
        scrollButtons="auto"
        TabIndicatorProps={{ style: { backgroundColor: accentColor, height: 2 } }}
      >
        {clients.map((c) => {
          const selected = c === value;
          return (
            <Tab
              key={c}
              label={c}
              value={c}
              disabled={disabled}
              sx={{
                fontWeight: 600,
                fontSize: '0.78rem',
                minHeight: 36,
                py: 0.5,
                textTransform: 'none',
                color: selected ? accentColor : 'text.secondary',
                '&.Mui-selected': { color: accentColor },
                '&:hover': { color: accentColor, opacity: 0.85 },
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
}
