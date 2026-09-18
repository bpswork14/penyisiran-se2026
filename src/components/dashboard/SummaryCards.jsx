import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tooltip,
  LinearProgress,
  alpha,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import { KETERANGAN_RESPONDEN_DIDATA } from '../../config';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  delta,
  deltaPct,
  color = 'primary',
  keterangan = null,
}) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const deltaColor = isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.secondary';

  // Tampilkan angka penuh tanpa singkatan (rb / jt)
  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num.toLocaleString('id-ID');
    }
    return num || '0';
  };

  const themeColor = color === 'primary' ? '#FF9800' : color;
  const darkColor = color === 'primary' ? '#F57C00' : color;

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        background: `linear-gradient(135deg, ${alpha(themeColor, 0.04)}, ${alpha(darkColor, 0.01)})`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.02em', fontSize: '0.8rem' }}>
                {title}
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', fontSize: '1.85rem' }}>
              {formatNumber(value)}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2,
              bgcolor: alpha(themeColor, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ml: 1.5,
            }}
          >
            <Icon
              sx={{
                fontSize: 24,
                color: darkColor,
              }}
            />
          </Box>
        </Box>

        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.78rem', mb: 0.5 }}>
            {subtitle}
          </Typography>
        )}

        {delta !== undefined && delta !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.8 }}>
            {isPositive && <ArrowUpwardIcon sx={{ fontSize: 15, color: deltaColor }} />}
            {isNegative && <ArrowDownwardIcon sx={{ fontSize: 15, color: deltaColor }} />}
            <Typography variant="caption" sx={{ fontWeight: 700, color: deltaColor, fontSize: '0.78rem' }}>
              {isPositive ? '+' : ''}
              {delta?.toLocaleString('id-ID')}
            </Typography>
            {deltaPct !== undefined && (
              <Typography variant="caption" sx={{ fontWeight: 600, color: deltaColor, fontSize: '0.78rem' }}>
                ({isPositive ? '+' : ''}{deltaPct?.toFixed(2)}%)
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              dibanding kemarin
            </Typography>
          </Box>
        )}

        {keterangan && (
          <Box
            sx={{
              mt: 'auto',
              pt: 1.2,
              borderTop: '1px dashed rgba(0,0,0,0.08)',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', lineHeight: 1.35 }}>
              <span style={{ fontWeight: 700, color: '#2E7D32' }}>{keterangan.title}</span> {keterangan.body}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Card Grafik Batang Horizontal: Peringkat Progres Kab/Kota
 * Didesain setara dengan ukuran kartu lainnya
 */
function ProgressBarChartCard({ hierarchy }) {
  const sortedData = useMemo(() => {
    if (!hierarchy || hierarchy.length === 0) return [];
    return hierarchy
      .map((node) => {
        const prelist = node.data?.TARGET_PRELIST || 0;
        const didata = node.data?.TOTAL_RESPONDEN_DIDATA || 0;
        const pct = prelist > 0 ? (didata / prelist) * 100 : 0;
        return {
          id: node.id,
          kode: node.kode,
          nama: node.nama,
          prelist,
          didata,
          pct: Math.round(pct * 100) / 100,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [hierarchy]);

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        background: `linear-gradient(135deg, ${alpha('#1976D2', 0.03)}, ${alpha('#0D47A1', 0.01)})`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.02em', fontSize: '0.8rem' }}>
              PROGRES PER KAB / KOTA
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              Urutan capaian responden didata tertinggi
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2,
              bgcolor: alpha('#1976D2', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ml: 1.5,
            }}
          >
            <BarChartIcon sx={{ fontSize: 24, color: '#1976D2' }} />
          </Box>
        </Box>

        {/* Scrollable list of horizontal bars */}
        <Box
          sx={{
            flex: 1,
            maxHeight: 185,
            overflowY: 'auto',
            pr: 0.5,
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.02)', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.15)', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.25)' },
          }}
        >
          {sortedData.map((item, idx) => {
            const rank = idx + 1;
            const barColor =
              item.pct >= 80 ? '#2E7D32' : item.pct >= 50 ? '#F57C00' : '#D32F2F';

            const cleanName = item.nama
              ? item.nama.replace(/^(KAB\.?|KOTA)\s+/i, '')
              : `Wilayah ${item.kode}`;

            return (
              <Tooltip
                key={item.id}
                title={`${item.nama}: ${item.pct.toFixed(2)}% (${item.didata.toLocaleString('id-ID')} / ${item.prelist.toLocaleString('id-ID')})`}
                arrow
                placement="left"
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.45,
                    px: 0.5,
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      width: 16,
                      fontWeight: rank <= 3 ? 800 : 500,
                      color:
                        rank === 1
                          ? '#F57F17'
                          : rank === 2
                          ? '#78909C'
                          : rank === 3
                          ? '#A1887F'
                          : 'text.secondary',
                      fontSize: '0.68rem',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {rank}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      width: 90,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'text.primary',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flexShrink: 0,
                    }}
                  >
                    {cleanName}
                  </Typography>

                  <Box sx={{ flex: 1, minWidth: 40 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(item.pct, 100)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(0,0,0,0.06)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          bgcolor: barColor,
                        },
                      }}
                    />
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      width: 42,
                      textAlign: 'right',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: barColor,
                      flexShrink: 0,
                    }}
                  >
                    {item.pct.toFixed(1)}%
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function SummaryCards({ totals, totalDeltas, entities, hierarchy }) {
  const totalPrelist = totals?.TARGET_PRELIST || 0;
  const totalDidata = totals?.TOTAL_RESPONDEN_DIDATA || 0;
  const pctDidata = totalPrelist > 0 ? (totalDidata / totalPrelist) * 100 : 0;

  const assignmentDelta = totalDeltas?.TOTAL_ASSIGNMENT;
  const didataDelta = totalDeltas?.TOTAL_RESPONDEN_DIDATA;

  return (
    <Grid container spacing={2.5} sx={{ mb: 3, alignItems: 'stretch' }}>
      {/* 1. Total Assignment Card */}
      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard
          title="TOTAL ASSIGNMENT"
          value={totals?.TOTAL_ASSIGNMENT || 0}
          subtitle={
            entities?.subSls > 0
              ? `${entities.subSls.toLocaleString('id-ID')} total Sub SLS`
              : `${entities?.kab || 0} Kabupaten / Kota`
          }
          icon={AssignmentIcon}
          delta={assignmentDelta?.delta}
          deltaPct={assignmentDelta?.pct}
          color="primary"
        />
      </Grid>

      {/* 2. Total Responden Didata Card */}
      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard
          title="TOTAL RESPONDEN DIDATA"
          value={totalDidata}
          subtitle={`Progress: ${pctDidata.toFixed(2)}% dari target prelist`}
          icon={PeopleIcon}
          delta={didataDelta?.delta}
          deltaPct={didataDelta?.pct}
          color="#2E7D32"
          keterangan={KETERANGAN_RESPONDEN_DIDATA}
        />
      </Grid>

      {/* 3. Grafik Batang Horizontal: Peringkat Progres Kab/Kota */}
      <Grid size={{ xs: 12, md: 4 }}>
        <ProgressBarChartCard hierarchy={hierarchy} />
      </Grid>
    </Grid>
  );
}
