import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';

import { getUsers, createUser, updateUser, deleteUser, getRoles } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useArgonController } from '../../context';

const ROLE_BADGES = {
  super_admin: {
    label: 'Super Administrator',
    color: '#0f172a',
    bg: '#f1f5f9',
    border: '#cbd5e1',
    chipColor: '#0f172a'
  },
  analyst: {
    label: 'Environmental Analyst',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
    chipColor: '#0369a1'
  },
  auditor: {
    label: 'Data Operator & Auditor',
    color: '#334155',
    bg: '#f8fafc',
    border: '#e2e8f0',
    chipColor: '#334155'
  },
  viewer: {
    label: 'Read-Only Viewer',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    chipColor: '#475569'
  },
  custom: {
    label: 'Custom Role',
    color: '#047857',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    chipColor: '#047857'
  }
};

function getRoleStyle(roleName) {
  return ROLE_BADGES[roleName] || ROLE_BADGES.custom;
}

export default function UsersView() {
  const [controller] = useArgonController();
  const { darkMode } = controller;
  const { user: currentUser, hasPermission } = useAuth();

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', severity: 'success' });
  const [copiedEmail, setCopiedEmail] = useState('');

  const canCreate = hasPermission('users.create');
  const canEdit = hasPermission('users.edit');
  const canDelete = hasPermission('users.delete');

  const showToast = (message, severity = 'success') => {
    setToast({ show: true, message, severity });
    setTimeout(() => setToast({ show: false, message: '', severity: 'success' }), 5000);
  };

  useEffect(() => {
    async function loadRoles() {
      try {
        const rolesList = await getRoles();
        setRoles(rolesList || []);
        if (rolesList && rolesList.length > 0 && !formData.roleId) {
          const defaultRole = rolesList.find((r) => r.name === 'analyst') || rolesList[0];
          setFormData((prev) => ({ ...prev, roleId: defaultRole.id }));
        }
      } catch (err) {
        console.warn('Could not load roles:', err);
      }
    }
    loadRoles();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        search,
        roleId: roleFilter,
        isActive: statusFilter,
        limit: 100
      });
      setUsers(res.users || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      showToast(err.message || 'Failed to load user accounts list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const activeCount = useMemo(() => {
    return users.filter((u) => u.isActive).length;
  }, [users]);

  const superAdminCount = useMemo(() => {
    return users.filter((u) => u.role?.name === 'super_admin').length;
  }, [users]);

  const operationalCount = useMemo(() => {
    return users.filter((u) => u.role?.name === 'analyst' || u.role?.name === 'auditor').length;
  }, [users]);

  const handleOpenCreate = () => {
    setFormError('');
    setShowPassword(false);
    const defaultRole = roles.find((r) => r.name === 'analyst') || roles[0];
    setFormData({
      username: '',
      fullName: '',
      email: '',
      password: '',
      roleId: defaultRole ? defaultRole.id : '',
      isActive: true
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setFormError('');
    setShowPassword(false);
    setActiveUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      roleId: user.roleId || user.role?.id,
      isActive: Boolean(user.isActive)
    });
    setEditModalOpen(true);
  };

  const handleOpenDelete = (user) => {
    setActiveUser(user);
    setDeleteModalOpen(true);
  };

  const handleCopyEmail = (email, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(''), 2000);
  };

  const handleCreateSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormError('');

    if (!formData.username.trim() || formData.username.trim().length < 3) {
      setFormError('Username must be at least 3 characters.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('A valid official email address is required.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setFormError('Initial password must be at least 6 characters.');
      return;
    }
    if (!formData.roleId) {
      setFormError('Please select an assigned role clearance.');
      return;
    }

    setActionLoading(true);
    try {
      await createUser({
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        roleId: formData.roleId,
        isActive: formData.isActive
      });
      setCreateModalOpen(false);
      showToast(`User account @${formData.username} created successfully!`, 'success');
      fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to create user account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormError('');

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('A valid official email address is required.');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setActionLoading(true);
    try {
      await updateUser(activeUser.id, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        roleId: formData.roleId,
        isActive: formData.isActive,
        password: formData.password ? formData.password : undefined
      });
      setEditModalOpen(false);
      showToast(`Account @${activeUser.username} updated successfully!`, 'success');
      fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to update user account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!activeUser) return;
    setActionLoading(true);
    try {
      await deleteUser(activeUser.id);
      setDeleteModalOpen(false);
      showToast(`Account @${activeUser.username} removed from the registry.`, 'info');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (!canEdit) return;
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      showToast(
        `Account @${user.username} is now ${!user.isActive ? 'Active' : 'Disabled'}.`,
        !user.isActive ? 'success' : 'info'
      );
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update account status.', 'error');
    }
  };

  return (
    <Box sx={{ width: '100%', pb: 5 }}>
{toast.show && (
        <Fade in={toast.show}>
          <Alert
            severity={toast.severity}
            onClose={() => setToast({ show: false, message: '', severity: 'success' })}
            sx={{
              mb: 2.5,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              fontWeight: 600,
              fontSize: '13.5px'
            }}
          >
            {toast.message}
          </Alert>
        </Fade>
      )}
<Card
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          borderRadius: '16px',
          boxShadow: '0 8px 26px rgba(0,0,0,0.04)',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9', backgroundColor: darkMode ? '#0f172a' : '#ffffff',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '14px',
              backgroundColor: '#eef2ff',
              border: '1px solid #c7d2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a',
              boxShadow: 'none',
              flexShrink: 0
            }}
          >
            <PeopleAltRoundedIcon sx={{ fontSize: '28px' }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 800,
                  color: darkMode ? '#ffffff' : '#1e293b',
                  letterSpacing: '-0.3px',
                  fontSize: { xs: '20px', md: '22px' }
                }}
              >
                User Management & Access Control
              </Typography>
              <Chip
                label={`${totalCount} Registered`}
                size="small"
                sx={{
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  fontWeight: 700,
                  fontSize: '11px',
                  borderRadius: '8px',
                  height: '24px'
                }}
              />
              <Chip
                icon={<VerifiedUserRoundedIcon sx={{ fontSize: '13px !important', color: '#16a34a' }} />}
                label="Directory Verified"
                size="small"
                sx={{
                  backgroundColor: '#f0fdf4',
                  color: '#166534',
                  fontWeight: 700,
                  fontSize: '11px',
                  borderRadius: '8px',
                  height: '24px'
                }}
              />
            </Box>
            <Typography sx={{ fontSize: '13px', color: '#64748b', mt: 0.5, lineHeight: 1.5 }}>
              Manage EPA Punjab intelligence operators, assign security role policies, and administer access clearances.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
          {canCreate && (
            <Button
              variant="contained"
              onClick={handleOpenCreate}
              startIcon={<PersonAddRoundedIcon sx={{ fontSize: '19px !important' }} />}
              sx={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '13px',
                px: 2.5,
                py: 0.9,
                boxShadow: 'none',
                transition: 'all 0.15s ease',
                '&:hover': {
                  backgroundColor: '#15803d',
                  boxShadow: 'none'
                }
              }}
            >
              + New User Account
            </Button>
          )}
        </Box>
      </Card>
<Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 3
        }}
      >
        <Card sx={{ p: 2.2, borderRadius: '14px', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9', backgroundColor: darkMode ? '#0f172a' : '#ffffff', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PeopleAltRoundedIcon sx={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Total Accounts
              </Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 800, color: darkMode ? '#ffffff' : '#1e293b' }}>
                {loading ? <Skeleton variant="text" width={42} height={32} sx={{ display: 'inline-block' }} /> : totalCount}{' '}
                <Typography component="span" sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                  Registered
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ p: 2.2, borderRadius: '14px', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9', backgroundColor: darkMode ? '#0f172a' : '#ffffff', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Active Accounts
              </Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>
                {loading ? <Skeleton variant="text" width={42} height={32} sx={{ display: 'inline-block' }} /> : activeCount}{' '}
                <Typography component="span" sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                  ({totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100}%)
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ p: 2.2, borderRadius: '14px', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9', backgroundColor: darkMode ? '#0f172a' : '#ffffff', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldRoundedIcon sx={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Chief Administrators
              </Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 800, color: darkMode ? '#ffffff' : '#1e293b' }}>
                {loading ? <Skeleton variant="text" width={32} height={32} sx={{ display: 'inline-block' }} /> : superAdminCount}{' '}
                <Typography component="span" sx={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                  Apex Authority
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ p: 2.2, borderRadius: '14px', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9', backgroundColor: darkMode ? '#0f172a' : '#ffffff', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BadgeRoundedIcon sx={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Analysts & Auditors
              </Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 800, color: darkMode ? '#ffffff' : '#1e293b' }}>
                {operationalCount}{' '}
                <Typography component="span" sx={{ fontSize: '12px', fontWeight: 600, color: '#ea580c' }}>
                  Operational Staff
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>
<Card
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '14px',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9', backgroundColor: darkMode ? '#0f172a' : '#ffffff',
          boxShadow: '0 4px 18px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ flex: 1, width: '100%', minWidth: { xs: '100%', md: '300px' } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by full name, @username, or official email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: '19px', color: '#94a3b8' }} />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <CloseRoundedIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: '10px', fontSize: '13px', backgroundColor: darkMode ? '#090e15' : '#f8fafc' }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListRoundedIcon sx={{ fontSize: '18px', color: '#64748b' }} />
            <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
              Role:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                sx={{ borderRadius: '10px', fontSize: '12.5px', backgroundColor: darkMode ? '#090e15' : '#f8fafc' }}
              >
                <MenuItem value="all">All Roles ({roles.length})</MenuItem>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
              Status:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: '10px', fontSize: '12.5px', backgroundColor: darkMode ? '#090e15' : '#f8fafc' }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="1">Active Only</MenuItem>
                <MenuItem value="0">Disabled Only</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              size="small"
              onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
              sx={{ textTransform: 'none', fontSize: '12px', fontWeight: 600, color: '#64748b' }}
            >
              Reset Filters
            </Button>
          )}
        </Box>
      </Card>
