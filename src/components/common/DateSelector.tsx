import { DateRange } from "@mui/x-date-pickers-pro/models";
import { StaticDateRangePicker } from "@mui/x-date-pickers-pro";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
  Box,
  Button,
  Divider,
  Popover,
  Stack,
  Typography,
  styled,
} from "@mui/material";
import { CalendarMonth as CalendarIcon, KeyboardArrowDown as ArrowDownIcon } from "@mui/icons-material";
import { useState } from "react";

const DateFilterButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.75, 2),
  textTransform: "none",
  color: theme.palette.text.primary,
  display: "flex",
  justifyContent: "space-between",
  minWidth: 180,
}));

const DateSelectionChip = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.grey[200],
  borderRadius: "16px",
  padding: theme.spacing(0.75, 2),
  textTransform: "none",
  color: theme.palette.text.primary,
  fontWeight: "normal",
  justifyContent: "flex-start",
  width: "auto",
  marginBottom: theme.spacing(1),
}));

export type DateSelectorVariant = "default" | "managerGlobal";

interface DateSelectorProps {
  dateRange: DateRange<Dayjs>;
  setDateRange: (range: DateRange<Dayjs>) => void;
  handleDateRangeApplyCallback: (range: DateRange<Dayjs>) => void;
  variant?: DateSelectorVariant;
}

const DateSelector = ({
  dateRange,
  setDateRange,
  handleDateRangeApplyCallback,
  variant = "default",
}: DateSelectorProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const getDateRangeText = () => {
    if (dateRange[0] && dateRange[1]) {
      return `${dateRange[0].format("MMM D, YYYY")} - ${dateRange[1].format("MMM D, YYYY")}`;
    }
    if (!dateRange[0] && !dateRange[1]) {
      return "All Time";
    }
    return "Select dates";
  };

  const presets = variant === "managerGlobal"
    ? [
        { label: "Last 7 Days", range: [dayjs().subtract(6, "day"), dayjs()] },
        { label: "Last 30 Days", range: [dayjs().subtract(29, "day"), dayjs()] },
        { label: "Last 90 Days", range: [dayjs().subtract(89, "day"), dayjs()] },
      ]
    : [
        { label: "Today", range: [dayjs(), dayjs()] },
        { label: "Tomorrow", range: [dayjs().add(1, "day"), dayjs().add(1, "day")] },
        { label: "Next 7 Days", range: [dayjs(), dayjs().add(6, "day")] },
        { label: "Next 30 Days", range: [dayjs(), dayjs().add(29, "day")] },
        { label: "All Time", range: [null, null] },
      ];

  const minDate = variant === "managerGlobal" ? dayjs().subtract(89, "day") : undefined;
  const maxDate = variant === "managerGlobal" ? dayjs() : undefined;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePresetClick = (range: DateRange<Dayjs>) => {
    setDateRange(range);
    if (range[0] && range[1]) {
      handleDateRangeApplyCallback(range);
      handleClose();
    }
  };

  const handleApply = () => {
    handleClose();
    handleDateRangeApplyCallback(dateRange);
  };

  return (
    <>
      <DateFilterButton onClick={handleOpen} startIcon={<CalendarIcon />} endIcon={<ArrowDownIcon />}>
        {getDateRangeText()}
      </DateFilterButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ sx: { p: 3, width: "auto", mt: 1, borderRadius: 2 } }}
      >
        <Box sx={{ width: "100%" }}>
          <Typography variant="subtitle2" sx={{ textTransform: "uppercase", color: "text.secondary", fontSize: "0.75rem", mb: 1 }}>
            SELECT DATE RANGE
          </Typography>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: "medium" }}>
            {getDateRangeText()}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Stack spacing={1} alignItems="flex-start">
              {presets.map((p) => (
                <DateSelectionChip key={p.label} onClick={() => handlePresetClick(p.range)}>
                  {p.label}
                </DateSelectionChip>
              ))}
              {variant === "managerGlobal" && (
                <DateSelectionChip onClick={() => setDateRange([null, null])}>
                  Custom
                </DateSelectionChip>
              )}

            </Stack>
            <Divider orientation="vertical" flexItem />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <StaticDateRangePicker
                displayStaticWrapperAs="desktop"
                value={dateRange}
                onChange={(newValue) => setDateRange(newValue)}
                localeText={{ start: "Start", end: "End" }}
                slotProps={{ actionBar: { actions: [] } }}
                minDate={minDate}
                maxDate={maxDate}
              />
            </LocalizationProvider>
          </Stack>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button onClick={handleClose} sx={{ mr: 1 }}>Close</Button>
            <Button variant="contained" onClick={handleApply}>Apply</Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default DateSelector;
