import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import OutlinedInput from '@mui/material/OutlinedInput';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import { useArgonController } from 'context';
import { sanitizeUrl } from '../../utils/security';

function getStatusBadge(status, darkMode = false) {
  if (status === 'KEPT') {
    return (
      <Box
        sx={{
          display: 'inline-block',
          backgroundColor: darkMode ? 'rgba(45, 206, 137, 0.2)' : '#e6f8f0',
          color: darkMode ? '#4ade80' : '#0b5d3b',
          border: darkMode ? '1px solid rgba(45, 206, 137, 0.4)' : '1px solid #c2f0dc',
          px: 1,
          py: 0.3,
          borderRadius: '5px',
          fontSize: '10.5px',
          fontWeight: 700,
          letterSpacing: '0.4px',
        }}
      >
        KEPT
      </Box>
    );
  }
  if (status === 'DUPLICATE_MERGED') {
    return (
      <Box
        sx={{
          display: 'inline-block',
          backgroundColor: darkMode ? 'rgba(251, 99, 64, 0.2)' : '#fef3e2',
          color: darkMode ? '#fb923c' : '#fb6340',
          border: darkMode ? '1px solid rgba(251, 99, 64, 0.4)' : '1px solid #fedec0',
          px: 1,
          py: 0.3,
          borderRadius: '5px',
          fontSize: '10.5px',
          fontWeight: 700,
          letterSpacing: '0.4px',
        }}
      >
        MERGED
      </Box>
    );
  }
  return (
    <Box
      sx={{
        display: 'inline-block',
        backgroundColor: darkMode ? 'rgba(245, 54, 92, 0.2)' : '#fff5f5',
        color: darkMode ? '#f87171' : '#f5365c',
        border: darkMode ? '1px solid rgba(245, 54, 92, 0.4)' : '1px solid #fed7d7',
        px: 1,
        py: 0.3,
        borderRadius: '5px',
        fontSize: '10.5px',
        fontWeight: 700,
        letterSpacing: '0.4px',
      }}
    >
      EXCLUDED
    </Box>
  );
}

