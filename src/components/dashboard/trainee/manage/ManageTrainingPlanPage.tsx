import React, { useState, useMemo } from 'react';
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
  IconButton,
  Box,
  Tabs,
  Tab,
  SelectChangeEvent,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import DashboardContent from '../../DashboardContent';
import CreateTrainingPlanDialog from './CreateTrainingPlanDialog';
import CreateModuleDialog from './CreateModuleDialog';

type TrainingPlanData ={
  id: string;
  name: string;
  modules: {
    count: number;
    sims: number;
  };
  estTime: string;
  lastModified: string;
  modifiedBy: {
    name: string;
    email: string;
  };
  createdOn: string;
  createdBy: {
    name: string;
    email: string;
  };
}

type ModuleData = {
  id: string;
  name: string;
  simCount: number;
  estTime: string;
  lastModified: string;
  modifiedBy: {
    name: string;
    email: string;
  };
  createdOn: string;
  createdBy: {
    name: string;
    email: string;
  };
}

const trainingPlanData: TrainingPlanData[] = Array(6)
  .fill(null)
  .map((_, index) => ({
    id: '45789',
    name: 'New Training Plan 01',
    modules: {
      count: 4,
      sims: 12,
    },
    estTime: '2h 30m',
    lastModified: 'Dec 20, 2024',
    modifiedBy: {
      name: 'John Doe',
      email: 'johndoe@humana.com',
    },
    createdOn: 'Dec 20, 2024',
    createdBy: {
      name: 'John Doe',
      email: 'johndoe@humana.com',
    },
  }));

const moduleData: ModuleData[] = Array(6)
  .fill(null)
  .map((_, index) => ({
    id: '45789',
    name: 'Module_name_01',
    simCount: 3,
    estTime: '1h 30m',
    lastModified: 'Dec 20, 2024',
    modifiedBy: {
      name: 'John Doe',
      email: 'johndoe@humana.com',
    },
    createdOn: 'Dec 20, 2024',
    createdBy: {
      name: 'John Doe',
      email: 'johndoe@humana.com',
    },
  }));

const ManageTrainingPlanPage = () => {
  const [currentTab, setCurrentTab] = useState('Training Plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState('All Tags');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedCreator, setSelectedCreator] = useState('Created By');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTableColumns = () => {
    if (currentTab === 'Training Plans') {
      return [
        { id: 'id', label: 'ID No.' },
        { id: 'name', label: 'Training Plan' },
        { id: 'modules', label: 'No. of Modules' },
        { id: 'estTime', label: 'Est. Time' },
        { id: 'lastModified', label: 'Last Modified' },
        { id: 'modifiedBy', label: 'Modified by' },
        { id: 'createdOn', label: 'Created On' },
        { id: 'createdBy', label: 'Created by' },
      ];
    }
    return [
      { id: 'id', label: 'ID No.' },
      { id: 'name', label: 'Module' },
      { id: 'simCount', label: 'No. of Sims' },
      { id: 'estTime', label: 'Est. Time' },
      { id: 'lastModified', label: 'Last Modified' },
      { id: 'modifiedBy', label: 'Modified by' },
      { id: 'createdOn', label: 'Created On' },
      { id: 'createdBy', label: 'Created by' },
    ];
  };

  const filteredData = useMemo(() => {
    const data =
      currentTab === 'Training Plans' ? trainingPlanData : moduleData;
    if (!searchQuery) return data;

    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentTab, searchQuery]);

  const renderTableRow = (
    row: TrainingPlanData | ModuleData,
    index: number
  ) => {
    if (currentTab === 'Training Plans') {
      const tpRow = row as TrainingPlanData;
      return (
        <TableRow key={index}>
          <TableCell>{tpRow.id}</TableCell>
          <TableCell>{tpRow.name}</TableCell>
          <TableCell>{`${tpRow.modules.count} Modules | ${tpRow.modules.sims} Sims`}</TableCell>
          <TableCell>{tpRow.estTime}</TableCell>
          <TableCell>
            <Stack>
              <Typography variant="body2">{tpRow.lastModified}</Typography>
              <Typography variant="caption" color="text.secondary">
                12:13pm IST
              </Typography>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack>
              <Typography variant="body2">{tpRow.modifiedBy.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {tpRow.modifiedBy.email}
              </Typography>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack>
              <Typography variant="body2">{tpRow.createdOn}</Typography>
              <Typography variant="caption" color="text.secondary">
                12:13pm IST
              </Typography>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack>
              <Typography variant="body2">{tpRow.createdBy.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {tpRow.createdBy.email}
              </Typography>
            </Stack>
          </TableCell>
          <TableCell align="right">
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </TableCell>
        </TableRow>
      );
    } else {
      const modRow = row as ModuleData;
      return (
        <TableRow key={index}>
          <TableCell>{modRow.id}</TableCell>
          <TableCell>{modRow.name}</TableCell>
          <TableCell>{`${modRow.simCount} Sims`}</TableCell>
          <TableCell>{modRow.estTime}</TableCell>
          <TableCell>
            <Stack>
              <Typography variant="body2">{modRow.lastModified}</Typography>
              <Typography variant="caption" color="text.secondary">
                12:13pm IST
              </Typography>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack>
              <Typography variant="body2">{modRow.modifiedBy.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {modRow.modifiedBy.email}
              </Typography>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack>
              <Typography variant="body2">{modRow.createdOn}</Typography>
              <Typography variant="caption" color="text.secondary">
                12:13pm IST
              </Typography>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack>
              <Typography variant="body2">{modRow.createdBy.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {modRow.createdBy.email}
              </Typography>
            </Stack>
          </TableCell>
          <TableCell align="right">
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </TableCell>
        </TableRow>
      );
    }
  };

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={3} sx={{ py: 4 }}>
          {/* Header */}
          <Stack>
            <Typography variant="h4" fontWeight="medium">
              Manage Training Plan
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create and manage training plan and modules
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
            </Tabs>
            <Button
              variant="contained"
              onClick={() => setIsCreateDialogOpen(true)}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              {currentTab === 'Training Plans'
                ? 'Create Training Plan'
                : 'Create Module'}
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
              placeholder="Search by Sim Name or ID"
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
                onChange={(e: SelectChangeEvent) =>
                  setSelectedTags(e.target.value)
                }
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
                onChange={(e: SelectChangeEvent) =>
                  setSelectedStatus(e.target.value)
                }
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
                onChange={(e: SelectChangeEvent) =>
                  setSelectedCreator(e.target.value)
                }
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
              <Table
                sx={{ minWidth: 1700, borderRadius: 2, overflow: 'hidden' }}
              >
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>
                    {getTableColumns().map((column) => (
                      <TableCell
                        key={column.id}
                        sx={{ color: '#959697', padding: '6px 16px' }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                    <TableCell
                      align="right"
                      sx={{ color: '#959697', padding: '6px 16px' }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => renderTableRow(row, index))}
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
      {currentTab === 'Training Plans' ? (
        <CreateTrainingPlanDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      ) : (
        <CreateModuleDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      )}
    </DashboardContent>
  );
};

export default ManageTrainingPlanPage;
