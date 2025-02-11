import React, { useState } from 'react';
import {
  Container,
  Stack,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  Box,
  Tabs,
  Tab,
  SelectChangeEvent,
  TablePagination,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  LockOutlined as LockIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import DashboardContent from '../DashboardContent';
import AssignTrainingPlanDialog from './AssignTrainingPlanDialog';

type AssignmentData = {
  id: string;
  name: string;
  trainingPlan: string;
  modules: {
    count: number;
    sims: number;
  };
  trainees: number;
  startDate: string;
  dueDate: string;
  status: 'In Progress';
  estTime: string;
  lastModified: {
    date: string;
    time: string;
  };
  modifiedBy: {
    name: string;
    email: string;
  };
  createdOn: {
    date: string;
    time: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  isLocked?: boolean;
};

const assignmentData: AssignmentData[] = Array(6)
  .fill(null)
  .map((_, index) => ({
    id: '45789',
    name: 'New Assignment 01',
    trainingPlan: 'New Training Plan 01',
    modules: {
      count: 4,
      sims: 12,
    },
    trainees: 24,
    startDate: '2 Jan 2025',
    dueDate: '1 Feb 2025',
    status: 'In Progress',
    estTime: '1h 30m',
    lastModified: {
      date: 'Dec 20, 2024',
      time: '12:13pm IST',
    },
    modifiedBy: {
      name: 'John Doe',
      email: 'johndoe@humana.com',
    },
    createdOn: {
      date: 'Dec 20, 2024',
      time: '12:13pm IST',
    },
    createdBy: {
      name: 'John Doe',
      email: 'johndoe@humana.com',
    },
    isLocked: index === 1,
  }));

const AssignSimulationsPage = () => {
  const [currentTab, setCurrentTab] = useState('Training Plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState('All Tags');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedCreator, setSelectedCreator] = useState('Created By');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAssignDialog = () => {
    setIsAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setIsAssignDialogOpen(false);
  };

  const filteredData = assignmentData.filter((item) => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={4} sx={{ py: 4 }}>
          {/* Header */}
          <Stack>
            <Typography variant="h4" fontWeight="medium">
              Assign Simulations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Assign simulation, modules and training plan to the trainee
            </Typography>
          </Stack>

          {/* Tabs and Create Button */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: 3,
                  bgcolor: '#F9FAFB',
                  color: '#AEAFB0',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: '#EDEFF1',
                  },
                  '&.Mui-selected': {
                    color: '#323232',
                    fontWeight: 'bold',
                  },
                },
              }}
            >
              <Tab label="Training Plans" value="Training Plans" />
              <Tab label="Modules" value="Modules" />
              <Tab label="Simulations" value="Simulations" />
            </Tabs>
            <Button
              variant="contained"
              onClick={handleOpenAssignDialog}
              sx={{
                bgcolor: '#444CE7',
                color: 'white',
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              Assign Training Plan
            </Button>
          </Stack>

          {/* Filters */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{
              bgcolor: '#F9FAFB',
              p: 1.5,
              borderRadius: 2,
            }}
          >
            <TextField
              placeholder="Search by Assignment Name or ID"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: 300,
                bgcolor: '#FFFFFF',
                borderRadius: 10,
                '& .MuiInputBase-root': {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                ),
              }}
            />

            <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
              <Select
                value={selectedTags}
                onChange={(e: SelectChangeEvent) => setSelectedTags(e.target.value)}
                size="small"
                sx={{
                  minWidth: 120,
                  bgcolor: '#FFFFFF',
                  borderRadius: 2,
                }}
              >
                <MenuItem value="All Tags">All Tags</MenuItem>
              </Select>
              <Select
                value={selectedStatus}
                onChange={(e: SelectChangeEvent) => setSelectedStatus(e.target.value)}
                size="small"
                sx={{
                  minWidth: 120,
                  bgcolor: '#FFFFFF',
                  borderRadius: 2,
                }}
              >
                <MenuItem value="All Status">All Status</MenuItem>
              </Select>
              <Select
                value={selectedCreator}
                onChange={(e: SelectChangeEvent) => setSelectedCreator(e.target.value)}
                size="small"
                sx={{
                  minWidth: 120,
                  bgcolor: '#FFFFFF',
                  borderRadius: 2,
                }}
              >
                <MenuItem value="Created By">Created By</MenuItem>
              </Select>
            </Stack>
          </Stack>

          {/* Table */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <Table sx={{ minWidth: 1700, borderRadius: 2, overflow: 'hidden' }}>
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>ID No.</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Assignment Name</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Training Plan</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>No. of Modules</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Trainees</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Start Date</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Due Date</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Status</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Est. Time</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Last Modified</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Modified by</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Created On</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Created by</TableCell>
                    <TableCell align="right" sx={{ color: '#959697', padding: '6px 16px' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {row.name}
                            {row.isLocked && (
                              <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>{row.trainingPlan}</TableCell>
                        <TableCell>{`${row.modules.count} Modules | ${row.modules.sims} Sims`}</TableCell>
                        <TableCell>{row.trainees}</TableCell>
                        <TableCell>{row.startDate}</TableCell>
                        <TableCell>{row.dueDate}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Chip
                              label={row.status}
                              size="small"
                              sx={{
                                bgcolor: '#F5F6FF',
                                color: '#444CE7',
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>{row.estTime}</TableCell>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2">{row.lastModified.date}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.lastModified.time}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2">{row.modifiedBy.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.modifiedBy.email}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2">{row.createdOn.date}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.createdOn.time}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2">{row.createdBy.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.createdBy.email}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small">
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
            <Box
              sx={{
                bgcolor: '#F9FAFB',
                borderTop: '1px solid rgba(224, 224, 224, 1)',
              }}
            >
              <TablePagination
                component="div"
                count={filteredData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50, 100]}
              />
            </Box>
          </TableContainer>
        </Stack>
      </Container>

      <AssignTrainingPlanDialog
        open={isAssignDialogOpen}
        onClose={handleCloseAssignDialog}
      />
    </DashboardContent>
  );
};

export default AssignSimulationsPage;