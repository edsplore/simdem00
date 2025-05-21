import { DateRange } from "@mui/x-date-pickers-pro/models";
import { StaticDateRangePicker } from "@mui/x-date-pickers-pro";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import {
  Button,
  styled,
  Box,
  Popover,
  Typography,
  Stack,
  Grid,
} from "@mui/material";
import { useState } from "react";
import { CalendarMonth as CalendarIcon, KeyboardArrowDown as ArrowDownIcon } from "@mui/icons-material";

interface DateSelectorProps {
  dateRange: DateRange<Dayjs>;
  setDateRange: (range: DateRange<Dayjs>) => void;
  handleDateRangeApplyCallback: () => void;
}

const DateFilterButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.75, 2),
  textTransform: "none",
  color: theme.palette.text.primary,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
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
  "&:hover": {
    backgroundColor: theme.palette.grey[300],
  },
  width: "auto",
  marginBottom: "8px",
}));

const DateSelector = ({ dateRange, setDateRange, handleDateRangeApplyCallback }: DateSelectorProps) => {
  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLElement | null>(null);

  const handleDateFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setDateAnchorEl(event.currentTarget);
  };

  const handleDateFilterClose = () => {
    setDateAnchorEl(null);
  };

  const handleDateRangeApply = () => {
    handleDateFilterClose();
    handleDateRangeApplyCallback();
  };

  const handleLast7Days = () => {
    const end = dayjs();
    const start = end.subtract(6, "day");
    setDateRange([start, end]);
  };

  const handleLast30Days = () => {
    const end = dayjs();
    const start = end.subtract(29, "day");
    setDateRange([start, end]);
  };

  const handleLast90Days = () => {
    const end = dayjs();
    const start = end.subtract(89, "day");
    setDateRange([start, end]);
  };

  const getDateRangeText = () => {
    if (dateRange[0] && dateRange[1]) {
      return `${dateRange[0].format("MMM D, YYYY")} - ${dateRange[1].format("MMM D, YYYY")}`;
    }
    return "Select dates";
  };

  const minDate = dayjs().subtract(90, "day");
  const maxDate = dayjs();

  return (
    <>
      <DateFilterButton onClick={handleDateFilterClick} startIcon={<CalendarIcon />} endIcon={<ArrowDownIcon />}>
        {getDateRangeText()}
      </DateFilterButton>
      <Popover
        open={Boolean(dateAnchorEl)}
        anchorEl={dateAnchorEl}
        onClose={handleDateFilterClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ sx: { p: 3, width: "auto", mt: 1, boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)", borderRadius: 2 } }}
      >
        <Box sx={{ width: "100%" }}>
          <Typography variant="subtitle2" sx={{ textTransform: "uppercase", color: "text.secondary", fontSize: "0.75rem", mb: 1 }}>
            SELECT DATE RANGE
          </Typography>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: "medium" }}>
            {dateRange[0] && dateRange[1] ? `${dateRange[0].format("MMM D")} – ${dateRange[1].format("MMM D")}` : "Select dates"}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Stack spacing={1} alignItems="flex-start">
                <DateSelectionChip onClick={handleLast7Days}>Last 7 Days</DateSelectionChip>
                <DateSelectionChip onClick={handleLast30Days}>Last 30 Days</DateSelectionChip>
                <DateSelectionChip onClick={handleLast90Days}>Last 90 Days</DateSelectionChip>
              </Stack>
            </Grid>
            <Grid item xs={9}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <StaticDateRangePicker
                  displayStaticWrapperAs="desktop"
                  calendars={2}
                  value={dateRange}
                  onChange={(newValue) => setDateRange(newValue)}
                  maxDate={maxDate}
                  minDate={minDate}
                />
              </LocalizationProvider>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button onClick={handleDateFilterClose} sx={{ mr: 1, color: "text.primary" }}>Close</Button>
                <Button variant="contained" onClick={handleDateRangeApply} sx={{ bgcolor: "#1976d2", "&:hover": { bgcolor: "#1565c0" } }}>
                  Apply
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Popover>
    </>
  );
};

export default DateSelector;
