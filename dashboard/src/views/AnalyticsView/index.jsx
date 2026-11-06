import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';

import { Chart as ChartJS, registerables } from 'chart.js';
import { Doughnut, Pie, Bar } from 'react-chartjs-2';

ChartJS.register(...registerables);
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import { useArgonController } from 'context';
import { sanitizeUrl } from '../../utils/security';
import { getStats, getPosts, getCachedStats } from '../../services/api';

function AnalyticsView({ dataRevision = 0 }) {
  const [controller] = useArgonController();
  const { darkMode } = controller || {};
  const [stats, setStats] = useState(() => getCachedStats() || null);
  const [viralPosts, setViralPosts] = useState([]);
  const [loading, setLoading] = useState(!stats);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getStats(),
      getPosts({ sortBy: 'engagement', limit: 10 }),
    ]).then(([s, page]) => {
      if (cancelled) return;
      setStats(s);
      setViralPosts(page.items || []);
      setLoading(false);
    }).catch((err) => {
      console.warn('Analytics fetch warning:', err);
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [dataRevision]);

  const postsTotal = stats?.totalPosts || 0;

  const severityStats = useMemo(() => {
    const counts = {
      'Hazardous (300+)': { count: 0, color: '#f5365c', label: 'Hazardous' },
      'Very Unhealthy (201-300)': { count: 0, color: '#fb6340', label: 'Very Unhealthy' },
      'Unhealthy (151-200)': { count: 0, color: '#ffd600', label: 'Unhealthy' },
      'Moderate / Good (<150)': { count: 0, color: '#2dce89', label: 'Moderate / Good' },
      'Unspecified Alert': { count: 0, color: '#adb5bd', label: 'General Alert' },
    };

    const sourceBucketCounts =
      stats?.aqiBucketCounts ||
      stats?.aqi_distribution ||
      stats?.aqi_bucket_counts ||
      stats?.aqiBuckets ||
      {};

    const rawEntries = Object.entries(sourceBucketCounts);

    if (rawEntries.length > 0) {
      rawEntries.forEach(([key, count]) => {
        const val = Number(count) || 0;
        if (counts[key]) {
          counts[key].count += val;
        } else {
          const lower = String(key || '').toLowerCase();
          if (lower.includes('hazard') || lower.includes('300')) counts['Hazardous (300+)'].count += val;
          else if (lower.includes('very') || lower.includes('201')) counts['Very Unhealthy (201-300)'].count += val;
          else if (lower.includes('unhealthy') || lower.includes('151')) counts['Unhealthy (151-200)'].count += val;
          else if (lower.includes('moderate') || lower.includes('good') || lower.includes('150')) counts['Moderate / Good (<150)'].count += val;
          else counts['Unspecified Alert'].count += val;
        }
      });
    } else if (viralPosts && viralPosts.length > 0) {
      viralPosts.forEach((p) => {
        const aqi = Number(p.aqi_value);
        if (aqi >= 300) counts['Hazardous (300+)'].count += 1;
        else if (aqi >= 201) counts['Very Unhealthy (201-300)'].count += 1;
        else if (aqi >= 151) counts['Unhealthy (151-200)'].count += 1;
        else if (aqi > 0) counts['Moderate / Good (<150)'].count += 1;
        else counts['Unspecified Alert'].count += 1;
      });
    }

    const items = Object.entries(counts).filter(([, v]) => v.count > 0);
    const sumCount = items.reduce((sum, [, v]) => sum + v.count, 0);
    const total = sumCount || postsTotal || 1;

    const chartData = {
      labels: items.map(([k]) => k),
      datasets: [
        {
          data: items.map(([, v]) => v.count),
          backgroundColor: items.map(([, v]) => v.color),
          borderWidth: 2,
          borderColor: darkMode ? '#0f172a' : '#ffffff',
          hoverOffset: 4,
        },
      ],
    };

    const legendItems = items.map(([k, v]) => ({
      name: k,
      count: v.count,
      pct: ((v.count / total) * 100).toFixed(1),
      color: v.color,
    }));

    return { chartData, legendItems };
  }, [stats, viralPosts, postsTotal, darkMode]);

  const cityStats = useMemo(() => {
    const cityCounts = stats?.cityCounts || {};

    const sorted = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map((s) => s[0]);
    const data = sorted.map((s) => s[1]);

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Clean Posts Count',
          data,
          backgroundColor: '#11cdef',
          borderRadius: 6,
          maxBarThickness: 32,
        },
      ],
    };

    return { chartData, sorted };
  }, [stats]);

  const categoryStats = useMemo(() => {
    const catCounts = stats?.categoryCounts || {};

    const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map((s) => s[0]);
    const data = sorted.map((s) => s[1]);

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Posts Count',
          data,
          backgroundColor: '#16a34a',
          borderRadius: 6,
          maxBarThickness: 24,
        },
      ],
    };

    return { chartData, sorted };
  }, [stats]);

  const sentimentStats = useMemo(() => {
    const sMap = {
      'Critical / Alarmed': { count: 0, color: '#f5365c' },
      'Concerned': { count: 0, color: '#fb6340' },
      'Informative / Neutral': { count: 0, color: '#11cdef' },
      'Positive / Solution-Oriented': { count: 0, color: '#2dce89' },
    };

    const sourceSentimentCounts =
      stats?.sentimentCounts ||
      stats?.sentiments ||
      stats?.sentiment_distribution ||
      stats?.sentiment_counts ||
      {};

    const rawEntries = Object.entries(sourceSentimentCounts);

    if (rawEntries.length > 0) {
      rawEntries.forEach(([s, count]) => {
        const val = Number(count) || 0;
        if (sMap[s]) {
          sMap[s].count += val;
        } else {
          const lower = String(s || '').toLowerCase().trim();
          if (lower.includes('critical') || lower.includes('alarmed')) {
            sMap['Critical / Alarmed'].count += val;
          } else if (lower.includes('concern')) {
            sMap['Concerned'].count += val;
          } else if (lower.includes('positive') || lower.includes('solution')) {
            sMap['Positive / Solution-Oriented'].count += val;
          } else {
            sMap['Informative / Neutral'].count += val;
          }
        }
      });
    } else if (viralPosts && viralPosts.length > 0) {
      viralPosts.forEach((p) => {
        const lower = String(p.sentiment || '').toLowerCase();
        if (lower.includes('critical') || lower.includes('alarmed')) {
          sMap['Critical / Alarmed'].count += 1;
        } else if (lower.includes('concern')) {
          sMap['Concerned'].count += 1;
        } else if (lower.includes('positive') || lower.includes('solution')) {
          sMap['Positive / Solution-Oriented'].count += 1;
        } else {
          sMap['Informative / Neutral'].count += 1;
        }
      });
    }

    const items = Object.entries(sMap).filter(([, v]) => v.count > 0);
    const sumCount = items.reduce((sum, [, v]) => sum + v.count, 0);
    const total = sumCount || postsTotal || 1;

    const chartData = {
      labels: items.map(([k]) => k),
      datasets: [
        {
          data: items.map(([, v]) => v.count),
          backgroundColor: items.map(([, v]) => v.color),
          borderWidth: 2,
          borderColor: darkMode ? '#0f172a' : '#ffffff',
          hoverOffset: 4,
        },
      ],
    };

    const legendItems = items.map(([k, v]) => ({
      name: k,
      count: v.count,
      pct: ((v.count / total) * 100).toFixed(1),
      color: v.color,
    }));

    return { chartData, legendItems };
  }, [stats, viralPosts, postsTotal, darkMode]);

  return (
    <Box sx={{ py: 2 }}>
      
      <Box sx={{ mb: 3 }}>
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
          EPA Punjab Social Listening & Analytics
        </Typography>
        <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontSize: '14px', color: darkMode ? '#94a3b8' : '#67748e' }}>
          Atmospheric severity distribution, regional concentration, public discourse sentiment, and viral impact.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}
      >
        
        <Card
          sx={{
            p: 3,
            borderRadius: '16px',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
            boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PieChartRoundedIcon sx={{ color: '#16a34a', fontSize: '20px' }} />
            <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '16px', color: darkMode ? '#ffffff' : '#344767' }}>
              AQI Severity Breakdown
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#8392ab', mb: 2 }}>
            Proportion of posts highlighting extreme/hazardous vs moderate air conditions
          </Typography>

          <Divider sx={{ my: 1.5, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }} />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
              minHeight: '220px',
            }}
          >
            {loading && !stats ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', gap: 1.5, width: '100%' }}>
                <CircularProgress size={32} sx={{ color: '#16a34a' }} />
                <Typography sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                  Loading AQI severity metrics...
                </Typography>
              </Box>
            ) : severityStats.legendItems.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', gap: 1, width: '100%', py: 3 }}>
                <PieChartRoundedIcon sx={{ fontSize: '40px', color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }} />
                <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#64748b' }}>
                  No severity data available
                </Typography>
                <Typography sx={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', textAlign: 'center', maxWidth: '280px' }}>
                  AQI levels will appear here as sensor and social alert data are recorded.
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ width: '180px', height: '180px', flexShrink: 0, position: 'relative' }}>
                  <Doughnut
                    data={severityStats.chartData}
                    options={{
                      cutout: '72%',
                      plugins: { legend: { display: false } },
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {severityStats.legendItems.map((item) => (
                    <Box
                      key={item.name}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        borderRadius: '8px',
                        backgroundColor: darkMode ? '#090e15' : '#f8fafc',
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Box
                          sx={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: item.color,
                            flexShrink: 0,
                          }}
                        />
                        <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: darkMode ? '#e2e8f0' : '#344767' }}>
                          {item.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b' }}>
                          {item.count}
                        </Typography>
                        <Box
                          sx={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: darkMode ? '#cbd5e1' : '#64748b',
                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#edf2f7',
                            px: 0.8,
                            py: 0.2,
                            borderRadius: '4px',
                          }}
                        >
                          {item.pct}%
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Card>

        <Card
          sx={{
            p: 3,
            borderRadius: '16px',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
            boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <BarChartRoundedIcon sx={{ color: '#11cdef', fontSize: '20px' }} />
            <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '16px', color: darkMode ? '#ffffff' : '#344767' }}>
              Post Volume by City / Region
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#8392ab', mb: 2 }}>
            Geographic frequency across Pakistani Punjab districts
          </Typography>

          <Divider sx={{ my: 1.5, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }} />

          <Box sx={{ height: '220px', width: '100%' }}>
            <Bar
              data={cityStats.chartData}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: darkMode ? '#94a3b8' : '#8392ab' },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9' },
                    ticks: { color: darkMode ? '#94a3b8' : '#8392ab' },
                  },
                },
              }}
            />
          </Box>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}
      >
        
        <Card
          sx={{
            p: 3,
            borderRadius: '16px',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
            boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <BarChartRoundedIcon sx={{ color: '#16a34a', fontSize: '20px' }} />
            <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '16px', color: darkMode ? '#ffffff' : '#344767' }}>
              Topic Category Classification
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#8392ab', mb: 2 }}>
            Dominant themes identified by NLP enrichment: Public health, enforcement, stubble burning
          </Typography>

          <Divider sx={{ my: 1.5, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }} />

          <Box sx={{ height: '220px', width: '100%' }}>
            <Bar
              data={categoryStats.chartData}
              options={{
                indexAxis: 'y',
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: { color: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9' },
                    ticks: { color: darkMode ? '#94a3b8' : '#8392ab' },
                  },
                  y: {
                    grid: { display: false },
                    ticks: { color: darkMode ? '#94a3b8' : '#8392ab' },
                  },
                },
              }}
            />
          </Box>
        </Card>

        <Card
          sx={{
            p: 3,
            borderRadius: '16px',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
            boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PieChartRoundedIcon sx={{ color: '#2dce89', fontSize: '20px' }} />
            <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '16px', color: darkMode ? '#ffffff' : '#344767' }}>
              Public Sentiment Distribution
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#8392ab', mb: 2 }}>
            Alarmed / Critical outcry vs solution-oriented and informative reporting
          </Typography>

          <Divider sx={{ my: 1.5, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }} />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
              minHeight: '220px',
            }}
          >
            {loading && !stats ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', gap: 1.5, width: '100%' }}>
                <CircularProgress size={32} sx={{ color: '#2dce89' }} />
                <Typography sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                  Loading sentiment distribution...
                </Typography>
              </Box>
            ) : sentimentStats.legendItems.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', gap: 1, width: '100%', py: 3 }}>
                <PieChartRoundedIcon sx={{ fontSize: '40px', color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }} />
                <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#64748b' }}>
                  No sentiment data available
                </Typography>
                <Typography sx={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', textAlign: 'center', maxWidth: '280px' }}>
                  Sentiment records will populate automatically as posts are classified.
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ width: '180px', height: '180px', flexShrink: 0, position: 'relative' }}>
                  <Pie
                    data={sentimentStats.chartData}
                    options={{
                      plugins: { legend: { display: false } },
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {sentimentStats.legendItems.map((item) => (
                    <Box
                      key={item.name}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        borderRadius: '8px',
                        backgroundColor: darkMode ? '#090e15' : '#f8fafc',
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Box
                          sx={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: item.color,
                            flexShrink: 0,
                          }}
                        />
                        <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: darkMode ? '#e2e8f0' : '#344767' }}>
                          {item.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b' }}>
                          {item.count}
                        </Typography>
                        <Box
                          sx={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: darkMode ? '#cbd5e1' : '#64748b',
                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#edf2f7',
                            px: 0.8,
                            py: 0.2,
                            borderRadius: '4px',
                          }}
                        >
                          {item.pct}%
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Card>
      </Box>

      <Card
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '16px',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
          boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpRoundedIcon sx={{ color: '#16a34a', fontSize: '22px' }} />
              <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '18px', color: darkMode ? '#ffffff' : '#1e293b' }}>
                Viral Impact & Influence Leaderboard
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#8392ab', mt: 0.3 }}>
              Top 10 most viral X.com posts ranked by composite engagement (Likes, Retweets, Replies, Views)
            </Typography>
          </Box>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              px: 1.5,
              py: 0.5,
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            TOP ENGAGEMENT
          </Box>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }} />

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 950, width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '60px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '85px' }} />
              <col style={{ width: '95px' }} />
              <col style={{ width: '85px' }} />
              <col style={{ width: '95px' }} />
            </colgroup>
            <TableHead sx={{ display: 'table-header-group', backgroundColor: darkMode ? '#090e15' : '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, whiteSpace: 'nowrap', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Rank</TableCell>
                <TableCell sx={{ textAlign: 'left', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, whiteSpace: 'nowrap', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Author</TableCell>
                <TableCell sx={{ textAlign: 'left', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, whiteSpace: 'nowrap', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Post Content</TableCell>
                <TableCell sx={{ textAlign: 'left', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, whiteSpace: 'nowrap', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>City / AQI</TableCell>
                <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, whiteSpace: 'nowrap', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Likes</TableCell>
                <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, whiteSpace: 'nowrap', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Retweets</TableCell>
                <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, whiteSpace: 'nowrap', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Views</TableCell>
                <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '11px', textTransform: 'uppercase', py: 1.2, whiteSpace: 'nowrap', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }}>Direct Link</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {viralPosts.map((post, index) => (
                <TableRow
                  key={post.id || post.clean_id}
                  hover
                  sx={{
                    transition: 'background-color 0.15s ease',
                    '&:hover': { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc' },
                  }}
                >
                  <TableCell sx={{ textAlign: 'center', py: 1.6, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                    <Box
                      sx={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? '#f5365c' : index === 1 ? '#fb6340' : index === 2 ? '#16a34a' : (darkMode ? '#1e293b' : '#edf2f7'),
                        color: index < 3 ? '#ffffff' : (darkMode ? '#94a3b8' : '#495057'),
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        boxShadow: index < 3 ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                      }}
                    >
                      #{index + 1}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'left', py: 1.6, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b', lineHeight: 1.2 }}>
                      {post.authorName || post.authorUsername}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#8392ab', mt: 0.3 }}>
                      @{post.authorUsername}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'left', py: 1.6, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                    <Tooltip title={post.text} placement="top" arrow>
                      <Typography
                        sx={{
                          fontSize: '12.5px',
                          color: darkMode ? '#cbd5e1' : '#4a5568',
                          lineHeight: 1.45,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          cursor: 'pointer',
                        }}
                      >
                        {post.text}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'left', py: 1.6, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                    <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Box
                        sx={{
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#edf2f7',
                          color: darkMode ? '#cbd5e1' : '#2d3748',
                          px: 1,
                          py: 0.25,
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {post.city_detected}
                      </Box>
                      {post.aqi_value && (
                        <Box
                          sx={{
                            backgroundColor: post.aqi_value >= 300 ? (darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fff5f5') : (darkMode ? 'rgba(249, 115, 22, 0.2)' : '#fef3e2'),
                            color: post.aqi_value >= 300 ? (darkMode ? '#fca5a5' : '#e53e3e') : (darkMode ? '#fdba74' : '#dd6b20'),
                            border: post.aqi_value >= 300 ? (darkMode ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #fed7d7') : (darkMode ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid #feebc8'),
                            px: 0.8,
                            py: 0.2,
                            borderRadius: '5px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                          }}
                        >
                          AQI {post.aqi_value}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', py: 1.6, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#f5365c' }}>
                      {parseInt(post.likes, 10).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', py: 1.6, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#2dce89' }}>
                      {parseInt(post.retweets, 10).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', py: 1.6, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                    <Typography sx={{ fontSize: '12.5px', fontWeight: 500, color: darkMode ? '#94a3b8' : '#8392ab' }}>
                      {post.views ? parseInt(post.views, 10).toLocaleString() : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', py: 1.6, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : undefined }}>
                    <Button
                      component="a"
                      href={sanitizeUrl(post.postUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      variant="outlined"
                      endIcon={<LaunchRoundedIcon sx={{ fontSize: '13px !important' }} />}
                      sx={{
                        textTransform: 'none',
                        fontFamily: '"Open Sans", sans-serif',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        py: 0.4,
                        px: 1.2,
                        color: darkMode ? '#4ade80' : '#16a34a',
                        borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
                        borderRadius: '6px',
                        '&:hover': {
                          borderColor: '#16a34a',
                          backgroundColor: darkMode ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.06)',
                        },
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

AnalyticsView.propTypes = {
  dataRevision: PropTypes.number,
};

export default AnalyticsView;