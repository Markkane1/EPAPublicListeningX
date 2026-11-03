import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Fade from '@mui/material/Fade';

// Icons
import AddModeratorRoundedIcon from '@mui/icons-material/AddModeratorRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import RemoveDoneRoundedIcon from '@mui/icons-material/RemoveDoneRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ContentPasteGoRoundedIcon from '@mui/icons-material/ContentPasteGoRounded';

// Module Icons matching the app navigation
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import { getRoles, createRole, updateRole, deleteRole, getPermissions } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Module metadata & design definitions
const MODULE_CONFIG = {
  'Dashboard': {
    icon: DashboardRoundedIcon,
    color: '#5e72e4',
    bg: '#eff6ff',
    border: '#bfdbfe',
    desc: 'AQI metrics, executive KPIs, smog alerts & live stream summary'
  },
  'Posts Feed': {
    icon: FormatListBulletedRoundedIcon,
    color: '#0ea5e9',
    bg: '#f0f9ff',
    border: '#bae6fd',
    desc: 'Real-time air intelligence feed, search, batch ingest & export'
  },
  'Analytics': {
    icon: BarChartRoundedIcon,
    color: '#825ee4',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    desc: 'District breakdowns, temporal pollution trends & viral telemetry'
  },
  'Deduplication Audit': {
    icon: FactCheckRoundedIcon,
    color: '#fb6340',
    bg: '#fff7ed',
    border: '#fed7aa',
    desc: 'Duplicate merges, content similarity hashes & provenance logs'
  },
  'Noise & Learning Engine': {
    icon: CleaningServicesRoundedIcon,
    color: '#2dce89',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    desc: 'Spam exclusion, noise pool review & deterministic rule engine'
  },
  'User Management': {
    icon: PeopleAltRoundedIcon,
    color: '#344767',
    bg: '#f8fafc',
    border: '#e2e8f0',
    desc: 'Operator credentials, clearances & account provisioning'
  },
  'Role Management': {
    icon: AdminPanelSettingsRoundedIcon,
    color: '#7928ca',
    bg: '#faf5ff',
    border: '#e9d5ff',
    desc: 'RBAC policies, granular capabilities & clearance boundaries'
  },
  'System Settings': {
    icon: TuneRoundedIcon,
    color: '#f5365c',
    bg: '#fff1f2',
    border: '#fecdd3',
    desc: 'X API keys, sentiment algorithms & SQLite storage health'
  }
};

// Distinct role visual identities
const ROLE_THEMES = {
  super_admin: {
    color: '#7928ca',
    gradient: 'linear-gradient(135deg, #7928ca 0%, #ff0080 100%)',
    bg: '#faf5ff',
    border: '#e9d5ff',
    badgeBg: '#f3e8ff',
    badgeColor: '#7e22ce',
    icon: ShieldRoundedIcon
  },
  analyst: {
    color: '#1171ef',
    gradient: 'linear-gradient(135deg, #1171ef 0%, #11cdef 100%)',
    bg: '#f0f9ff',
    border: '#bae6fd',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
    icon: BarChartRoundedIcon
  },
  auditor: {
    color: '#fb6340',
    gradient: 'linear-gradient(135deg, #fb6340 0%, #fbb140 100%)',
    bg: '#fff7ed',
    border: '#fed7aa',
    badgeBg: '#ffedd5',
    badgeColor: '#c2410c',
    icon: FactCheckRoundedIcon
  },
  viewer: {
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
    bg: '#f8fafc',
    border: '#e2e8f0',
    badgeBg: '#f1f5f9',
    badgeColor: '#475569',
    icon: SecurityRoundedIcon
  },
  custom: {
    color: '#2dce89',
    gradient: 'linear-gradient(135deg, #2dce89 0%, #2dcecc 100%)',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
    icon: AddModeratorRoundedIcon
  }
};

function getRoleTheme(roleName) {
  return ROLE_THEMES[roleName] || ROLE_THEMES.custom;
}

