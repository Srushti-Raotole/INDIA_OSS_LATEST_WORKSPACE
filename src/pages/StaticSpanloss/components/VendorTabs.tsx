import { Tabs, Tab, Box } from '@mui/material';
import { SPAN_LOSS_VENDORS, type SpanLossVendor } from '../services/spanLossApi';
import { getVendorColor } from '../constants/vendorColors';

interface VendorTabsProps {
  value: SpanLossVendor;
  onChange: (vendor: SpanLossVendor) => void;
  disabled?: boolean;
}

export function VendorTabs({ value, onChange, disabled }: VendorTabsProps) {
  const activeColor = getVendorColor(value);
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={value}
        onChange={(_, v) => onChange(v as SpanLossVendor)}
        variant="scrollable"
        scrollButtons="auto"
        TabIndicatorProps={{ style: { backgroundColor: activeColor, height: 3 } }}
      >
        {SPAN_LOSS_VENDORS.map((v) => {
          const color = getVendorColor(v);
          const selected = v === value;
          return (
            <Tab
              key={v}
              label={v}
              value={v}
              disabled={disabled}
              sx={{
                fontWeight: 700,
                fontSize: '0.85rem',
                minWidth: 90,
                textTransform: 'none',
                color: selected ? color : 'text.secondary',
                '&.Mui-selected': { color },
                '&:hover': { color, opacity: 0.85 },
                borderBottom: selected ? `0px solid ${color}` : 'none',
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
}
