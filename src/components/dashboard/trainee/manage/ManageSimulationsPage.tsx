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
  Chip,
  Tabs,
  Tab,
  SelectChangeEvent,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import DashboardContent from '../../DashboardContent';
import ActionsMenu from './ActionsMenu';
import CreateSimulationDialog from './CreateSimulationDialog';
import { SimulationData } from './types';

const simulationData: SimulationData[] = Array(6)
  .fill(null)
  .map((_, index) => ({
    id: '82840',
    name: 'Humana_MS_PCP Change',
    version: 'v1.2',
    level: 'Lvl 02',
    type: 'Visual-Audio',
    status: index < 3 ? 'Published' : index < 5 ? 'Draft' : 'Archive',
    tags: ['Tag 01', 'Tag 02'],
    estTime: '15 mins',
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
    isLocked: index === 1,
  }));

const ManageSimulationsPage = () => {
  const [currentTab, setCurrentTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState('All Tags');
  const [selectedDepartment, setSelectedDepartment] = useState(
    'All Departments & Divisions'
  );
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedCreator, setSelectedCreator] = useState('Created By');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<SimulationData | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    row: SimulationData
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
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

  // Filter data based on current tab and search query
  const filteredData = useMemo(() => {
    return simulationData.filter((row) => {
      // First apply tab filter
      if (currentTab !== 'All' && row.status !== currentTab) {
        return false;
      }

      // Then apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          row.name.toLowerCase().includes(searchLower) ||
          row.id.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [currentTab, searchQuery]);

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={3} sx={{ py: 4 }}>
          {/* Header */}
          <Stack >
            <Typography variant="h4" fontWeight="medium">
              Manage Simulations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create assign and manage your simulations
            </Typography>
          </Stack>

          {/* Update Create Button to open dialog */}
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
                  bgcolor: '#F9FAFB', // Background color for all tabs
                  color: '#AEAFB0', // Default text color
                  borderRadius: 1, // Optional: Add some border radius for better aesthetics
                  '&:hover': {
                    bgcolor: '#EDEFF1', // Optional: Add hover effect
                  },
                  '&.Mui-selected': {
                    color: '#323232', // Text color for the selected tab
                    fontWeight: 'bold', // Optional: Make selected tab text bold
                  },
                },
              }}
            >
              <Tab label="All" value="All" />
              <Tab label="Published" value="Published" />
              <Tab label="Draft" value="Draft" />
              <Tab label="Archive" value="Archive" />
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
              Create Simulation
            </Button>
          </Stack>


          {/* Filters */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between" // Align items within the stack
            sx={{
              bgcolor: '#F9FAFB', // Background color for the whole stack
              p: 1.5, // Optional: Add padding for better spacing
              borderRadius: 2, // Optional: Add rounded corners for the stack itself

            }}
          >
            <TextField
              placeholder="Search by Sim Name or ID"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: 300,
                bgcolor: '#FFFFFF', // Background color for TextField
                borderRadius: 10, // Border radius for TextField
                '& .MuiInputBase-root': {
                  borderRadius: 2, // Ensure the borderRadius applies to the input area
                },
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                ),
              }}
            />

            <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}> {/* Align select menus to the right */}
              <Select
                value={selectedTags}
                onChange={(e: SelectChangeEvent) => setSelectedTags(e.target.value)}
                size="small"
                sx={{
                  minWidth: 120,
                  bgcolor: '#FFFFFF', // Background color for Select menus
                  borderRadius: 2, // Border radius for Select menus
                }}
              >
                <MenuItem value="All Tags">All Tags</MenuItem>
              </Select>
              <Select
                value={selectedDepartment}
                onChange={(e: SelectChangeEvent) =>
                  setSelectedDepartment(e.target.value)
                }
                size="small"
                sx={{
                  minWidth: 200,
                  bgcolor: '#FFFFFF', // Background color for Select menus
                  borderRadius: 2, // Border radius for Select menus
                }}
              >
                <MenuItem value="All Departments & Divisions">
                  All Departments & Divisions
                </MenuItem>
              </Select>
              <Select
                value={selectedStatus}
                onChange={(e: SelectChangeEvent) => setSelectedStatus(e.target.value)}
                size="small"
                sx={{
                  minWidth: 120,
                  bgcolor: '#FFFFFF', // Background color for Select menus
                  borderRadius: 2, // Border radius for Select menus
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
                  bgcolor: '#FFFFFF', // Background color for Select menus
                  borderRadius: 2, // Border radius for Select menus
                }}
              >
                <MenuItem value="Created By">Created By</MenuItem>
              </Select>
            </Stack>
          </Stack>

          {/* Update TableContainer to hide scrollbar */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box sx={{
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}>
              <Table sx={{ minWidth: 1700, borderRadius: 2, overflow: 'hidden' }}>
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Sim ID</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Sim Name</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Version</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Level</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Sim Type</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Status</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Tags</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Est. Time</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Last Modified</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Modified by</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Created On</TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>Created by</TableCell>
                    <TableCell align="right" sx={{ color: '#959697', padding: '6px 16px' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
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
                      <TableCell>{row.version}</TableCell>
                      <TableCell>{row.level}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.type}
                          size="small"
                          sx={{ bgcolor: '#F5F6FF', color: '#444CE7' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          sx={{
                            bgcolor:
                              row.status === 'Published'
                                ? '#ECFDF3'
                                : row.status === 'Draft'
                                  ? '#F5F6FF'
                                  : '#F9FAFB',
                            color:
                              row.status === 'Published'
                                ? '#027A48'
                                : row.status === 'Draft'
                                  ? '#444CE7'
                                  : '#344054',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {row.tags.map((tag, i) => (
                            <Chip
                              key={i}
                              label={tag}
                              size="small"
                              sx={{ bgcolor: '#F5F6FF', color: '#444CE7' }}
                            />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>{row.estTime}</TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2">{row.lastModified}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            12:13pm IST
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
                          <Typography variant="body2">{row.createdOn}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            12:13pm IST
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
                        <IconButton size="small" onClick={(event) => handleMenuOpen(event, row)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ bgcolor: '#F9FAFB', borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
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

      <ActionsMenu
        anchorEl={anchorEl}
        selectedRow={selectedRow}
        onClose={handleMenuClose}
      />

      <CreateSimulationDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
          </DashboardContent>
  );
};

export default ManageSimulationsPage;