export default function RolesView() {
  const { hasPermission } = useAuth();

  const [roles, setRoles] = useState([]);
  const [permissionsData, setPermissionsData] = useState({ permissions: [], byModule: {} });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'system', 'custom'

  // Modal States
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissionIds: []
  });
  const [originalPermissionIds, setOriginalPermissionIds] = useState([]);
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', severity: 'success' });

  // Modal internal navigation & permission search
  const [activeModuleTab, setActiveModuleTab] = useState('ALL');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [copiedSlug, setCopiedSlug] = useState('');

  const canCreate = hasPermission('roles.create');
  const canEdit = hasPermission('roles.edit');
  const canDelete = hasPermission('roles.delete');

  const showToast = (message, severity = 'success') => {
    setToast({ show: true, message, severity });
    setTimeout(() => setToast({ show: false, message: '', severity: 'success' }), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesList, permsList] = await Promise.all([
        getRoles(),
        getPermissions()
      ]);
      setRoles(rolesList || []);
      setPermissionsData(permsList || { permissions: [], byModule: {} });
    } catch (err) {
      showToast(err.message || 'Failed to load roles and permissions registry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.displayName.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (typeFilter === 'system') return r.isSystem;
      if (typeFilter === 'custom') return !r.isSystem;
      return true;
    });
  }, [roles, searchQuery, typeFilter]);

  // Overall Statistics
  const totalOperatorsCount = useMemo(() => {
    return roles.reduce((sum, r) => sum + (r.userCount || 0), 0);
  }, [roles]);

  const totalPermissionsCount = useMemo(() => {
    return permissionsData.permissions ? permissionsData.permissions.length : 20;
  }, [permissionsData]);

  // Open Config Modal for Existing Role
  const handleOpenEdit = (role) => {
    setFormError('');
    setActiveRole(role);
    setIsCreatingNew(false);
    const existingPermIds = role.permissions ? role.permissions.map((p) => p.id) : [];
    setFormData({
      name: role.name,
      displayName: role.displayName || role.name,
      description: role.description || '',
      permissionIds: [...existingPermIds]
    });
    setOriginalPermissionIds([...existingPermIds]);
    setActiveModuleTab('ALL');
    setPermissionSearch('');
    setConfigModalOpen(true);
  };

  // Open Modal for New Custom Role
  const handleOpenCreate = () => {
    setFormError('');
    setActiveRole(null);
    setIsCreatingNew(true);
    // Pre-populate with standard viewer permissions as safe baseline
    const viewerRole = roles.find((r) => r.name === 'viewer');
    const defaultPerms = viewerRole && viewerRole.permissions ? viewerRole.permissions.map((p) => p.id) : [];
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissionIds: defaultPerms
    });
    setOriginalPermissionIds(defaultPerms);
    setActiveModuleTab('ALL');
    setPermissionSearch('');
    setConfigModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (role) => {
    setActiveRole(role);
    setDeleteModalOpen(true);
  };

  // Copy slug helper
  const handleCopySlug = (slug, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(''), 2000);
  };

  // Permission toggles
  const handleTogglePermission = (permId) => {
    setFormData((prev) => {
      const exists = prev.permissionIds.includes(permId);
      const updated = exists
        ? prev.permissionIds.filter((id) => id !== permId)
        : [...prev.permissionIds, permId];
      return { ...prev, permissionIds: updated };
    });
  };

  // Module Bulk Toggle
  const handleToggleModuleAll = (moduleName) => {
    const modulePerms = permissionsData.byModule[moduleName] || [];
    const moduleIds = modulePerms.map((p) => p.id);
    const allSelected = moduleIds.every((id) => formData.permissionIds.includes(id));

    setFormData((prev) => {
      let updated;
      if (allSelected) {
        updated = prev.permissionIds.filter((id) => !moduleIds.includes(id));
      } else {
        const toAdd = moduleIds.filter((id) => !prev.permissionIds.includes(id));
        updated = [...prev.permissionIds, ...toAdd];
      }
      return { ...prev, permissionIds: updated };
    });
  };

  // Global Bulk Actions
  const handleSelectAllGlobal = () => {
    const allIds = permissionsData.permissions.map((p) => p.id);
    setFormData((prev) => ({ ...prev, permissionIds: allIds }));
  };

  const handleClearAllGlobal = () => {
    setFormData((prev) => ({ ...prev, permissionIds: [] }));
  };

  const handleResetToOriginal = () => {
    setFormData((prev) => ({ ...prev, permissionIds: [...originalPermissionIds] }));
  };

  // Submit Modal Handler (Create or Update)
  const handleSaveModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormError('');

    if (!formData.displayName.trim()) {
      setFormError('Role Display Name is required.');
      return;
    }

    if (isCreatingNew) {
      const slug = (formData.name || formData.displayName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');

      if (!slug || slug.length < 2) {
        setFormError('System identifier must be at least 2 characters.');
        return;
      }

      setActionLoading(true);
      try {
        await createRole({
          name: slug,
          displayName: formData.displayName.trim(),
          description: formData.description.trim(),
          permissionIds: formData.permissionIds
        });
        setConfigModalOpen(false);
        showToast(`Custom role '${formData.displayName}' created successfully!`, 'success');
        loadData();
      } catch (err) {
        setFormError(err.message || 'Failed to create role.');
      } finally {
        setActionLoading(false);
      }
    } else {
      setActionLoading(true);
      try {
        await updateRole(activeRole.id, {
          displayName: formData.displayName.trim(),
          description: formData.description.trim(),
          permissionIds: formData.permissionIds
        });
        setConfigModalOpen(false);
        showToast(`Role '${activeRole.displayName}' permissions updated successfully!`, 'success');
        loadData();
      } catch (err) {
        setFormError(err.message || 'Failed to update role.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteSubmit = async () => {
    if (!activeRole) return;
    setActionLoading(true);
    try {
      await deleteRole(activeRole.id);
      setDeleteModalOpen(false);
      showToast(`Custom role '${activeRole.displayName}' deleted.`, 'info');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete role.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Compute permission coverage for modal & cards
  const getModuleCoverage = (moduleName, currentPermIds) => {
    const modulePerms = permissionsData.byModule[moduleName] || [];
    if (!modulePerms.length) return { granted: 0, total: 0, status: 'none' };
    const granted = modulePerms.filter((p) => currentPermIds.includes(p.id)).length;
    let status = 'none';
    if (granted === modulePerms.length) status = 'full';
    else if (granted > 0) status = 'partial';
    return { granted, total: modulePerms.length, status };
  };

  return (
    <Box sx={{ width: '100%', pb: 5 }}>
      {/* Toast Notification Banner */}
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

      {/* Top Executive Header Bar */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          borderRadius: '16px',
          boxShadow: '0 8px 26px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9',
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
              background: 'linear-gradient(135deg, #7928ca 0%, #ff0080 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 6px 18px rgba(121, 40, 202, 0.3)',
              flexShrink: 0
            }}
          >
            <AdminPanelSettingsRoundedIcon sx={{ fontSize: '28px' }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 800,
                  color: '#1e293b',
                  letterSpacing: '-0.3px',
                  fontSize: { xs: '20px', md: '22px' }
                }}
              >
                Role & Permission Policies
              </Typography>
              <Chip
                label={`${roles.length} Defined Roles`}
                size="small"
                sx={{
                  backgroundColor: '#f3e8ff',
                  color: '#7e22ce',
                  fontWeight: 700,
                  fontSize: '11px',
                  borderRadius: '8px',
                  height: '24px'
                }}
              />
              <Chip
                icon={<SecurityRoundedIcon sx={{ fontSize: '14px !important', color: '#16a34a' }} />}
                label="RBAC Enforced"
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
              Administer role-based access control (RBAC), security clearances, and operational restrictions across the EPA intelligence network.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
          {canCreate && (
            <Button
              variant="contained"
              onClick={handleOpenCreate}
              startIcon={<AddModeratorRoundedIcon sx={{ fontSize: '19px !important' }} />}
              sx={{
                background: 'linear-gradient(135deg, #7928ca 0%, #ff0080 100%)',
                color: '#ffffff',
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '13.5px',
                px: 2.8,
                py: 1.1,
                boxShadow: '0 4px 16px rgba(121, 40, 202, 0.35)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #651bb0 0%, #e00070 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(121, 40, 202, 0.45)'
                }
              }}
            >
              + New Custom Role
            </Button>
          )}
        </Box>
      </Card>

      {/* Security KPI Summary Strip */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 3
        }}
      >
        <Card sx={{ p: 2.2, borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: '#f3e8ff',
                color: '#7e22ce',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldRoundedIcon sx={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Defined Access Roles
              </Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                {roles.length}{' '}
                <Typography component="span" sx={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                  ({roles.filter((r) => r.isSystem).length} System / {roles.filter((r) => !r.isSystem).length} Custom)
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ p: 2.2, borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PeopleRoundedIcon sx={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Governed Operators
              </Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                {totalOperatorsCount}{' '}
                <Typography component="span" sx={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                  Active Accounts
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ p: 2.2, borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RuleRoundedIcon sx={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Granular Permissions
              </Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                {totalPermissionsCount}{' '}
                <Typography component="span" sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                  Rules (8 Modules)
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ p: 2.2, borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: '#fff7ed',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LockRoundedIcon sx={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Clearance Matrix
              </Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                Strict Isolation{' '}
                <Typography component="span" sx={{ fontSize: '11.5px', fontWeight: 600, color: '#0284c7' }}>
                  Verified
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Control Filter Bar */}
      <Card
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '14px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 18px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ flex: 1, width: '100%', maxWidth: { xs: '100%', sm: 380 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search roles by name, slug or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: '19px', color: '#94a3b8' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseRoundedIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: '10px', fontSize: '13px', backgroundColor: '#f8fafc' }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#64748b', mr: 0.5 }}>
            Filter:
          </Typography>
          {[
            { id: 'all', label: `All Roles (${roles.length})` },
            { id: 'system', label: `System (${roles.filter((r) => r.isSystem).length})` },
            { id: 'custom', label: `Custom (${roles.filter((r) => !r.isSystem).length})` }
          ].map((tab) => {
            const isSelected = typeFilter === tab.id;
            return (
              <Button
                key={tab.id}
                size="small"
                onClick={() => setTypeFilter(tab.id)}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 600,
                  borderRadius: '8px',
                  px: 1.8,
                  py: 0.5,
                  backgroundColor: isSelected ? '#334155' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : '#475569',
                  '&:hover': {
                    backgroundColor: isSelected ? '#1e293b' : '#e2e8f0'
                  }
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Box>
      </Card>

      {/* Main Roles Grid */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ color: '#7928ca', mb: 2 }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
            Loading roles and permission clearance registry...
          </Typography>
        </Box>
      ) : filteredRoles.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <ShieldRoundedIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>
            No roles match your filter criteria
          </Typography>
          <Typography sx={{ fontSize: '13px', color: '#64748b', mt: 0.5 }}>
            Try clearing your search query or reset the filter selection.
          </Typography>
          <Button
            size="small"
            onClick={() => { setSearchQuery(''); setTypeFilter('all'); }}
            sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 3
          }}
        >
          {filteredRoles.map((r) => {
            const isSuperAdmin = r.name === 'super_admin';
            const permCount = r.permissionCount || (r.permissions ? r.permissions.length : 0);
            const coveragePct = Math.round((permCount / totalPermissionsCount) * 100);
            const theme = getRoleTheme(r.name);
            const RoleIconComponent = theme.icon;
            const rolePermIds = r.permissions ? r.permissions.map((p) => p.id) : [];

            return (
              <Card
                key={r.id}
                sx={{
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                    borderColor: theme.border
                  }
                }}
              >
                {/* Top Accent Strip */}
                <Box
                  sx={{
                    height: '5px',
                    width: '100%',
                    background: theme.gradient
                  }}
                />

                <Box sx={{ p: 3 }}>
                  {/* Card Header: Icon, Titles, Badges, Quick Actions */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '14px',
                          background: theme.gradient,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 4px 14px ${theme.color}40`,
                          flexShrink: 0
                        }}
                      >
                        <RoleIconComponent sx={{ fontSize: '26px' }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: '17px', fontWeight: 800, color: '#1e293b' }}>
                            {r.displayName}
                          </Typography>
                          {isSuperAdmin && (
                            <Chip
                              label="Apex Authority"
                              size="small"
                              sx={{
                                height: '20px',
                                fontSize: '10px',
                                fontWeight: 800,
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a'
                              }}
                            />
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
                          <Tooltip title="Copy role slug identifier" arrow>
                            <Box
                              onClick={(e) => handleCopySlug(r.name, e)}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1,
                                py: 0.2,
                                borderRadius: '6px',
                                backgroundColor: '#f1f5f9',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                '&:hover': { backgroundColor: '#e2e8f0' }
                              }}
                            >
                              <Typography sx={{ fontSize: '11.5px', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                                @{r.name}
                              </Typography>
                              {copiedSlug === r.name ? (
                                <CheckCircleRoundedIcon sx={{ fontSize: '13px', color: '#16a34a' }} />
                              ) : (
                                <ContentCopyRoundedIcon sx={{ fontSize: '12px', color: '#94a3b8' }} />
                              )}
                            </Box>
                          </Tooltip>

                          {r.isSystem ? (
                            <Chip
                              icon={<LockRoundedIcon sx={{ fontSize: '11px !important' }} />}
                              label="System Core"
                              size="small"
                              sx={{
                                height: '20px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                backgroundColor: '#f8fafc',
                                color: '#64748b',
                                border: '1px solid #e2e8f0'
                              }}
                            />
                          ) : (
                            <Chip
                              label="Custom Policy"
                              size="small"
                              sx={{
                                height: '20px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* Quick action buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {canEdit && (
                        <Tooltip title="Configure role permissions" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(r)}
                            sx={{
                              color: '#64748b',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              '&:hover': { color: '#5e72e4', backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
                            }}
                          >
                            <EditRoundedIcon sx={{ fontSize: '16px' }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canDelete && !r.isSystem && (
                        <Tooltip title={r.userCount > 0 ? 'Cannot delete: role has assigned operators' : 'Delete custom role'} arrow>
                          <span>
                            <IconButton
                              size="small"
                              disabled={r.userCount > 0}
                              onClick={() => handleOpenDelete(r)}
                              sx={{
                                color: '#94a3b8',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                '&:hover': { color: '#ef4444', backgroundColor: '#fef2f2', borderColor: '#fecaca' },
                                '&.Mui-disabled': { opacity: 0.4 }
                              }}
                            >
                              <DeleteRoundedIcon sx={{ fontSize: '16px' }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  {/* Role Description */}
                  <Typography
                    sx={{
                      fontSize: '13px',
                      color: '#475569',
                      lineHeight: 1.55,
                      minHeight: '40px',
                      mb: 2.2
                    }}
                  >
                    {r.description || 'Standard role configuration for agency operations.'}
                  </Typography>

                  {/* Stats Strip with Progress Bar */}
                  <Box
                    sx={{
                      p: 1.8,
                      borderRadius: '12px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      mb: 2.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleRoundedIcon sx={{ fontSize: '17px', color: '#64748b' }} />
                        <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                          {r.userCount || 0} {r.userCount === 1 ? 'Operator Assigned' : 'Operators Assigned'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <RuleRoundedIcon sx={{ fontSize: '16px', color: theme.color }} />
                        <Typography sx={{ fontSize: '12.5px', fontWeight: 800, color: theme.color }}>
                          {permCount} of {totalPermissionsCount} Perms
                        </Typography>
                        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                          ({coveragePct}%)
                        </Typography>
                      </Box>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={coveragePct}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          background: theme.gradient,
                          borderRadius: 3
                        }
                      }}
                    />
                  </Box>

                  {/* Module Access Clearance Heatmap */}
                  <Box sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', mb: 1 }}>
                      Module Operational Clearances:
                    </Typography>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                        gap: 1
                      }}
                    >
                      {Object.keys(MODULE_CONFIG).map((modName) => {
                        const conf = MODULE_CONFIG[modName];
                        const coverage = getModuleCoverage(modName, rolePermIds);
                        const ModIcon = conf.icon;

                        let badgeBg = '#f1f5f9';
                        let badgeBorder = '#e2e8f0';
                        let badgeTextColor = '#94a3b8';
                        let iconColor = '#94a3b8';
                        let statusText = 'Locked';

                        if (coverage.status === 'full') {
                          badgeBg = '#f0fdf4';
                          badgeBorder = '#bbf7d0';
                          badgeTextColor = '#166534';
                          iconColor = '#16a34a';
                          statusText = 'Full';
                        } else if (coverage.status === 'partial') {
                          badgeBg = '#fff7ed';
                          badgeBorder = '#fed7aa';
                          badgeTextColor = '#c2410c';
                          iconColor = '#ea580c';
                          statusText = `${coverage.granted}/${coverage.total}`;
                        }

                        return (
                          <Tooltip
                            key={modName}
                            title={`${modName}: ${coverage.granted} of ${coverage.total} permissions enabled.`}
                            arrow
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1,
                                borderRadius: '8px',
                                backgroundColor: badgeBg,
                                border: `1px solid ${badgeBorder}`,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, overflow: 'hidden' }}>
                                <ModIcon sx={{ fontSize: '15px', color: iconColor, flexShrink: 0 }} />
                                <Typography
                                  noWrap
                                  sx={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: coverage.status !== 'none' ? '#1e293b' : '#94a3b8'
                                  }}
                                >
                                  {modName.replace(' Engine', '').replace(' Management', '')}
                                </Typography>
                              </Box>

                              <Typography
                                sx={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  color: badgeTextColor,
                                  ml: 0.5,
                                  flexShrink: 0
                                }}
                              >
                                {statusText}
                              </Typography>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>

                {/* Card Action Footer */}
                {canEdit && (
                  <Box
                    sx={{
                      p: 2,
                      px: 3,
                      backgroundColor: '#f8fafc',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                      {isSuperAdmin ? 'System core clearance policy' : 'Operational agency clearance'}
                    </Typography>

                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenEdit(r)}
                      startIcon={<EditRoundedIcon sx={{ fontSize: '15px !important' }} />}
                      sx={{
                        textTransform: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        borderColor: '#cbd5e1',
                        color: '#334155',
                        borderRadius: '8px',
                        px: 2,
                        py: 0.6,
                        backgroundColor: '#ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: theme.color,
                          color: theme.color,
                          backgroundColor: '#ffffff',
                          boxShadow: `0 4px 12px ${theme.color}25`
                        }
                      }}
                    >
                      Configure Permissions
                    </Button>
                  </Box>
                )}
              </Card>
            );
          })}
        </Box>
      )}

      {/* OVERHAULED CONFIGURE ROLE MODAL */}
      <Dialog
        open={configModalOpen}
        onClose={() => !actionLoading && setConfigModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }
        }}
      >
        {/* Modal Header Banner */}
        <Box
          sx={{
            background: isCreatingNew
              ? 'linear-gradient(135deg, #7928ca 0%, #ff0080 100%)'
              : getRoleTheme(activeRole?.name).gradient,
            p: 3,
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                }}
              >
                {isCreatingNew ? (
                  <AddModeratorRoundedIcon sx={{ fontSize: '28px' }} />
                ) : (
                  <AdminPanelSettingsRoundedIcon sx={{ fontSize: '28px' }} />
                )}
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '20px' }}>
                    {isCreatingNew ? 'Create New Operational Role' : `Configure Role: ${activeRole?.displayName}`}
                  </Typography>
                  {!isCreatingNew && (
                    <Chip
                      label={`@${activeRole?.name}`}
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
                  )}
                  {activeRole?.isSystem && (
                    <Chip
                      icon={<LockRoundedIcon sx={{ fontSize: '11px !important', color: '#ffffff !important' }} />}
                      label="System Core"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '10.5px',
                        height: '22px'
                      }}
                    />
                  )}
                </Box>
                <Typography sx={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.9)', mt: 0.4 }}>
                  {isCreatingNew
                    ? 'Define a new agency clearance persona and grant selective capabilities.'
                    : 'Fine-tune operational capabilities, module boundaries, and execution authorities.'}
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={() => !actionLoading && setConfigModalOpen(false)}
              sx={{
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: '20px' }} />
            </IconButton>
          </Box>

          {/* Quick Metrics & Batch Actions Bar in Header */}
          <Box
            sx={{
              mt: 2.5,
              pt: 2,
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                Clearance Matrix:{' '}
                <Box component="span" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', px: 1, py: 0.2, borderRadius: '6px' }}>
                  {formData.permissionIds.length} of {totalPermissionsCount} Granted
                </Box>
              </Typography>
              <Typography sx={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                ({Math.round((formData.permissionIds.length / totalPermissionsCount) * 100)}% System Coverage)
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                onClick={handleSelectAllGlobal}
                startIcon={<DoneAllRoundedIcon sx={{ fontSize: '15px !important' }} />}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '6px',
                  px: 1.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
                }}
              >
                Grant All ({totalPermissionsCount})
              </Button>

              <Button
                size="small"
                onClick={handleClearAllGlobal}
                startIcon={<RemoveDoneRoundedIcon sx={{ fontSize: '15px !important' }} />}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '6px',
                  px: 1.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' }
                }}
              >
                Revoke All
              </Button>

              <Button
                size="small"
                onClick={handleResetToOriginal}
                startIcon={<RestartAltRoundedIcon sx={{ fontSize: '15px !important' }} />}
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '6px',
                  px: 1.5,
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.25)' }
                }}
              >
                Reset
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Modal Form Body */}
        <DialogContent
          sx={{
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flex: 1
          }}
        >
          {formError && (
            <Box sx={{ p: 2, pb: 0 }}>
              <Alert severity="error" sx={{ borderRadius: '10px', fontSize: '13px' }}>
                {formError}
              </Alert>
            </Box>
          )}

          {/* Role Metadata Row (Display Name, Slug, Description) */}
          <Box
            sx={{
              p: 2.5,
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                  Role Display Name *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. Regional Field Officer"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  InputProps={{ sx: { borderRadius: '8px', backgroundColor: '#ffffff', fontSize: '13px' } }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                  System Slug Identifier {activeRole?.isSystem && '(Protected)'}
                </Typography>
                <TextField
                  fullWidth
                  disabled={!isCreatingNew && activeRole?.isSystem}
                  size="small"
                  placeholder="e.g. regional_field_officer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  InputProps={{
                    sx: {
                      borderRadius: '8px',
                      backgroundColor: !isCreatingNew && activeRole?.isSystem ? '#f1f5f9' : '#ffffff',
                      fontFamily: 'monospace',
                      fontSize: '13px'
                    }
                  }}
                />
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.6 }}>
                Operational Scope & Description
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={1.8}
                placeholder="Describe role responsibilities, access parameters, and operational tier..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                InputProps={{ sx: { borderRadius: '8px', backgroundColor: '#ffffff', fontSize: '13px' } }}
              />
            </Box>
          </Box>

          {/* TWO-PANE PERMISSION CONFIGURATION WORKSPACE */}
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              overflow: 'hidden',
              minHeight: 380,
              flexDirection: { xs: 'column', md: 'row' }
            }}
          >
            {/* Left Column: Modules Navigation (280px) */}
            <Box
              sx={{
                width: { xs: '100%', md: 280 },
                borderRight: '1px solid #e2e8f0',
                borderBottom: { xs: '1px solid #e2e8f0', md: 'none' },
                backgroundColor: '#ffffff',
                overflowY: 'auto',
                p: 1.5,
                flexShrink: 0
              }}
            >
              <Box sx={{ px: 1, py: 0.8, mb: 1 }}>
                <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Module Domains
                </Typography>
              </Box>

              {/* All Modules Tab */}
              <Box
                onClick={() => setActiveModuleTab('ALL')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.2,
                  px: 1.5,
                  borderRadius: '10px',
                  mb: 0.8,
                  cursor: 'pointer',
                  backgroundColor: activeModuleTab === 'ALL' ? '#f1f5f9' : 'transparent',
                  border: activeModuleTab === 'ALL' ? '1px solid #cbd5e1' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': { backgroundColor: activeModuleTab === 'ALL' ? '#f1f5f9' : '#f8fafc' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <SecurityRoundedIcon sx={{ fontSize: '18px', color: activeModuleTab === 'ALL' ? '#1e293b' : '#64748b' }} />
                  <Typography sx={{ fontSize: '13px', fontWeight: activeModuleTab === 'ALL' ? 800 : 600, color: '#1e293b' }}>
                    All Permissions
                  </Typography>
                </Box>
                <Chip
                  label={`${formData.permissionIds.length}/${totalPermissionsCount}`}
                  size="small"
                  sx={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    height: '20px',
                    backgroundColor: formData.permissionIds.length === totalPermissionsCount ? '#dcfce7' : '#f1f5f9',
                    color: formData.permissionIds.length === totalPermissionsCount ? '#166534' : '#475569'
                  }}
                />
              </Box>

              {/* Each Individual Module Tab */}
              {Object.entries(permissionsData.byModule).map(([modName, perms]) => {
                const conf = MODULE_CONFIG[modName] || { icon: RuleRoundedIcon, color: '#5e72e4' };
                const ModIcon = conf.icon;
                const moduleIds = perms.map((p) => p.id);
                const grantedInMod = moduleIds.filter((id) => formData.permissionIds.includes(id)).length;
                const isSelected = activeModuleTab === modName;
                const allModGranted = moduleIds.length > 0 && grantedInMod === moduleIds.length;
                const someModGranted = grantedInMod > 0 && !allModGranted;

                return (
                  <Box
                    key={modName}
                    onClick={() => setActiveModuleTab(modName)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.1,
                      px: 1.4,
                      borderRadius: '10px',
                      mb: 0.6,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? conf.bg : 'transparent',
                      border: isSelected ? `1px solid ${conf.border || '#cbd5e1'}` : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: isSelected ? conf.bg : '#f8fafc'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                      <ModIcon sx={{ fontSize: '18px', color: conf.color, flexShrink: 0 }} />
                      <Typography
                        noWrap
                        sx={{
                          fontSize: '12.5px',
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? '#1e293b' : '#334155'
                        }}
                      >
                        {modName}
                      </Typography>
                    </Box>

                    <Chip
                      label={`${grantedInMod}/${moduleIds.length}`}
                      size="small"
                      sx={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        height: '20px',
                        backgroundColor: allModGranted ? '#dcfce7' : someModGranted ? '#ffedd5' : '#f1f5f9',
                        color: allModGranted ? '#166534' : someModGranted ? '#c2410c' : '#94a3b8'
                      }}
                    />
                  </Box>
                );
              })}
            </Box>

            {/* Right Column: Interactive Permission Tiles */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2.5,
                backgroundColor: '#fbfcfd'
              }}
            >
              {/* Permission Quick Filter Search */}
              <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Filter permissions by keyword (e.g. search, ingest, export, delete)..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ fontSize: '18px', color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: permissionSearch && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setPermissionSearch('')}>
                          <CloseRoundedIcon sx={{ fontSize: '15px' }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '10px', fontSize: '12.5px', backgroundColor: '#ffffff' }
                  }}
                />
              </Box>

              {/* Render Selected Module Content */}
              {Object.entries(permissionsData.byModule)
                .filter(([modName]) => activeModuleTab === 'ALL' || activeModuleTab === modName)
                .map(([modName, perms]) => {
                  const conf = MODULE_CONFIG[modName] || { icon: RuleRoundedIcon, color: '#5e72e4' };
                  const ModIcon = conf.icon;
                  const moduleIds = perms.map((p) => p.id);

                  // Filter permissions by search query if present
                  const filteredPerms = perms.filter((p) => {
                    const q = permissionSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      p.name.toLowerCase().includes(q) ||
                      p.code.toLowerCase().includes(q) ||
                      (p.description && p.description.toLowerCase().includes(q))
                    );
                  });

                  if (filteredPerms.length === 0) return null;

                  const allChecked = moduleIds.length > 0 && moduleIds.every((id) => formData.permissionIds.includes(id));
                  const grantedCount = moduleIds.filter((id) => formData.permissionIds.includes(id)).length;

                  return (
                    <Box key={modName} sx={{ mb: 3 }}>
                      {/* Module Header Bar */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.4,
                          px: 2,
                          borderRadius: '12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                          mb: 1.5
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <ModIcon sx={{ fontSize: '20px', color: conf.color }} />
                          <Box>
                            <Typography sx={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                              {modName}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                              {conf.desc}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Chip
                            label={`${grantedCount} of ${moduleIds.length} Granted`}
                            size="small"
                            sx={{
                              fontSize: '11px',
                              fontWeight: 700,
                              height: '22px',
                              backgroundColor: allChecked ? '#dcfce7' : grantedCount > 0 ? '#ffedd5' : '#f1f5f9',
                              color: allChecked ? '#166534' : grantedCount > 0 ? '#c2410c' : '#64748b'
                            }}
                          />

                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleToggleModuleAll(modName)}
                            sx={{
                              fontSize: '11.5px',
                              textTransform: 'none',
                              fontWeight: 700,
                              py: 0.3,
                              px: 1.2,
                              borderRadius: '6px',
                              borderColor: '#cbd5e1',
                              color: allChecked ? '#b91c1c' : '#334155',
                              '&:hover': {
                                borderColor: allChecked ? '#ef4444' : '#5e72e4',
                                backgroundColor: allChecked ? '#fef2f2' : '#f8fafc'
                              }
                            }}
                          >
                            {allChecked ? 'Revoke Module' : 'Grant Module'}
                          </Button>
                        </Box>
                      </Box>

                      {/* Permission Tiles Grid */}
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
                          gap: 1.5
                        }}
                      >
                        {filteredPerms.map((p) => {
                          const isChecked = formData.permissionIds.includes(p.id);
                          const isDangerous = p.code.includes('.delete') || p.code.includes('settings.manage');

                          return (
                            <Box
                              key={p.id}
                              onClick={() => handleTogglePermission(p.id)}
                              sx={{
                                p: 1.8,
                                borderRadius: '12px',
                                border: isChecked ? '1px solid #7928ca' : '1px solid #e2e8f0',
                                backgroundColor: isChecked ? '#fbf8ff' : '#ffffff',
                                boxShadow: isChecked ? '0 4px 14px rgba(121, 40, 202, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1.5,
                                transition: 'all 0.18s ease',
                                '&:hover': {
                                  borderColor: isChecked ? '#7928ca' : '#cbd5e1',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 6px 16px rgba(0,0,0,0.05)'
                                }
                              }}
                            >
                              <Checkbox
                                size="small"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(p.id)}
                                sx={{
                                  p: 0,
                                  mt: 0.2,
                                  color: '#cbd5e1',
                                  '&.Mui-checked': { color: '#7928ca' }
                                }}
                              />

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.3 }}>
                                  <Typography
                                    sx={{
                                      fontSize: '13px',
                                      fontWeight: isChecked ? 800 : 700,
                                      color: isChecked ? '#1e293b' : '#334155'
                                    }}
                                  >
                                    {p.name}
                                  </Typography>

                                  {isDangerous && (
                                    <Tooltip title="Elevated administrative action" arrow>
                                      <Chip
                                        icon={<WarningAmberRoundedIcon sx={{ fontSize: '11px !important', color: '#c2410c' }} />}
                                        label="Sensitive"
                                        size="small"
                                        sx={{
                                          height: '18px',
                                          fontSize: '9.5px',
                                          fontWeight: 800,
                                          backgroundColor: '#ffedd5',
                                          color: '#c2410c'
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>

                                <Typography sx={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4, mb: 0.8 }}>
                                  {p.description}
                                </Typography>

                                <Chip
                                  label={p.code}
                                  size="small"
                                  sx={{
                                    height: '18px',
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    backgroundColor: isChecked ? '#f3e8ff' : '#f1f5f9',
                                    color: isChecked ? '#7e22ce' : '#64748b'
                                  }}
                                />
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  );
                })}
            </Box>
          </Box>
        </DialogContent>

        {/* Modal Action Footer */}
        <DialogActions
          sx={{
            p: 2.2,
            px: 3,
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Permissions Selected:{' '}
              <Box component="span" sx={{ fontWeight: 800, color: '#7928ca' }}>
                {formData.permissionIds.length} of {totalPermissionsCount}
              </Box>
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
              ({Math.round((formData.permissionIds.length / totalPermissionsCount) * 100)}% clearance coverage)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              onClick={() => setConfigModalOpen(false)}
              disabled={actionLoading}
              sx={{
                textTransform: 'none',
                color: '#64748b',
                fontWeight: 700,
                fontSize: '13px',
                px: 2.5
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSaveModal}
              disabled={actionLoading}
              sx={{
                background: 'linear-gradient(135deg, #7928ca 0%, #ff0080 100%)',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '13.5px',
                borderRadius: '10px',
                px: 3.5,
                py: 1,
                boxShadow: '0 4px 14px rgba(121, 40, 202, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #651bb0 0%, #e00070 100%)'
                }
              }}
            >
              {actionLoading
                ? isCreatingNew
                  ? 'Creating Role...'
                  : 'Saving Clearances...'
                : isCreatingNew
                ? 'Create Custom Role'
                : 'Save Role & Permissions'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* DELETE CUSTOM ROLE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => !actionLoading && setDeleteModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '18px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberRoundedIcon sx={{ color: '#ef4444' }} />
          Delete Custom Role
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.55 }}>
            Are you sure you want to permanently delete role{' '}
            <strong>{activeRole?.displayName}</strong> (<code>@{activeRole?.name}</code>)?
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#64748b', mt: 1.5, backgroundColor: '#fef2f2', p: 1.5, borderRadius: '8px', border: '1px solid #fee2e2' }}>
            ⚠️ This action cannot be undone. Only custom roles with 0 assigned operators can be safely removed.
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
            {actionLoading ? 'Deleting...' : 'Delete Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