<Card
        sx={{
          borderRadius: '16px',
          boxShadow: '0 8px 28px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}
      >
        <TableContainer sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
          <Table sx={{ minWidth: 780 }}>
            <TableHead sx={{ backgroundColor: darkMode ? '#090e15' : '#f8fafc', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0' }}>
              <TableRow>
                <TableCell sx={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8 }}>
                  Operator Identity
                </TableCell>
                <TableCell sx={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8 }}>
                  Official Email
                </TableCell>
                <TableCell sx={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8 }}>
                  Assigned Role Policy
                </TableCell>
                <TableCell sx={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8 }}>
                  Account Status
                </TableCell>
                <TableCell sx={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8 }}>
                  Onboarded Date
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1.8 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} sx={{ color: '#16a34a', mb: 1.5 }} />
                    <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: '#64748b' }}>
                      Retrieving operator directory...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <PeopleAltRoundedIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
                    <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>
                      No operator accounts match your criteria
                    </Typography>
                    <Typography sx={{ fontSize: '12.5px', color: '#64748b', mt: 0.5 }}>
                      Try adjusting the search query or clearing the active filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const roleStyle = getRoleStyle(u.role?.name);
                  const isSuperAdmin = u.role?.name === 'super_admin';

                  return (
                    <TableRow
                      key={u.id}
                      hover
                      sx={{
                        '&:hover': { backgroundColor: darkMode ? '#090e15' : '#f8fafc' },
                        transition: 'background-color 0.15s ease'
                      }}
                    >
<TableCell sx={{ py: 1.6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.6 }}>
                          <Avatar
                            src={u.avatar}
                            alt={u.fullName || u.username}
                            sx={{
                              width: 42,
                              height: 42,
                              border: '2px solid #e2e8f0',
                              backgroundColor: roleStyle.bg,
                              color: roleStyle.chipColor,
                              fontWeight: 800,
                              fontSize: '15px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                          >
                            {(u.fullName || u.username || 'U')[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontSize: '13.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#1e293b' }}>
                                {u.fullName || u.username}
                              </Typography>
                              {isCurrent && (
                                <Chip
                                  label="You"
                                  size="small"
                                  sx={{
                                    height: '20px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    backgroundColor: '#dcfce7',
                                    color: '#166534',
                                    border: '1px solid #bbf7d0'
                                  }}
                                />
                              )}
                            </Box>
                            <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>
                              @{u.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
<TableCell sx={{ py: 1.6 }}>
                        <Tooltip title="Click to copy email address" arrow>
                          <Box
                            onClick={(e) => handleCopyEmail(u.email, e)}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.8,
                              cursor: 'pointer',
                              p: 0.5,
                              borderRadius: '6px',
                              '&:hover': { backgroundColor: '#f1f5f9' }
                            }}
                          >
                            <EmailRoundedIcon sx={{ fontSize: '15px', color: '#94a3b8' }} />
                            <Typography sx={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                              {u.email}
                            </Typography>
                            {copiedEmail === u.email && (
                              <CheckCircleRoundedIcon sx={{ fontSize: '13px', color: '#16a34a' }} />
                            )}
                          </Box>
                        </Tooltip>
                      </TableCell>
<TableCell sx={{ py: 1.6 }}>
                        <Chip
                          icon={<ShieldRoundedIcon sx={{ fontSize: '14px !important', color: `${roleStyle.color} !important` }} />}
                          label={u.role?.displayName || u.role?.name}
                          size="small"
                          sx={{
                            backgroundColor: roleStyle.bg,
                            border: `1px solid ${roleStyle.border}`,
                            color: roleStyle.chipColor,
                            fontWeight: 700,
                            fontSize: '11px',
                            borderRadius: '6px',
                            height: '24px',
                            boxShadow: 'none'
                          }}
                        />
                      </TableCell>
<TableCell sx={{ py: 1.6 }}>
                        <Tooltip title={canEdit ? 'Click to toggle active status' : ''} arrow>
                          <Chip
                            icon={
                              u.isActive ? (
                                <CheckCircleRoundedIcon sx={{ fontSize: '14px !important', color: '#16a34a' }} />
                              ) : (
                                <BlockRoundedIcon sx={{ fontSize: '14px !important', color: '#ef4444' }} />
                              )
                            }
                            label={u.isActive ? 'Active' : 'Disabled'}
                            size="small"
                            onClick={() => canEdit && handleToggleStatus(u)}
                            clickable={canEdit}
                            sx={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              height: '24px',
                              backgroundColor: u.isActive ? '#f0fdf4' : '#fee2e2',
                              color: u.isActive ? '#15803d' : '#b91c1c',
                              border: `1px solid ${u.isActive ? '#bbf7d0' : '#fecaca'}`,
                              borderRadius: '8px',
                              cursor: canEdit ? 'pointer' : 'default',
                              transition: 'all 0.15s ease',
                              '&:hover': canEdit
                                ? {
                                    backgroundColor: u.isActive ? '#dcfce7' : '#fecaca'
                                  }
                                : {}
                            }}
                          />
                        </Tooltip>
                      </TableCell>
<TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </Typography>
                      </TableCell>
<TableCell align="right" sx={{ py: 1.6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.8 }}>
                          {canEdit && (
                            <Tooltip title="Edit operator credentials & clearance" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEdit(u)}
                                sx={{
                                  color: '#64748b',
                                  backgroundColor: darkMode ? '#090e15' : '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  '&:hover': { color: '#16a34a', backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
                                }}
                              >
                                <EditRoundedIcon sx={{ fontSize: '16px' }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canDelete && (
                            <Tooltip
                              title={
                                isCurrent
                                  ? 'Self-deletion restricted'
                                  : 'Permanently remove account'
                              }
                              arrow
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={isCurrent}
                                  onClick={() => handleOpenDelete(u)}
                                  sx={{
                                    color: '#94a3b8',
                                    backgroundColor: darkMode ? '#090e15' : '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    '&:hover': { color: '#ef4444', backgroundColor: '#fef2f2', borderColor: '#fecaca' },
                                    '&.Mui-disabled': { opacity: 0.35 }
                                  }}
                                >
                                  <DeleteRoundedIcon sx={{ fontSize: '16px' }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Adaptive User Cards (< md) */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, p: 2 }}>
          {users.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                No operator accounts match the current filter criteria.
              </Typography>
            </Box>
          ) : (
            users.map((u) => {
              const roleStyle = getRoleStyle(u.role?.name || u.role);
              const isCurrent = currentUser?.username === u.username;
              const canEdit = hasPermission('users:manage') || currentUser?.role === 'super_admin';
              const canDelete = (hasPermission('users:manage') || currentUser?.role === 'super_admin') && !isCurrent;

              return (
                <Box
                  key={`user-card-${u.id || u.username}`}
                  sx={{
                    p: 2,
                    borderRadius: '14px',
                    backgroundColor: darkMode ? '#090e15' : '#f8fafc',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        src={u.avatar}
                        alt={u.fullName || u.username}
                        sx={{
                          width: 44,
                          height: 44,
                          border: '2px solid #e2e8f0',
                          backgroundColor: roleStyle.bg,
                          color: roleStyle.chipColor,
                          fontWeight: 800,
                          fontSize: '15px'
                        }}
                      >
                        {(u.fullName || u.username || 'U')[0].toUpperCase()}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: '14px', fontWeight: 800, color: darkMode ? '#ffffff' : '#1e293b' }}>
                            {u.fullName || u.username}
                          </Typography>
                          {isCurrent && (
                            <Chip
                              label="You"
                              size="small"
                              sx={{
                                height: '18px',
                                fontSize: '10px',
                                fontWeight: 800,
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                border: '1px solid #bbf7d0'
                              }}
                            />
                          )}
                        </Box>
                        <Typography sx={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>
                          @{u.username}
                        </Typography>
                      </Box>
                    </Box>

                    <Tooltip title={canEdit ? 'Click to toggle status' : ''} arrow>
                      <Chip
                        icon={
                          u.isActive ? (
                            <CheckCircleRoundedIcon sx={{ fontSize: '14px !important', color: '#16a34a' }} />
                          ) : (
                            <BlockRoundedIcon sx={{ fontSize: '14px !important', color: '#ef4444' }} />
                          )
                        }
                        label={u.isActive ? 'Active' : 'Disabled'}
                        size="small"
                        clickable={canEdit}
                        onClick={canEdit ? () => handleToggleStatus(u) : undefined}
                        sx={{
                          backgroundColor: u.isActive ? (darkMode ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4') : (darkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2'),
                          color: u.isActive ? (darkMode ? '#4ade80' : '#16a34a') : (darkMode ? '#f87171' : '#ef4444'),
                          border: `1px solid ${u.isActive ? (darkMode ? 'rgba(74, 222, 128, 0.3)' : '#bbf7d0') : (darkMode ? 'rgba(248, 113, 113, 0.3)' : '#fecaca')}`,
                          fontWeight: 700,
                          fontSize: '11px',
                          borderRadius: '6px',
                          height: '24px'
                        }}
                      />
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, pt: 0.5, borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #edf2f7' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Chip
                        icon={<ShieldRoundedIcon sx={{ fontSize: '14px !important', color: `${roleStyle.color} !important` }} />}
                        label={u.role?.displayName || u.role?.name}
                        size="small"
                        sx={{
                          backgroundColor: roleStyle.bg,
                          border: `1px solid ${roleStyle.border}`,
                          color: roleStyle.chipColor,
                          fontWeight: 700,
                          fontSize: '11px',
                          borderRadius: '6px',
                          height: '24px'
                        }}
                      />

                      <Tooltip title="Click to copy email address" arrow>
                        <Box
                          onClick={(e) => handleCopyEmail(u.email, e)}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.8,
                            cursor: 'pointer',
                            p: 0.5,
                            borderRadius: '6px',
                            '&:hover': { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }
                          }}
                        >
                          <EmailRoundedIcon sx={{ fontSize: '14px', color: '#94a3b8' }} />
                          <Typography sx={{ fontSize: '12px', color: darkMode ? '#cbd5e1' : '#334155', fontWeight: 500 }}>
                            {u.email}
                          </Typography>
                          {copiedEmail === u.email && (
                            <CheckCircleRoundedIcon sx={{ fontSize: '12px', color: '#16a34a' }} />
                          )}
                        </Box>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #edf2f7' }}>
                    <Typography sx={{ fontSize: '11.5px', color: '#64748b' }}>
                      Created: {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      {canEdit && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditRoundedIcon sx={{ fontSize: '15px !important' }} />}
                          onClick={() => handleOpenEdit(u)}
                          sx={{
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: '8px',
                            color: '#16a34a',
                            borderColor: darkMode ? 'rgba(22, 163, 74, 0.4)' : '#cbd5e1',
                            minHeight: '36px',
                            px: 1.5,
                            '&:hover': {
                              borderColor: '#16a34a',
                              backgroundColor: 'rgba(22, 163, 74, 0.08)'
                            }
                          }}
                        >
                          Edit
                        </Button>
                      )}

                      {canDelete && (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDelete(u)}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '8px',
                            border: darkMode ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid #fee2e2',
                            color: '#ef4444',
                            '&:hover': { backgroundColor: '#fef2f2' }
                          }}
                        >
                          <DeleteRoundedIcon sx={{ fontSize: '16px' }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Card>
<Dialog
        open={createModalOpen}
        onClose={() => !actionLoading && setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.18)'
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: '#0f172a',
            p: 3,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <PersonAddRoundedIcon sx={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '18px' }}>
                Create New Operator Account
              </Typography>
              <Typography sx={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                Provision credentials and assign an RBAC security clearance.
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={() => !actionLoading && setCreateModalOpen(false)}
            sx={{
              color: '#ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: '18px' }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '12.5px' }}>
              {formError}
            </Alert>
          )}

          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                Full Name & Title
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Dr. Salman Tariq (Regional Lead)"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonRoundedIcon sx={{ fontSize: '19px', color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px', fontSize: '13px' }
                }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                  System Username *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. salman_env"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AlternateEmailRoundedIcon sx={{ fontSize: '17px', color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '10px', fontSize: '13px', fontFamily: 'monospace' }
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                  Official Email *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  placeholder="salman@epa.punjab.gov.pk"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon sx={{ fontSize: '18px', color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '10px', fontSize: '13px' }
                  }}
                />
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                Initial Password * (minimum 6 characters)
              </Typography>
              <TextField
                fullWidth
                size="small"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter strong security passphrase"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRoundedIcon sx={{ fontSize: '18px', color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <VisibilityOffRoundedIcon sx={{ fontSize: '18px' }} />
                        ) : (
                          <VisibilityRoundedIcon sx={{ fontSize: '18px' }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px', fontSize: '13px' }
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                Assigned Role Clearance *
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  renderValue={(selectedId) => {
                    const r = roles.find((x) => x.id === selectedId);
                    if (!r) return 'Select role clearance...';
                    const style = getRoleStyle(r.name);
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShieldRoundedIcon sx={{ fontSize: '15px', color: style.chipColor }} />
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b' }}>
                          {r.displayName}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          (@{r.name})
                        </Typography>
                      </Box>
                    );
                  }}
                  sx={{ borderRadius: '10px', fontSize: '13px' }}
                >
                  {roles.map((r) => {
                    const style = getRoleStyle(r.name);
                    return (
                      <MenuItem key={r.id} value={r.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ShieldRoundedIcon sx={{ fontSize: '16px', color: style.chipColor }} />
                            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b' }}>
                              {r.displayName}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                            @{r.name}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                backgroundColor: darkMode ? '#090e15' : '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b' }}>
                  Account Active Status
                </Typography>
                <Typography sx={{ fontSize: '11.5px', color: '#64748b' }}>
                  Allow immediate credential authentication into the portal
                </Typography>
              </Box>

              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                color="primary"
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 3, borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0', backgroundColor: darkMode ? '#090e15' : '#f8fafc' }}>
          <Button
            onClick={() => setCreateModalOpen(false)}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSubmit}
            disabled={actionLoading}
            sx={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '8px',
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#15803d',
                boxShadow: 'none'
              }
            }}
          >
            {actionLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>
<Dialog
        open={editModalOpen}
        onClose={() => !actionLoading && setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.18)'
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: '#0f172a',
            p: 3,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <EditRoundedIcon sx={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '18px' }}>
                  Edit Operator Profile
                </Typography>
                <Chip
                  label={`@${activeUser?.username}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '11px',
                    height: '22px'
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', mt: 0.2 }}>
                Update operator credentials, change clearance roles, or toggle account status.
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={() => !actionLoading && setEditModalOpen(false)}
            sx={{
              color: '#ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: '18px' }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '12.5px' }}>
              {formError}
            </Alert>
          )}

          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                Full Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonRoundedIcon sx={{ fontSize: '19px', color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px', fontSize: '13px' }
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                Official Email Address
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailRoundedIcon sx={{ fontSize: '18px', color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px', fontSize: '13px' }
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                Assigned Role Clearance
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  renderValue={(selectedId) => {
                    const r = roles.find((x) => x.id === selectedId);
                    if (!r) return 'Select role clearance...';
                    const style = getRoleStyle(r.name);
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShieldRoundedIcon sx={{ fontSize: '15px', color: style.chipColor }} />
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b' }}>
                          {r.displayName}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          (@{r.name})
                        </Typography>
                      </Box>
                    );
                  }}
                  sx={{ borderRadius: '10px', fontSize: '13px' }}
                >
                  {roles.map((r) => {
                    const style = getRoleStyle(r.name);
                    return (
                      <MenuItem key={r.id} value={r.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ShieldRoundedIcon sx={{ fontSize: '16px', color: style.chipColor }} />
                            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b' }}>
                              {r.displayName}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                            @{r.name}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                Reset Passphrase (Optional — leave empty to keep unchanged)
              </Typography>
              <TextField
                fullWidth
                size="small"
                type={showPassword ? 'text' : 'password'}
                placeholder="New password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockResetRoundedIcon sx={{ fontSize: '19px', color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <VisibilityOffRoundedIcon sx={{ fontSize: '18px' }} />
                        ) : (
                          <VisibilityRoundedIcon sx={{ fontSize: '18px' }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px', fontSize: '13px' }
                }}
              />
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                backgroundColor: darkMode ? '#090e15' : '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b' }}>
                  Account Active
                </Typography>
                <Typography sx={{ fontSize: '11.5px', color: '#64748b' }}>
                  {formData.isActive ? 'Operator can access system feeds and tools' : 'Login access is currently blocked'}
                </Typography>
              </Box>

              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                color="primary"
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 3, borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0', backgroundColor: darkMode ? '#090e15' : '#f8fafc' }}>
          <Button
            onClick={() => setEditModalOpen(false)}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={actionLoading}
            sx={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '8px',
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#15803d',
                boxShadow: 'none'
              }
            }}
          >
            {actionLoading ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
<Dialog
        open={deleteModalOpen}
        onClose={() => !actionLoading && setDeleteModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', backgroundColor: darkMode ? '#0f172a' : '#ffffff', border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none', color: darkMode ? '#ffffff' : 'inherit', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '18px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberRoundedIcon sx={{ color: '#ef4444' }} />
          Confirm Account Deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.55 }}>
            Are you sure you want to permanently delete operator{' '}
            <strong>@{activeUser?.username}</strong> ({activeUser?.fullName || 'No display name'})?
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#64748b', mt: 1.5, backgroundColor: '#fef2f2', p: 1.5, borderRadius: '8px', border: '1px solid #fee2e2' }}>
            All active login sessions for this account will be terminated immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSubmit}
            disabled={actionLoading}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              px: 2.5,
              '&:hover': { backgroundColor: '#dc2626' }
            }}
          >
            {actionLoading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
