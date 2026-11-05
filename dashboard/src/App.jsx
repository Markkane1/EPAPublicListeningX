import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import theme from 'assets/theme';
import themeDark from 'assets/theme-dark';

import Sidenav from 'examples/Sidenav';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';

import { useArgonController } from 'context';
import { AuthProvider, useAuth } from './context/AuthContext';

import brand from 'assets/images/logo-epa-mark.png';
import brandDark from 'assets/images/logo-epa-mark.png';
import LoginView from './views/LoginView';

const DashboardView = lazy(() => import('./views/DashboardView'));
const SearchView = lazy(() => import('./views/SearchView'));
const PostsView = lazy(() => import('./views/PostsView'));
const AnalyticsView = lazy(() => import('./views/AnalyticsView'));
const AuditView = lazy(() => import('./views/AuditView'));
const NoiseView = lazy(() => import('./views/NoiseView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const UsersView = lazy(() => import('./views/UsersView'));
const RolesView = lazy(() => import('./views/RolesView'));

import Lightbox from './components/Lightbox';
import IngestModal from './components/IngestModal';
import ProtectedRoute from './components/ProtectedRoute';
import { getRoutes } from './routes';
import { getSettings, getStats, ingestPostsBatch, excludePost, invalidateApiCache } from './services/api';

function AppContent() {
  const [controller] = useArgonController();
  const { sidenavColor, darkSidenav, darkMode } = controller;
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();
  const canIngest = hasPermission('posts.ingest');
  const canExclude = hasPermission('posts.exclude');

  const [stats, setStats] = useState(null);
  const [dataRevision, setDataRevision] = useState(0);
  const [loadErrors, setLoadErrors] = useState([]);
  const [dataSource, setDataSource] = useState('file');

  const [lightbox, setLightbox] = useState({
    images: [],
    activeIndex: null
  });

  const [isIngestOpen, setIsIngestOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;

    async function initSync() {
      const errors = [];
      const [settingsResult, statsResult] = await Promise.all([
        getSettings().then((value) => ({ ok: true, value })).catch((error) => ({ ok: false, error })),
        getStats().then((value) => ({ ok: true, value })).catch((error) => ({ ok: false, error })),
      ]);
      if (cancelled) return;

      if (settingsResult.ok && settingsResult.value && settingsResult.value.data_source) {
        setDataSource(settingsResult.value.data_source);
      }

      if (statsResult.ok && statsResult.value) {
        setStats(statsResult.value);
      } else {
        setStats(null);
        errors.push('Dashboard totals failed to load. Refresh the page after the API is reachable.');
      }

      setLoadErrors(errors);
    }

    initSync();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, dataRevision]);

  useEffect(() => {
    if (!canIngest) return undefined;
    const handleOpenModal = () => setIsIngestOpen(true);
    window.addEventListener('open-ingest-modal', handleOpenModal);
    return () => window.removeEventListener('open-ingest-modal', handleOpenModal);
  }, [canIngest]);

  const handleOpenLightbox = (images, index) => {
    setLightbox({ images, activeIndex: index });
  };
  const handleCloseLightbox = () => {
    setLightbox({ images: [], activeIndex: null });
  };
  const handlePrevLightbox = () => {
    setLightbox((prev) => ({
      ...prev,
      activeIndex: (prev.activeIndex - 1 + prev.images.length) % prev.images.length
    }));
  };
  const handleNextLightbox = () => {
    setLightbox((prev) => ({
      ...prev,
      activeIndex: (prev.activeIndex + 1) % prev.images.length
    }));
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const preloadViews = () => {
      import('./views/DashboardView');
      import('./views/PostsView');
      import('./views/AnalyticsView');
      import('./views/NoiseView');
      import('./views/AuditView');
      import('./views/SearchView');
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(preloadViews);
    } else {
      setTimeout(preloadViews, 1000);
    }
  }, [isAuthenticated]);

  const bumpData = () => {
    invalidateApiCache();
    setDataRevision((n) => n + 1);
  };

  const handleIngestSuccess = async (result, mode, rawData) => {
    if (rawData) {
      ingestPostsBatch(rawData, mode)
        .then(() => bumpData())
        .catch((e) => console.warn('DB ingestion persist error:', e));
    } else {
      bumpData();
    }
    const added = result?.newlyAddedPosts?.length || result?.cleanPosts?.length || 0;
    const duplicates = result?.stats?.duplicatesMerged || 0;
    const removed = result?.stats?.removedCount || 0;
    setSnackbar({
      open: true,
      message: mode === 'replace'
        ? `Dataset replaced. ${added} verified posts in this file (${duplicates} duplicates merged, ${removed} noise excluded).`
        : `Ingested ${added} new verified posts (${duplicates} duplicates merged, ${removed} noise excluded).`,
      severity: 'success'
    });
  };

  const handleExcludeFromVerified = async (post) => {
    const author = post.authorUsername ? `@${post.authorUsername}` : 'this post';
    if (!window.confirm(`Are you sure you want to exclude ${author} from Verified Feed and return it to Noise Pool?`)) return;
    try {
      const pid = post.id || post.clean_id;
      await excludePost({ postId: pid, reason: 'Manually excluded by operator from verified feed' });
      bumpData();
      setSnackbar({
        open: true,
        message: `Post ${author} moved to Noise Pool.`,
        severity: 'info',
      });
    } catch (e) {
      setSnackbar({ open: true, message: `Failed to exclude: ${e.message}`, severity: 'error' });
    }
  };

  const dynamicRoutes = useMemo(() => getRoutes(user), [user]);

  if (isLoading) {
    return (
      <ThemeProvider theme={darkMode ? themeDark : theme}>
        <CssBaseline />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#0b1437' : '#f8f9fa' }}>
          <p style={{ fontWeight: 600, fontSize: '14px', color: '#64748b' }}>Verifying secure session...</p>
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={darkMode ? themeDark : theme}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />

      <Sidenav
        color={sidenavColor || 'info'}
        brand={darkSidenav || darkMode ? brand : brandDark}
        brandName="EPA Punjab Social Listening"
        routes={dynamicRoutes}
      />

      <DashboardLayout>
        <DashboardNavbar dataSource={dataSource} stats={stats} />

        {loadErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {loadErrors.join(' ')}
          </Alert>
        )}

        <Suspense
          fallback={
            <Box
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '12px',
                backgroundColor: darkMode ? '#111c44' : '#ffffff',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                minHeight: '280px',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#64748b' }}>
                Loading view...
              </Typography>
            </Box>
          }
        >
          <Box
            key={location.pathname}
            sx={{
              animation: 'viewFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              '@keyframes viewFadeIn': {
                from: { opacity: 0, transform: 'translateY(4px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          >
            <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredPermission="dashboard.view" moduleName="Dashboard Overview">
                    <DashboardView
                      stats={stats}
                      dataRevision={dataRevision}
                      dataSource={dataSource}
                      onNavigate={(routeKey) => navigate(`/${routeKey}`)}
                      onOpenIngest={() => setIsIngestOpen(true)}
                      onImageClick={handleOpenLightbox}
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/search"
                element={
                  <ProtectedRoute requiredPermission="posts.view" moduleName="Keyword Search & Fetch">
                    <SearchView
                      archiveTotal={stats?.archiveTotalPosts || 0}
                      dataSource={dataSource}
                      onImageClick={handleOpenLightbox}
                      onNavigateSettings={() => navigate('/settings')}
                      onNavigatePosts={() => navigate('/posts')}
                      onFetchSuccess={(res) => {
                        bumpData();
                        const duplicatesCount = res.duplicatesMerged || 0;
                        const noiseCount = res.noiseRemoved || 0;
                        const verifiedCount = res.verifiedCount || res.newPosts?.length || 0;
                        setSnackbar({
                          open: true,
                          message: `Search complete! ${verifiedCount} verified posts saved to local SQLite DB (${duplicatesCount} duplicates merged, ${noiseCount} noise excluded).`,
                          severity: 'success'
                        });
                      }}
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/posts"
                element={
                  <ProtectedRoute requiredPermission="posts.view" moduleName="Posts Feed">
                    <PostsView
                      dataRevision={dataRevision}
                      dataSource={dataSource}
                      onImageClick={handleOpenLightbox}
                      onNavigateSettings={() => navigate('/settings')}
                      onExcludePost={canExclude ? handleExcludeFromVerified : undefined}
                      onFetchSuccess={(res) => {
                        bumpData();
                        const duplicatesCount = res.duplicatesMerged || 0;
                        const noiseCount = res.noiseRemoved || 0;
                        const verifiedCount = res.verifiedCount || res.newPosts?.length || 0;
                        setSnackbar({
                          open: true,
                          message: `Search complete! ${verifiedCount} verified posts saved to local SQLite DB (${duplicatesCount} duplicates merged, ${noiseCount} noise excluded).`,
                          severity: 'success'
                        });
                      }}
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute requiredPermission="analytics.view" moduleName="Analytics & Charts">
                    <AnalyticsView dataRevision={dataRevision} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/audit"
                element={
                  <ProtectedRoute requiredPermission="audit.view" moduleName="Deduplication Audit">
                    <AuditView dataRevision={dataRevision} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/noise"
                element={
                  <ProtectedRoute requiredPermission="noise.view" moduleName="Noise & Learning Engine">
                    <NoiseView
                      dataRevision={dataRevision}
                      onPostRestored={(restoredPost) => {
                        bumpData();
                        setSnackbar({
                          open: true,
                          message: `Post @${restoredPost.authorUsername || ''} restored and added to Verified Feed!`,
                          severity: 'success'
                        });
                      }}
                      onPostExcluded={(excludedId, authorUsername) => {
                        bumpData();
                        setSnackbar({
                          open: true,
                          message: `Post ${authorUsername ? `@${authorUsername}` : ''} re-excluded as noise and removed from Verified Feed.`,
                          severity: 'info'
                        });
                      }}
                      onImageClick={handleOpenLightbox}
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredPermission="users.view" moduleName="User Management">
                    <UsersView />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/roles"
                element={
                  <ProtectedRoute requiredPermission="roles.view" moduleName="Role Policies">
                    <RolesView />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredPermission="settings.view" moduleName="System Settings">
                    <SettingsView
                      onSettingsSaved={(newSettings) => {
                        setDataSource(newSettings.data_source);
                        setSnackbar({
                          open: true,
                          message: `Settings saved! Mode switched to ${newSettings.data_source === 'x_api' ? 'Live X API' : 'File Ingestion'}.`,
                          severity: 'success'
                        });
                      }}
                      onReloadFromDb={async () => {
                        try {
                          const fresh = await getStats();
                          setStats(fresh);
                          bumpData();
                          setSnackbar({
                            open: true,
                            message: `Reloaded totals from SQLite (${fresh.archiveTotalPosts || 0} verified posts).`,
                            severity: 'success'
                          });
                        } catch (e) {
                          setSnackbar({
                            open: true,
                            message: `Verified posts failed to load. Refresh the page after the API is reachable. ${e.message}`,
                            severity: 'error'
                          });
                        }
                      }}
                    />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </Suspense>

            <Footer
              company={{ href: 'https://epd.punjab.gov.pk/', name: 'EPA Punjab Social Listening' }}
              links={[
                { href: 'https://epd.punjab.gov.pk/', name: 'EPA Punjab Official' },
                { href: 'https://www.iqair.com/pakistan/punjab/lahore', name: 'IQAir Lahore Live' },
                { href: 'https://x.com', name: 'X.com Source Feed' }
              ]}
            />
          </DashboardLayout>

          <Lightbox
            images={lightbox.images}
            activeIndex={lightbox.activeIndex}
            onClose={handleCloseLightbox}
            onPrev={handlePrevLightbox}
            onNext={handleNextLightbox}
          />

          {canIngest && (
            <IngestModal
              open={isIngestOpen}
              onClose={() => setIsIngestOpen(false)}
              onIngestSuccess={handleIngestSuccess}
            />
          )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}