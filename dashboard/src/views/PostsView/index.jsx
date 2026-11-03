import React, { useState, useMemo } from 'react';
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

function PostsView({
  posts,
  onImageClick,
  dataSource = 'file',
  onFetchSuccess,
  onNavigateSettings,
  onExcludePost
}) {
  const [controller] = useArgonController();
  const { miniSidenav, darkMode } = controller || {};

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

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

  const { availableCities, availableCategories, availableDates } = useMemo(() => {
    const cityMap = {};
    const catMap = {};
    const dateMap = {};

    posts.forEach((p) => {
      const city = p.city_detected || 'Punjab Region';
      cityMap[city] = (cityMap[city] || 0) + 1;
      const cat = p.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + 1;

      if (p.createdAt) {
        const d = new Date(p.createdAt);
        if (!isNaN(d.getTime())) {
          const key = d.toISOString().slice(0, 10);
          dateMap[key] = (dateMap[key] || 0) + 1;
        }
      }
    });

    const cities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    const categories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    const dates = Object.entries(dateMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, count]) => ({ date, count }));

    return { availableCities: cities, availableCategories: categories, availableDates: dates };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.text && p.text.toLowerCase().includes(q)) ||
          (p.authorName && p.authorName.toLowerCase().includes(q)) ||
          (p.authorUsername && p.authorUsername.toLowerCase().includes(q)) ||
          (p.city_detected && p.city_detected.toLowerCase().includes(q))
      );
    }

    if (filters.city !== 'all') {
      result = result.filter((p) => p.city_detected === filters.city);
    }

    if (filters.severity !== 'all') {
      result = result.filter((p) => p.severity_code === filters.severity);
    }

    if (filters.category !== 'all') {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters.date && filters.date !== 'all') {
      result = result.filter((p) => {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === filters.date;
      });
    }

    if (filters.timeOfDay && filters.timeOfDay !== 'all') {
      result = result.filter((p) => {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        if (isNaN(d.getTime())) return false;
        const hours = d.getHours();
        if (filters.timeOfDay === 'morning') return hours >= 6 && hours < 12;
        if (filters.timeOfDay === 'afternoon') return hours >= 12 && hours < 18;
        if (filters.timeOfDay === 'evening') return hours >= 18 && hours < 24;
        if (filters.timeOfDay === 'night') return hours >= 0 && hours < 6;
        return true;
      });
    }

    if (filters.media === 'media') {
      result = result.filter((p) => p.has_media);
    } else if (filters.media === 'text') {
      result = result.filter((p) => !p.has_media);
    }

    const mult = filters.sortOrder === 'asc' ? -1 : 1;

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest': {
          const timeA = new Date(a.createdAt || 0).getTime() || 0;
          const timeB = new Date(b.createdAt || 0).getTime() || 0;
          return mult * (timeB - timeA);
        }

        case 'oldest': {
          const timeA = new Date(a.createdAt || 0).getTime() || 0;
          const timeB = new Date(b.createdAt || 0).getTime() || 0;
          return mult * (timeA - timeB);
        }

        case 'engagement':
        case 'interactions': {
          const aEng =
            (a.total_engagement != null ? a.total_engagement : 0) ||
            ((parseInt(a.likes, 10) || 0) +
              (parseInt(a.retweets, 10) || 0) +
              (parseInt(a.replies, 10) || 0) +
              (parseInt(a.quotes, 10) || 0) +
              (parseInt(a.bookmarks, 10) || 0));
          const bEng =
            (b.total_engagement != null ? b.total_engagement : 0) ||
            ((parseInt(b.likes, 10) || 0) +
              (parseInt(b.retweets, 10) || 0) +
              (parseInt(b.replies, 10) || 0) +
              (parseInt(b.quotes, 10) || 0) +
              (parseInt(b.bookmarks, 10) || 0));
          if (aEng !== bEng) return mult * (bEng - aEng);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'likes': {
          const aLikes = parseInt(a.likes, 10) || 0;
          const bLikes = parseInt(b.likes, 10) || 0;
          if (aLikes !== bLikes) return mult * (bLikes - aLikes);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'retweets': {
          const aRt = parseInt(a.retweets, 10) || 0;
          const bRt = parseInt(b.retweets, 10) || 0;
          if (aRt !== bRt) return mult * (bRt - aRt);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'replies': {
          const aRep = parseInt(a.replies, 10) || 0;
          const bRep = parseInt(b.replies, 10) || 0;
          if (aRep !== bRep) return mult * (bRep - aRep);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'views': {
          const aViews = parseInt(a.views, 10) || 0;
          const bViews = parseInt(b.views, 10) || 0;
          if (aViews !== bViews) return mult * (bViews - aViews);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'aqi_desc':
        case 'aqi': {
          if (a.aqi_value != null && b.aqi_value != null) {
            if (a.aqi_value !== b.aqi_value) return mult * (b.aqi_value - a.aqi_value);
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          }
          if (a.aqi_value != null) return -1;
          if (b.aqi_value != null) return 1;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'aqi_asc': {
          if (a.aqi_value != null && b.aqi_value != null) {
            if (a.aqi_value !== b.aqi_value) return mult * (a.aqi_value - b.aqi_value);
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          }
          if (a.aqi_value != null) return -1;
          if (b.aqi_value != null) return 1;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'severity':
        case 'severity_desc': {
          const sevRank = {
            hazardous: 6,
            very_unhealthy: 5,
            unhealthy: 4,
            sensitive: 3,
            moderate: 2,
            good: 1,
            unspecified: 0,
          };
          const rankA = sevRank[a.severity_code] || 0;
          const rankB = sevRank[b.severity_code] || 0;
          if (rankA !== rankB) return mult * (rankB - rankA);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'followers':
        case 'reach': {
          const aFol = parseInt(a.authorFollowers, 10) || 0;
          const bFol = parseInt(b.authorFollowers, 10) || 0;
          if (aFol !== bFol) return mult * (bFol - aFol);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'verified': {
          const aVer = a.authorVerified ? 1 : 0;
          const bVer = b.authorVerified ? 1 : 0;
          if (aVer !== bVer) return mult * (bVer - aVer);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'sentiment_alarm': {
          
          const aScore = a.sentiment_score != null ? Number(a.sentiment_score) : 0;
          const bScore = b.sentiment_score != null ? Number(b.sentiment_score) : 0;
          if (aScore !== bScore) return mult * (aScore - bScore);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'sentiment_positive': {
          
          const aScore = a.sentiment_score != null ? Number(a.sentiment_score) : 0;
          const bScore = b.sentiment_score != null ? Number(b.sentiment_score) : 0;
          if (aScore !== bScore) return mult * (bScore - aScore);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        case 'media_count': {
          const aCount = a.media_count || (Array.isArray(a.mediaUrls) ? a.mediaUrls.length : 0);
          const bCount = b.media_count || (Array.isArray(b.mediaUrls) ? b.mediaUrls.length : 0);
          if (aCount !== bCount) return mult * (bCount - aCount);
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }

        default: {
          const timeA = new Date(a.createdAt || 0).getTime() || 0;
          const timeB = new Date(b.createdAt || 0).getTime() || 0;
          return mult * (timeB - timeA);
        }
      }
    });

    return result;
  }, [posts, filters]);

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

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage) || 1;
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

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
        totalResults={filteredPosts.length}
        totalAvailable={posts.length}
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
  posts: PropTypes.arrayOf(PropTypes.object).isRequired,
  onImageClick: PropTypes.func.isRequired,
  dataSource: PropTypes.string,
  onFetchSuccess: PropTypes.func,
  onNavigateSettings: PropTypes.func,
  onExcludePost: PropTypes.func,
};

export default PostsView;