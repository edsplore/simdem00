import { DateRange } from "@mui/x-date-pickers-pro/models";
import {
  CalendarMonth as CalendarIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
  Button,
  styled,
  Box,
  Popover,
  Typography,
  Stack,
  Grid,
  Divider,
} from "@mui/material";
import { useState, useEffect } from "react";

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

interface DateSelectorProps {
  dateRange: DateRange<Dayjs>;
  setDateRange: any;
  handleDateRangeApplyCallback: any;
}

const DateSelector = ({
  dateRange,
  setDateRange,
  handleDateRangeApplyCallback,
}: DateSelectorProps) => {
  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLElement | null>(null);
  const [selectionState, setSelectionState] = useState<"start" | "end">(
    "start"
  );
  const [currentMonth, setCurrentMonth] = useState(dayjs().month());
  const [currentYear, setCurrentYear] = useState(dayjs().year());

  // Initialize current month and year when component mounts
  useEffect(() => {
    const now = dayjs();
    setCurrentMonth(now.month());
    setCurrentYear(now.year());
  }, []);

  // Format date range for display
  const getDateRangeText = () => {
    if (dateRange[0] && dateRange[1]) {
      return `${dateRange[0].format("MMM D, YYYY")} - ${dateRange[1].format(
        "MMM D, YYYY"
      )}`;
    } else if (dateRange[0]) {
      return `From ${dateRange[0].format("MMM D, YYYY")}`;
    } else if (dateRange[1]) {
      return `Until ${dateRange[1].format("MMM D, YYYY")}`;
    }
    return "All Time";
  };

  const handleDateFilterClose = () => {
    setDateAnchorEl(null);
  };
  // Handle date filter
  const handleDateFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setDateAnchorEl(event.currentTarget);
  };

  const handleDateRangeApply = () => {
    handleDateFilterClose();
    handleDateRangeApplyCallback();
  };

  // Function to handle date selections
  const handleDateSelect = (selectedDate: Dayjs) => {
    if (selectionState === "start") {
      // If we're selecting the start date, set both start and end to this date
      // and switch to selecting the end date
      setDateRange([selectedDate, selectedDate]);
      setSelectionState("end");
    } else {
      // If we're selecting the end date, compare with the start date
      const startDate = dateRange[0];

      if (startDate && selectedDate.isBefore(startDate)) {
        // If the selected end date is before the start date, swap them
        setDateRange([selectedDate, startDate]);
      } else {
        // Otherwise set the end date
        setDateRange([startDate, selectedDate]);
      }

      // Reset to selecting start date for next time
      setSelectionState("start");
    }
  };

  // Handle quick date selections
  const handleToday = () => {
    const today = dayjs();
    setDateRange([today, today]);
  };

  const handleTomorrow = () => {
    const tomorrow = dayjs().add(1, "day");
    setDateRange([tomorrow, tomorrow]);
  };

  const handleNext7Days = () => {
    const start = dayjs();
    const end = dayjs().add(6, "day");
    setDateRange([start, end]);
  };

  const handleNext30Days = () => {
    const start = dayjs();
    const end = dayjs().add(29, "day");
    setDateRange([start, end]);
  };

  const handleAllTime = () => {
    setDateRange([null, null]);
  };

  // Generate calendar for a specific month
  const renderCalendar = (month: number, year: number) => {
    const firstDayOfMonth = dayjs().year(year).month(month).date(1);
    const daysInMonth = firstDayOfMonth.daysInMonth();
    const monthName = firstDayOfMonth.format('MMMM YYYY');

    return (
      <div style={{ padding: "8px 12px" }}>
        <div
          style={{
            textAlign: "center",
            padding: "8px 0px",
            fontWeight: 500,
          }}
        >
          {monthName}
        </div>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 40px)",
            gridGap: "4px",
          }}
        >
          {/* Day headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Box
              key={`header-${month}-${index}`}
              sx={{
                textAlign: "center",
                color: "text.secondary",
                fontSize: "0.75rem",
                padding: "8px 0",
              }}
            >
              {day}
            </Box>
          ))}

          {/* Empty cells for days before the 1st of the month */}
          {Array(firstDayOfMonth.day())
            .fill(null)
            .map((_, index) => (
              <Box key={`empty-${month}-${index}`} />
            ))}

          {/* Calendar days */}
          {Array(daysInMonth)
            .fill(0)
            .map((_, i) => {
              const day = i + 1;
              const date = dayjs().year(year).month(month).date(day);

              // Check if this date is within the selected range
              const isStartDate =
                dateRange[0] && date.isSame(dateRange[0], "day");
              const isEndDate =
                dateRange[1] && date.isSame(dateRange[1], "day");
              const isInRange =
                dateRange[0] &&
                dateRange[1] &&
                date.isAfter(dateRange[0], "day") &&
                date.isBefore(dateRange[1], "day");

              return (
                <Box
                  key={`day-${month}-${day}`}
                  sx={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    borderRadius:
                      isStartDate || isEndDate
                        ? "50%"
                        : isInRange
                        ? "0"
                        : "50%",
                    backgroundColor:
                      isStartDate || isEndDate
                        ? "#1976d2"
                        : isInRange
                        ? "rgba(25, 118, 210, 0.2)"
                        : "transparent",
                    color:
                      isStartDate || isEndDate
                        ? "white"
                        : isInRange
                        ? "#1976d2"
                        : "text.primary",
                    "&:hover": {
                      backgroundColor:
                        isStartDate || isEndDate
                          ? "#1565c0"
                          : isInRange
                          ? "rgba(25, 118, 210, 0.3)"
                          : "action.hover",
                    },
                  }}
                  onClick={() => handleDateSelect(date)}
                >
                  {day}
                </Box>
              );
            })}
        </Box>
      </div>
    );
  };

  return (
    <>
      <DateFilterButton
        onClick={handleDateFilterClick}
        startIcon={<CalendarIcon />}
        endIcon={<ArrowDownIcon />}
        sx={{
          backgroundColor: "background.paper",
          minHeight: "40px",
          minWidth: "180px",
          justifyContent: "space-between",
          padding: "6px 12px",
        }}
      >
        {getDateRangeText()}
      </DateFilterButton>

      {/* Date Range Picker Popover */}
      <Popover
        open={Boolean(dateAnchorEl)}
        anchorEl={dateAnchorEl}
        onClose={handleDateFilterClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            p: 3,
            width: "auto",
            mt: 1,
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Typography
            variant="subtitle2"
            sx={{
              textTransform: "uppercase",
              color: "text.secondary",
              fontSize: "0.75rem",
              mb: 1,
            }}
          >
            SELECT DATE RANGE
          </Typography>

          <Typography variant="h5" sx={{ mb: 3, fontWeight: "medium" }}>
            {dateRange[0] && dateRange[1]
              ? `${dateRange[0].format("MMM D")} – ${dateRange[1].format(
                  "MMM D"
                )}`
              : "Select dates"}
          </Typography>

          <Grid container spacing={2}>
            {/* Left side - Quick selection chips */}
            <Grid item xs={3}>
              <Stack spacing={1} alignItems="flex-start">
                <DateSelectionChip onClick={handleToday}>
                  Today
                </DateSelectionChip>
                <DateSelectionChip onClick={handleTomorrow}>
                  Tomorrow
                </DateSelectionChip>
                <DateSelectionChip onClick={handleNext7Days}>
                  Next 7 Days
                </DateSelectionChip>
                <DateSelectionChip onClick={handleNext30Days}>
                  Next 30 Days
                </DateSelectionChip>
                <DateSelectionChip onClick={handleAllTime}>
                  All Time
                </DateSelectionChip>
              </Stack>
            </Grid>

            {/* Right side - Calendars */}
            <Grid item xs={9}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  ".MuiDateRangePickerViewDesktop-root": {
                    border: "none",
                    boxShadow: "none",
                  },
                }}
              >
                <div style={{ display: "flex" }}>
                  {/* Current Month Calendar */}
                  {renderCalendar(currentMonth, currentYear)}

                  {/* Vertical divider */}
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                  {/* Next Month Calendar */}
                  {renderCalendar(
                    (currentMonth + 1) % 12,
                    currentMonth === 11 ? currentYear + 1 : currentYear
                  )}
                </div>
              </Box>

              {/* Buttons */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 2,
                }}
              >
                <Button
                  onClick={handleDateFilterClose}
                  sx={{ mr: 1, color: "text.primary" }}
                >
                  Close
                </Button>
                <Button
                  variant="contained"
                  onClick={handleDateRangeApply}
                  sx={{
                    bgcolor: "#1976d2",
                    "&:hover": { bgcolor: "#1565c0" },
                  }}
                >
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