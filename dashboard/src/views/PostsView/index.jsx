import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import PostCard from 'components/PostCard';
import FilterBar from 'components/FilterBar';

import { useArgonController } from 'context';
import { getPosts, getStats, POSTS_CHUNK_SIZE, POSTS_PAGE_SIZE } from '../../services/api';

function PostsView({
  dataRevision = 0,
  onImageClick,
  dataSource = 'file',
  onFetchSuccess,
  onNavigateSettings,
  onExcludePost
}) {
  const [controller] = useArgonController();
  const { miniSidenav, darkMode } = controller || {};

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = POSTS_PAGE_SIZE;
  const [chunk, setChunk] = useState({ items: [], total: 0, offset: 0 });
  const [facets, setFacets] = useState({ cityCounts: {}, categoryCounts: {}, dateCounts: [], archiveTotal: 0 });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    city: 'all',
    severity: 'all',
    category: 'all',
    media: 'all',
    date: 'all',
    timeOfDay: 'all',
    sortBy: 'newest',
    sortOrder: 'desc',
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search || ''), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    getStats()
      .then((s) => setFacets({
        cityCounts: s.cityCounts || {},
        categoryCounts: s.categoryCounts || {},
        dateCounts: s.dateCounts || [],
        archiveTotal: s.archiveTotalPosts || 0,
      }))
      .catch(() => {});
  }, [dataRevision]);

  useEffect(() => {
    let cancelled = false;
    const chunkOffset = Math.floor(((currentPage - 1) * postsPerPage) / POSTS_CHUNK_SIZE) * POSTS_CHUNK_SIZE;
    getPosts({
      search: debouncedSearch,
      city: filters.city,
      severity: filters.severity,
      category: filters.category,
      media: filters.media,
      date: filters.date,
      timeOfDay: filters.timeOfDay,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: POSTS_CHUNK_SIZE,
      offset: chunkOffset,
    }).then((page) => {
      if (!cancelled) setChunk({ items: page.items, total: page.total, offset: page.offset });
    }).catch(() => {
      if (!cancelled) setChunk({ items: [], total: 0, offset: 0 });
    });
    return () => { cancelled = true; };
  }, [debouncedSearch, filters.city, filters.severity, filters.category, filters.media, filters.date, filters.timeOfDay, filters.sortBy, filters.sortOrder, currentPage, dataRevision, postsPerPage]);

  const availableCities = Object.entries(facets.cityCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
  const availableCategories = Object.entries(facets.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
  const availableDates = facets.dateCounts || [];

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      city: 'all',
      severity: 'all',
      category: 'all',
      media: 'all',
      date: 'all',
      timeOfDay: 'all',
      sortBy: 'newest',
      sortOrder: 'desc',
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(chunk.total / postsPerPage) || 1;
  const pageStart = (currentPage - 1) * postsPerPage;
  const paginatedPosts = chunk.items.slice(pageStart - chunk.offset, pageStart - chunk.offset + postsPerPage);

  return (
    <Box sx={{ py: 2 }}>
      
      <Box sx={{ mb: 2.5 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Open Sans", sans-serif',
            fontWeight: 700,
            color: darkMode ? '#ffffff' : '#1e293b',
            fontSize: { xs: '20px', md: '24px' },
            mb: 0.5,
          }}
        >
          EPA Punjab Social Listening Posts Feed
        </Typography>
        <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontSize: '14px', color: darkMode ? '#94a3b8' : '#67748e' }}>
          Explore post previews, author attribution, interactive multi-dimensional sorting, and clickable direct links to live X.com posts.
        </Typography>
      </Box>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResults={chunk.total}
        totalAvailable={facets.archiveTotal}
        availableCities={availableCities}
        availableCategories={availableCategories}
        availableDates={availableDates}
      />

      {paginatedPosts.length > 0 ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: miniSidenav ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
              },
              gap: 2.5,
              mb: 4,
              alignItems: 'stretch',
            }}
          >
            {paginatedPosts.map((post, idx) => (
              <PostCard
                key={post.id || post.clean_id}
                post={post}
                onImageClick={onImageClick}
                onExcludePost={onExcludePost}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                rank={(currentPage - 1) * postsPerPage + idx + 1}
              />
            ))}
          </Box>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
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
        </>
      ) : (
        <Card
          sx={{
            p: 5,
            textAlign: 'center',
            my: 4,
            borderRadius: '16px',
            backgroundColor: darkMode ? '#111c44' : '#fff',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
            boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <Box
            sx={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <FilterAltOffRoundedIcon sx={{ fontSize: '32px', color: darkMode ? '#94a3b8' : '#8392ab' }} />
          </Box>
          <Typography
            sx={{
              fontFamily: '"Open Sans", sans-serif',
              fontWeight: 700,
              fontSize: '18px',
              color: darkMode ? '#ffffff' : '#344767',
              mb: 1,
            }}
          >
            No Posts Found
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Open Sans", sans-serif',
              fontSize: '14px',
              color: darkMode ? '#94a3b8' : '#67748e',
              mb: 3,
              maxWidth: '400px',
              mx: 'auto',
            }}
          >
            No posts matched your current search and filter combination. Try clearing some filters or searching for broader terms like "smog" or "Lahore".
          </Typography>
          <Button
            variant="contained"
            onClick={handleResetFilters}
            sx={{
              background: 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)',
              color: '#fff',
              textTransform: 'none',
              fontFamily: '"Open Sans", sans-serif',
              fontWeight: 600,
              borderRadius: '8px',
              px: 3,
            }}
          >
            Reset All Filters & Sort
          </Button>
        </Card>
      )}
    </Box>
  );
}

PostsView.propTypes = {
  dataRevision: PropTypes.number,
  onImageClick: PropTypes.func.isRequired,
  dataSource: PropTypes.string,
  onFetchSuccess: PropTypes.func,
  onNavigateSettings: PropTypes.func,
  onExcludePost: PropTypes.func,
};

export default PostsView;