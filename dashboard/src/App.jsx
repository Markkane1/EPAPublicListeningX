import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

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

import initialCleanedPosts from './data/cleaned_epa_posts.json';
import initialAuditLog from './data/cleaning_audit.json';
import initialNoisePosts from './data/initial_noise_posts.json';

import DashboardView from './views/DashboardView';
import SearchView from './views/SearchView';
import PostsView from './views/PostsView';
import AnalyticsView from './views/AnalyticsView';
import AuditView from './views/AuditView';
import NoiseView from './views/NoiseView';
import SettingsView from './views/SettingsView';
import UsersView from './views/UsersView';
import RolesView from './views/RolesView';
import LoginView from './views/LoginView';

import Lightbox from './components/Lightbox';
import IngestModal from './components/IngestModal';
import ProtectedRoute from './components/ProtectedRoute';
import { getRoutes } from './routes';
import { getSettings, getPosts, getNoisePosts, ingestPostsBatch, excludePost } from './services/api';

function AppContent() {
  const [controller] = useArgonController();
  const { sidenavColor, darkSidenav, darkMode } = controller;
  const { user, isAuthenticated, isLoading } = useAuth();

  const [posts, setPosts] = useState(initialCleanedPosts);
  const [auditLog, setAuditLog] = useState(initialAuditLog);
  const [noisePosts, setNoisePosts] = useState(initialNoisePosts);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    async function initSync() {
      try {
        const [settingsData, dbPosts, dbNoise] = await Promise.all([
          getSettings().catch(() => null),
          getPosts().catch(() => null),
          getNoisePosts({ status: 'EXCLUDED', limit: 250 }).catch(() => null)
        ]);

        if (settingsData && settingsData.data_source) {
          setDataSource(settingsData.data_source);
        }
        if (dbPosts && Array.isArray(dbPosts) && dbPosts.length > 0) {
          setPosts(dbPosts);
        }
        if (dbNoise && Array.isArray(dbNoise) && dbNoise.length > 0) {
          setNoisePosts(dbNoise);
        }
      } catch (err) {
        console.warn('Backend sync note: operating with bundled dataset.', err);
      }
    }
    if (isAuthenticated) {
      initSync();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleOpenModal = () => setIsIngestOpen(true);
    window.addEventListener('open-ingest-modal', handleOpenModal);
    return () => window.removeEventListener('open-ingest-modal', handleOpenModal);
  }, []);

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

  const handleIngestSuccess = async (result, mode, rawData) => {
    if (rawData) {
      ingestPostsBatch(rawData, mode).catch((e) => console.warn('DB ingestion persist error:', e));
    }

    if (mode === 'replace') {
      setPosts(result.cleanPosts);
      setAuditLog(result.auditLog);
      if (result.noisePosts && Array.isArray(result.noisePosts)) {
        setNoisePosts(result.noisePosts);
      }
      setSnackbar({
        open: true,
        message: `Dataset replaced! Loaded ${result.cleanPosts.length} verified posts (${result.stats.duplicatesMerged} duplicates merged, ${result.stats.removedCount} noise excluded).`,
        severity: 'success'
      });
    } else {
      setPosts(result.cleanPosts);
      setAuditLog((prev) => [...result.auditLog, ...prev]);
      if (result.noisePosts && Array.isArray(result.noisePosts)) {
        setNoisePosts((prev) => {
          const seen = new Set(prev.map((p) => String(p.id)));
          const uniqueNew = result.noisePosts.filter((p) => !seen.has(String(p.id)));
          return [...uniqueNew, ...prev];
        });
      }
      setSnackbar({
        open: true,
        message: `Successfully ingested ${result.newlyAddedPosts.length} new verified posts (${result.stats.duplicatesMerged} duplicates merged, ${result.stats.removedCount} noise excluded)!`,
        severity: 'success'
      });
    }
  };

  const handleExcludeFromVerified = async (post) => {
    const author = post.authorUsername ? `@${post.authorUsername}` : 'this post';
    if (!window.confirm(`Are you sure you want to exclude ${author} from Verified Feed and return it to Noise Pool?`)) return;
    try {
      const pid = post.id || post.clean_id;
      await excludePost({ postId: pid, reason: 'Manually excluded by operator from verified feed' });
      setPosts((prev) => prev.filter((p) => String(p.id) !== String(pid) && String(p.clean_id) !== String(pid)));
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
        <DashboardNavbar dataSource={dataSource} />

        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredPermission="dashboard.view" moduleName="Dashboard Overview">
                    <DashboardView
                      posts={posts}
                      auditLog={auditLog}
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
                      posts={posts}
                      dataSource={dataSource}
                      onImageClick={handleOpenLightbox}
                      onNavigateSettings={() => navigate('/settings')}
                      onNavigatePosts={() => navigate('/posts')}
                      onFetchSuccess={(res) => {
                        if (res.allPosts && res.allPosts.length > 0) {
                          setPosts(res.allPosts);
                        } else if (res.newPosts && res.newPosts.length > 0) {
                          setPosts((prev) => [...res.newPosts, ...prev]);
                        }
                        if (res.noisePosts && res.noisePosts.length > 0) {
                          setNoisePosts((prev) => [...res.noisePosts, ...prev]);
                        }
                        if (res.auditLog && res.auditLog.length > 0) {
                          setAuditLog((prev) => [...res.auditLog, ...prev]);
                        }
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
                      posts={posts}
                      dataSource={dataSource}
                      onImageClick={handleOpenLightbox}
                      onNavigateSettings={() => navigate('/settings')}
                      onExcludePost={handleExcludeFromVerified}
                      onFetchSuccess={(res) => {
                        if (res.allPosts && res.allPosts.length > 0) {
                          setPosts(res.allPosts);
                        } else if (res.newPosts && res.newPosts.length > 0) {
                          setPosts((prev) => [...res.newPosts, ...prev]);
                        }
                        if (res.noisePosts && res.noisePosts.length > 0) {
                          setNoisePosts((prev) => [...res.noisePosts, ...prev]);
                        }
                        if (res.auditLog && res.auditLog.length > 0) {
                          setAuditLog((prev) => [...res.auditLog, ...prev]);
                        }
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
                    <AnalyticsView posts={posts} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/audit"
                element={
                  <ProtectedRoute requiredPermission="audit.view" moduleName="Deduplication Audit">
                    <AuditView auditLog={auditLog} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/noise"
                element={
                  <ProtectedRoute requiredPermission="noise.view" moduleName="Noise & Learning Engine">
                    <NoiseView
                      noisePosts={noisePosts}
                      onPostRestored={(restoredPost, restoredId) => {
                        setPosts((prev) => [restoredPost, ...prev]);
                        setNoisePosts((prev) => prev.filter((p) => String(p.id) !== String(restoredId || restoredPost.id)));
                        setSnackbar({
                          open: true,
                          message: `Post @${restoredPost.authorUsername || ''} restored and added to Verified Feed!`,
                          severity: 'success'
                        });
                      }}
                      onPostExcluded={(excludedId, authorUsername) => {
                        setPosts((prev) => prev.filter((p) => String(p.id) !== String(excludedId) && String(p.clean_id) !== String(excludedId)));
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
                          const freshPosts = await getPosts();
                          if (freshPosts && freshPosts.length > 0) {
                            setPosts(freshPosts);
                            setSnackbar({
                              open: true,
                              message: `Reloaded ${freshPosts.length} verified posts from SQLite database!`,
                              severity: 'success'
                            });
                          }
                        } catch (e) {
                          setSnackbar({ open: true, message: `Failed to reload from DB: ${e.message}`, severity: 'error' });
                        }
                      }}
                    />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

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

          <IngestModal
            open={isIngestOpen}
            onClose={() => setIsIngestOpen(false)}
            currentPosts={posts}
            onIngestSuccess={handleIngestSuccess}
          />

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