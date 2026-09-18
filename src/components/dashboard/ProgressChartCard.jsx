import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tooltip,
  LinearProgress,
  Chip,
  alpha,
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

const RANK_BADGES = {
  1: { bg: '#FFD700', color: '#5D4037', border: '#FFC107' }, // Emas
  2: { bg: '#E0E0E0', color: '#37474F', border: '#BDBDBD' }, // Perak
  3: { bg: '#CD7F32', color: '#FFFFFF', border: '#B87333' }, // Perunggu
};

export default function ProgressChartCard({ hierarchy }) {
  // Hitung persentase dan urutkan dari yang terbesar ke terkecil
  const sortedData = useMemo(() => {
    if (!hierarchy || hierarchy.length === 0) return [];

    return hierarchy
      .map((node) => {
        const assignment = node.data?.TOTAL_ASSIGNMENT || 0;
        const didata = node.data?.TOTAL_RESPONDEN_DIDATA || 0;
        const pct = assignment > 0 ? (didata / assignment) * 100 : 0;
        return {
          id: node.id,
          kode: node.kode,
          nama: node.nama,
          assignment,
          didata,
          pct: Math.round(pct * 100) / 100,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [hierarchy]);

  if (sortedData.length === 0) return null;

  // Bagi data menjadi 2 kolom (kiri: rank 1-10, kanan: rank 11-19) untuk tampilan rapi di desktop
  const half = Math.ceil(sortedData.length / 2);
  const leftColumn = sortedData.slice(0, half);
  const rightColumn = sortedData.slice(half);

  const renderBarItem = (item, index) => {
    const rank = index + 1;
    const badge = RANK_BADGES[rank];
    const isTopThree = rank <= 3;

    // Warna progress bar dinamis berdasarkan pencapaian
    const barColor =
      item.pct >= 80 ? '#2E7D32' : item.pct >= 50 ? '#F57C00' : '#D32F2F';

    return (
      <Box
        key={item.id}
        sx={{
          mb: 1.6,
          p: 1.2,
          borderRadius: 2,
          bgcolor: isTopThree ? alpha('#FF9800', 0.04) : 'transparent',
          border: isTopThree ? '1px solid rgba(255, 152, 0, 0.15)' : '1px solid transparent',
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: 'rgba(0,0,0,0.03)',
            transform: 'translateX(3px)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
          {/* Rank + Nama Kab/Kota */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.68rem',
                fontWeight: 700,
                bgcolor: badge ? badge.bg : 'rgba(0,0,0,0.07)',
                color: badge ? badge.color : 'text.secondary',
                border: badge ? `1px solid ${badge.border}` : 'none',
                flexShrink: 0,
              }}
            >
              {rank}
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: isTopThree ? 700 : 500,
                fontSize: '0.8rem',
                color: 'text.primary',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.nama}
            </Typography>
          </Box>

          {/* Persentase + Angka Terdata */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              {item.didata.toLocaleString('id-ID')} / {item.assignment.toLocaleString('id-ID')}
            </Typography>
            <Chip
              label={`${item.pct.toFixed(2)}%`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 700,
                bgcolor:
                  item.pct >= 80
                    ? '#E8F5E9'
                    : item.pct >= 50
                    ? '#FFF3E0'
                    : '#FFEBEE',
                color: barColor,
                border: `1px solid ${alpha(barColor, 0.3)}`,
              }}
            />
          </Box>
        </Box>

        {/* Bar Grafik Visual */}
        <Tooltip
          title={`${item.nama}: ${item.pct.toFixed(2)}% (${item.didata.toLocaleString('id-ID')} dari ${item.assignment.toLocaleString('id-ID')} responden)`}
          arrow
          placement="top"
        >
          <LinearProgress
            variant="determinate"
            value={Math.min(item.pct, 100)}
            sx={{
              height: 7,
              borderRadius: 3,
              bgcolor: 'rgba(0,0,0,0.06)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: barColor,
              },
            }}
          />
        </Tooltip>
      </Box>
    );
  };

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 3,
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Header Card */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha('#FF9800', 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LeaderboardIcon sx={{ fontSize: 22, color: '#F57C00' }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Peringkat Progres Responden Didata per Kabupaten / Kota
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Diurutkan dari persentase capaian tertinggi ke terendah
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 2 Kolom Bar Chart */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            {leftColumn.map((item, idx) => renderBarItem(item, idx))}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {rightColumn.map((item, idx) => renderBarItem(item, half + idx))}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
