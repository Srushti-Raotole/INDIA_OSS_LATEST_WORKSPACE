
import * as React from 'react';
import { Box, SxProps } from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// enable utc + timezone once
dayjs.extend(utc);
dayjs.extend(timezone);

const IST_TZ = 'Asia/Kolkata';

type Props = {
  fromDate: Date | null;
  toDate: Date | null;
  onChange: (next: { from: Date | null; to: Date | null }) => void;
  sx?: SxProps;
  format?: string; 
  heightPx?: number; 
  fontRem?: number; 
};

const DateTimeRangeCompact: React.FC<Props> = ({
  fromDate,
  toDate,
  onChange,
  sx,
  format = 'YYYY/MM/DD HH:mm:ss', 
  heightPx = 28, // Slightly increased from 20 to 32 so the text isn't vertically crushed
  fontRem = 0.75,
}) => {
  // JS Date -> Dayjs in IST for display
  const toIstDayjs = (d: Date | null): Dayjs | null =>
    d ? dayjs(d).tz(IST_TZ) : null;

  // High-specificity SX targets actual input
  const inputSx = {
    backgroundColor: '#f1f5f9', // Added a slight background to match standard inputs
    borderRadius: '6px',
    '& .MuiOutlinedInput-root': {
      height: heightPx,
      minWidth: '250px', //  FORCES THE INPUT TO BE WIDER
    },
    '& .MuiOutlinedInput-input, & .MuiInputBase-input, & input': {
      fontSize: `${fontRem}rem`,
      padding: '2px 10px',
      lineHeight: 1,
      color: '#334155',
    },
    '& fieldset': {
      border: 'none', // Cleaner look, removes the double border if wrapped
    },
    '& .MuiSvgIcon-root': { fontSize: '1.1rem', color: '#64748b' },
    '& .MuiIconButton-root': { padding: 0.25 },
  } as const;

  const labelSx = {
    fontSize: `${fontRem}rem`,
    top: '-4px', // Adjust label position for compact height
    color: '#64748b',
  } as const;

  const inlineInputStyle: React.CSSProperties = {
    fontSize: `${fontRem}rem`,
    padding: '1px 2px',
    lineHeight: 1,
  };

  const views: readonly any[] = ['year', 'month', 'day', 'hours', 'minutes', 'seconds'];
  const timeSteps = { hours: 1, minutes: 1, seconds: 1 };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1.5, //  Increased gap slightly so they don't touch
          alignItems: 'center',
          ...sx,
        }}
      >
        <DateTimePicker
          label="From (IST)"
          value={toIstDayjs(fromDate)}
          onChange={(v) =>
            onChange({
              from: v ? v.toDate() : null,
              to: toDate,
            })
          }
          format={format}
          timezone={IST_TZ}
          views={views}
          timeSteps={timeSteps}
          ampm={false}
          reduceAnimations
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true, //  Ensures it fills the grid column
              InputProps: { sx: inputSx },
              InputLabelProps: { sx: labelSx },
              inputProps: { style: inlineInputStyle },
            },
            openPickerButton: { sx: { p: 0.25 } },
          }}
        />

        <DateTimePicker
          label="To (IST)"
          value={toIstDayjs(toDate)}
          onChange={(v) =>
            onChange({
              from: fromDate,
              to: v ? v.toDate() : null,
            })
          }
          format={format}
          timezone={IST_TZ}
          views={views}
          timeSteps={timeSteps}
          ampm={false}
          reduceAnimations
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true, //  Ensures it fills the grid column
              InputProps: { sx: inputSx },
              InputLabelProps: { sx: labelSx },
              inputProps: { style: inlineInputStyle },
            },
            openPickerButton: { sx: { p: 0.25 } },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default DateTimeRangeCompact;