function AuditView({ auditLog }) {
  const [controller] = useArgonController();
  const { darkMode } = controller || {};
  const [tabIndex, setTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const keptCount = useMemo(() => auditLog.filter((a) => a.status === 'KEPT').length, [auditLog]);
  const mergedCount = useMemo(() => auditLog.filter((a) => a.status === 'DUPLICATE_MERGED').length, [auditLog]);
  const removedCount = useMemo(() => auditLog.filter((a) => a.status === 'REMOVED').length, [auditLog]);

  const filteredLogs = useMemo(() => {
    let list = [...auditLog];

    if (tabIndex === 1) {
      list = list.filter((a) => a.status === 'KEPT');
    } else if (tabIndex === 2) {
      list = list.filter((a) => a.status === 'DUPLICATE_MERGED');
    } else if (tabIndex === 3) {
      list = list.filter((a) => a.status === 'REMOVED');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          (a.author && a.author.toLowerCase().includes(q)) ||
          (a.reason && a.reason.toLowerCase().includes(q)) ||
          (a.category && a.category.toLowerCase().includes(q)) ||
          (a.text && a.text.toLowerCase().includes(q))
      );
    }

    return list;
  }, [auditLog, tabIndex, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setCurrentPage(1);
  };

  return (
    <Box sx={{ py: 2 }}>
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <FactCheckRoundedIcon sx={{ color: '#5e72e4', fontSize: '24px' }} />
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Open Sans", sans-serif',
              fontWeight: 700,
              color: darkMode ? '#ffffff' : '#1e293b',
              fontSize: { xs: '20px', md: '24px' },
            }}
          >
            Pipeline Deduplication & Exclusion Audit Log
          </Typography>
        </Box>
        <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontSize: '14px', color: darkMode ? '#94a3b8' : '#67748e' }}>
          Complete transparent audit trail of raw posts: kept clean posts, merged retweets/duplicates, and eliminated spam/out-of-region noise.
        </Typography>
      </Box>

      <Card
        sx={{
          p: 3,
          borderRadius: '16px',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
          backgroundColor: darkMode ? '#111c44' : '#ffffff',
          boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
            mb: 2.5,
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: '40px',
              maxWidth: '100%',
              '& .MuiTabs-scroller': {
                overflowX: 'auto !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#5e72e4',
                height: '3px',
                borderRadius: '3px',
              },
              '& .MuiTab-root': {
                minHeight: '40px',
                fontSize: { xs: '12px', sm: '13px' },
                fontWeight: 700,
                textTransform: 'none',
                fontFamily: '"Open Sans", sans-serif',
                color: darkMode ? '#94a3b8' : '#64748b',
                px: { xs: 1.5, sm: 2 },
                '&.Mui-selected': {
                  color: darkMode ? '#ffffff' : '#5e72e4',
                },
              },
            }}
          >
            <Tab label={`All Records (${auditLog.length})`} />
            <Tab label={`Kept Posts (${keptCount})`} />
            <Tab label={`Duplicates Merged (${mergedCount})`} />
            <Tab label={`Excluded Noise (${removedCount})`} />
          </Tabs>

          <Box sx={{ width: { xs: '100%', md: '280px' } }}>
            <OutlinedInput
              placeholder="Search audit log..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              startAdornment={
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '19px' }} />
                </InputAdornment>
              }
              size="small"
              fullWidth
              sx={{
                fontSize: '13px',
                borderRadius: '8px',
                fontFamily: '"Open Sans", sans-serif',
                backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                color: darkMode ? '#ffffff' : undefined,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
                },
              }}
            />
          </Box>
        </Box>

        {/* Desktop Table View */}
        <TableContainer sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
          <Table sx={{ minWidth: 950, width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '50px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '220px' }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: '80px' }} />
            </colgroup>
            <TableHead sx={{ display: 'table-header-group', backgroundColor: darkMode ? '#0b1437' : '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>#</TableCell>
                <TableCell sx={{ textAlign: 'left', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Status</TableCell>
                <TableCell sx={{ textAlign: 'left', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Filter Rule / Category</TableCell>
                <TableCell sx={{ textAlign: 'left', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Author</TableCell>
                <TableCell sx={{ textAlign: 'left', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Reason / Rationale</TableCell>
                <TableCell sx={{ textAlign: 'left', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Post Snippet</TableCell>
                <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>X.com</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.map((log, index) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + index + 1;
                const postUrl = log.id ? `https://x.com/${log.author}/status/${log.id}` : null;

                return (
                  <TableRow
                    key={`${log.id || 'item'}-${globalIdx}`}
                    hover
                    sx={{
                      transition: 'background-color 0.15s ease',
                      '&:hover': { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc' },
                    }}
                  >
                    <TableCell sx={{ color: darkMode ? '#64748b' : '#8392ab', fontSize: '12px', textAlign: 'center', py: 1.4, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                      {globalIdx}
                    </TableCell>

                    <TableCell sx={{ py: 1.4, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                      {getStatusBadge(log.status, darkMode)}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600, color: darkMode ? '#ffffff' : '#344767', fontSize: '12px', py: 1.4, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                      {log.category || 'GENERAL'}
                    </TableCell>

                    <TableCell sx={{ color: darkMode ? '#a5b4fc' : '#5e72e4', fontSize: '12px', fontWeight: 600, py: 1.4, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                      @{log.author || 'unknown'}
                    </TableCell>

                    <TableCell sx={{ color: darkMode ? '#cbd5e1' : '#67748e', fontSize: '12px', py: 1.4, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                      {log.reason}
                    </TableCell>

                    <TableCell sx={{ py: 1.4, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                      <Tooltip title={log.text || ''} placement="top" arrow>
                        <Typography
                          sx={{
                            fontSize: '12px',
                            color: darkMode ? '#94a3b8' : '#8392ab',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            cursor: 'pointer',
                          }}
                        >
                          {log.text || 'No text snippet'}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    <TableCell sx={{ textAlign: 'center', py: 1.4, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                      {postUrl ? (
                        <Button
                          component="a"
                          href={sanitizeUrl(postUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{ minWidth: 'auto', p: 0.6, color: darkMode ? '#a5b4fc' : '#5e72e4' }}
                        >
                          <LaunchRoundedIcon sx={{ fontSize: '16px' }} />
                        </Button>
                      ) : (
                        <Typography sx={{ fontSize: '11px', color: darkMode ? '#64748b' : '#adb5bd' }}>-</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Adaptive Cards View (< md) */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {paginatedLogs.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                No audit records found matching your filter criteria.
              </Typography>
            </Box>
          ) : (
            paginatedLogs.map((log, index) => {
              const globalIdx = (currentPage - 1) * itemsPerPage + index + 1;
              const postUrl = log.id ? `https://x.com/${log.author}/status/${log.id}` : null;

              return (
                <Box
                  key={`mobile-${log.id || 'item'}-${globalIdx}`}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#64748b' : '#8392ab' }}>
                        #{globalIdx}
                      </Typography>
                      {getStatusBadge(log.status, darkMode)}
                      <Chip
                        label={log.category || 'GENERAL'}
                        size="small"
                        sx={{
                          fontSize: '10px',
                          fontWeight: 700,
                          height: '22px',
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
                          color: darkMode ? '#cbd5e1' : '#475569'
                        }}
                      />
                    </Box>
                    {postUrl && (
                      <Button
                        component="a"
                        href={sanitizeUrl(postUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        sx={{
                          minWidth: '44px',
                          minHeight: '44px',
                          p: 0,
                          color: '#5e72e4'
                        }}
                      >
                        <LaunchRoundedIcon sx={{ fontSize: '18px' }} />
                      </Button>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#5e72e4' }}>
                      @{log.author || 'unknown'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', mb: 0.3 }}>
                      Rationale:
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: darkMode ? '#cbd5e1' : '#334155', fontWeight: 500 }}>
                      {log.reason}
                    </Typography>
                  </Box>

                  {log.text && (
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: '8px',
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #edf2f7'
                      }}
                    >
                      <Typography sx={{ fontSize: '11.5px', color: darkMode ? '#94a3b8' : '#64748b', lineHeight: 1.45 }}>
                        "{log.text}"
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })
          )}
        </Box>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
              color="primary"
              shape="rounded"
              size="medium"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: darkMode ? '#cbd5e1' : '#64748b',
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
                  '&.Mui-selected': {
                    color: '#ffffff',
                    backgroundColor: '#5e72e4',
                  },
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  },
                },
              }}
            />
          </Box>
        )}
      </Card>
    </Box>
  );
}

AuditView.propTypes = {
  auditLog: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default AuditView;