import React, { useState, useEffect } from 'react';
import {
  Stack,
  Container,
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
  CircularProgress,
  TableSortLabel,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import DashboardContent from '../../DashboardContent';
import CreateTrainingPlanDialog from './CreateTrainingPlanDialog';
import CreateModuleDialog from './CreateModuleDialog';
import { useAuth } from '../../../../context/AuthContext';
import { fetchTrainingPlans, type TrainingPlan } from '../../../../services/trainingPlans';
import { fetchModules, type Module } from '../../../../services/modules';

type Order = 'asc' | 'desc';
type OrderBy = 'name' | 'tags' | 'estimated_time' | 'created_at' | 'created_by' | 'last_modified_at' | 'last_modified_by';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const ManageTrainingPlanPage = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('Training Plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState('All Tags');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedCreator, setSelectedCreator] = useState('Created By');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('name');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (currentTab === 'Training Plans') {
          const plans = await fetchTrainingPlans(user?.id || 'user123');
          setTrainingPlans(plans);
        } else {
          const moduleData = await fetchModules(user?.id || 'user123');
          setModules(moduleData);
        }
      } catch (err) {
        setError(`Failed to load ${currentTab.toLowerCase()}`);
        console.error(`Error loading ${currentTab.toLowerCase()}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentTab, user?.id]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(event.target.value);
    setPage(0);
  };

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredData = currentTab === 'Training Plans'
    ? trainingPlans.filter(plan =>
      !searchQuery || plan.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : modules.filter(module =>
      !searchQuery || module.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const sortedData = React.useMemo(() => {
    if (!filteredData.length) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'tags':
          aValue = a.tags.join(',') || '';
          bValue = b.tags.join(',') || '';
          break;
        case 'estimated_time':
          aValue = a.estimated_time || 0;
          bValue = b.estimated_time || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
        case 'created_by':
          aValue = a.created_by || '';
          bValue = b.created_by || '';
          break;
        case 'last_modified_at':
          aValue = new Date(a.last_modified_at || 0).getTime();
          bValue = new Date(b.last_modified_at || 0).getTime();
          break;
        case 'last_modified_by':
          aValue = a.last_modified_by || '';
          bValue = b.last_modified_by || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      const result = (aValue < bValue) ? -1 : (aValue > bValue) ? 1 : 0;
      return order === 'asc' ? result : -result;
    });
  }, [filteredData, order, orderBy]);

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={3} sx={{ py: 4 }}>
          <Stack>
            <Typography variant="h4" fontWeight="medium">
              Manage Training Plan
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create and manage training plan and modules
            </Typography>
          </Stack>

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
              placeholder={`Search by ${currentTab === 'Training Plans' ? 'Training Plan' : 'Module'} Name or ID`}
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

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', my: 4, color: 'error.main' }}>
              <Typography>{error}</Typography>
            </Box>
          ) : (
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
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#c1c1c1',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#a8a8a8',
                },
              },
              scrollbarWidth: 'thin',
              scrollbarColor: '#c1c1c1 #f1f1f1',
            }}>
              <Table sx={{ minWidth: 1200, tableLayout: 'fixed' }}>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 250 }}>
                      <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        {currentTab === 'Training Plans' ? 'Training Plan' : 'Module'}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 200 }}>
                      <TableSortLabel
                        active={orderBy === 'tags'}
                        direction={orderBy === 'tags' ? order : 'asc'}
                        onClick={() => handleRequestSort('tags')}
                      >
                        Tags
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 120 }}>
                      <TableSortLabel
                        active={orderBy === 'estimated_time'}
                        direction={orderBy === 'estimated_time' ? order : 'asc'}
                        onClick={() => handleRequestSort('estimated_time')}
                      >
                        Est. Time
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 180 }}>
                      <TableSortLabel
                        active={orderBy === 'created_at'}
                        direction={orderBy === 'created_at' ? order : 'asc'}
                        onClick={() => handleRequestSort('created_at')}
                      >
                        Created On
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 150 }}>
                      <TableSortLabel
                        active={orderBy === 'created_by'}
                        direction={orderBy === 'created_by' ? order : 'asc'}
                        onClick={() => handleRequestSort('created_by')}
                      >
                        Created By
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 180 }}>
                      <TableSortLabel
                        active={orderBy === 'last_modified_at'}
                        direction={orderBy === 'last_modified_at' ? order : 'asc'}
                        onClick={() => handleRequestSort('last_modified_at')}
                      >
                        Last Modified
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 150 }}>
                      <TableSortLabel
                        active={orderBy === 'last_modified_by'}
                        direction={orderBy === 'last_modified_by' ? order : 'asc'}
                        onClick={() => handleRequestSort('last_modified_by')}
                      >
                        Modified By
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#959697', padding: '6px 16px', width: 100 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedData.slice(page * parseInt(rowsPerPage), page * parseInt(rowsPerPage) + parseInt(rowsPerPage)).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ minWidth: 250 }}>{item.name}</TableCell>
                      <TableCell sx={{ width: 200 }}>
                        <Stack direction="row" spacing={1}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxWidth: 180 }}>
                            {item.tags.map((tag, i) => (
                              <Chip
                                key={i}
                                label={tag}
                                size="small"
                                sx={{ 
                                  bgcolor: '#F5F6FF', 
                                  color: '#444CE7',
                                  maxWidth: '100%',
                                  '& .MuiChip-label': {
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ width: 120 }}>{item.estimated_time}m</TableCell>
                      <TableCell>
                        <Stack sx={{ minWidth: 180 }}>
                          <Typography variant="body2">{formatDate(item.created_at)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.created_at).toLocaleTimeString()}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack sx={{ minWidth: 150 }}>
                          <Typography variant="body2" noWrap>{item.created_by}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack sx={{ minWidth: 180 }}>
                          <Typography variant="body2">{formatDate(item.last_modified_at)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.last_modified_at).toLocaleTimeString()}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack sx={{ minWidth: 150 }}>
                          <Typography variant="body2" noWrap>{item.last_modified_by}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={{ width: 100 }}>
                        <IconButton size="small">
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
                rowsPerPage={parseInt(rowsPerPage, 10)}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50, 100]}
              />
            </Box>
          </TableContainer>
          )}
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