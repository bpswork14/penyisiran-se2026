import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  alpha,
  Fade,
  Skeleton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import theme from './theme';
import Header from './components/layout/Header';
import SummaryCards from './components/dashboard/SummaryCards';
import MonitoringTable from './components/table/MonitoringTable';
import { fetchAllData } from './services/googleSheets';
import { buildHierarchy, getTotals, countEntities } from './utils/dataProcessor';
import { buildDeltaMap, getTotalDeltas, attachDeltasToTree } from './utils/deltaCalculator';

function LoadingSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2.5, mb: 3 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" width="33.33%" height={160} sx={{ borderRadius: 3 }} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
    </Box>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const formatDateTime = (dateOrIso) => {
    try {
      const d = dateOrIso ? new Date(dateOrIso) : new Date();
      if (isNaN(d.getTime())) return new Date().toLocaleString('id-ID');
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchAllData(forceRefresh);

      setData({ hariIni: result.hariIni, kemarin: result.kemarin });
      setLastUpdated(formatDateTime(result.timestamp));
      setIsCached(!!result.fromCache);

      // If loaded from cache, trigger background update
      if (result.fromCache) {
        fetchAllData(true)
          .then((fresh) => {
            setData({ hariIni: fresh.hariIni, kemarin: fresh.kemarin });
            setLastUpdated(formatDateTime(fresh.timestamp));
            setIsCached(false);
          })
          .catch((e) => console.warn('Background sync warning:', e.message));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Build delta map
  const deltaMap = useMemo(() => {
    if (!data?.hariIni || !data?.kemarin) return new Map();
    return buildDeltaMap(data.hariIni, data.kemarin);
  }, [data]);

  // Build hierarchical tree with attached O(1) deltas
  const hierarchy = useMemo(() => {
    if (!data?.hariIni) return [];
    const tree = buildHierarchy(data.hariIni);
    if (deltaMap && deltaMap.size > 0) {
      attachDeltasToTree(tree, deltaMap);
    }
    return tree;
  }, [data, deltaMap]);

  const totals = useMemo(() => {
    if (!data?.hariIni) return null;
    return getTotals(data.hariIni);
  }, [data]);

  const entities = useMemo(() => {
    if (!data?.hariIni) return null;
    return countEntities(data.hariIni);
  }, [data]);

  const totalDeltas = useMemo(() => {
    if (!deltaMap || deltaMap.size === 0) return null;
    return getTotalDeltas(deltaMap);
  }, [deltaMap]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Header
          lastUpdated={lastUpdated}
          onRefresh={() => loadData(true)}
          loading={loading}
          isCached={isCached}
        />

        <Container maxWidth={false} sx={{ py: { xs: 1.5, sm: 2.5 }, px: { xs: 1.5, sm: 2.5, md: 3.5 } }}>
          {/* Error State */}
          {error && (
            <Fade in>
              <Alert
                severity="error"
                sx={{ mb: 3, borderRadius: 3 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => loadData(true)}
                  >
                    Coba Lagi
                  </Button>
                }
              >
                <AlertTitle>Gagal Memuat Data</AlertTitle>
                {error}
              </Alert>
            </Fade>
          )}

          {/* Loading State on cold start with no data */}
          {loading && !data && <LoadingSkeleton />}

          {/* Data Loaded */}
          {data && (
            <Fade in>
              <Box>
                {/* Summary Cards (3 kartu setara: Assignment, Responden Didata, Grafik Batang) */}
                <SummaryCards
                  totals={totals}
                  totalDeltas={totalDeltas}
                  entities={entities}
                  hierarchy={hierarchy}
                />

                {/* Section Title */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Rekapatilasi Progres Penyisiran SE2026 per Wilayah
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {entities?.subSls > 0
                      ? 'Klik baris untuk melihat detail hingga level Sub SLS'
                      : 'Data rekapitulasi progres per Kabupaten / Kota'}
                  </Typography>
                </Box>

                {/* Monitoring Table */}
                <MonitoringTable
                  hierarchy={hierarchy}
                  deltaMap={deltaMap}
                  totals={totals}
                  totalDeltas={totalDeltas}
                  entities={entities}
                />
              </Box>
            </Fade>
          )}
        </Container>

        {/* Footer */}
        <Box
          sx={{
            py: 2,
            px: 3,
            textAlign: 'center',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            mt: 4,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            © 2026 BPS Provinsi Sumatera Barat — Monitoring Penyisiran SE2026
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
