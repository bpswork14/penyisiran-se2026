import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
  alpha,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import UpdateIcon from '@mui/icons-material/Update';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function Header({ lastUpdated, onRefresh, loading, isCached }) {
  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: alpha('#FFFFFF', 0.9),
        backdropFilter: 'blur(12px)',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <Toolbar
        sx={{
          gap: { xs: 1, sm: 2 },
          minHeight: { xs: '56px !important', sm: '64px !important' },
          px: { xs: 1.5, sm: 3 },
          justifyContent: 'space-between',
        }}
      >
        {/* Logo / Title */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 1.5 },
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 34, sm: 40 },
              height: { xs: 34, sm: 40 },
              borderRadius: 2,
              background: 'linear-gradient(135deg, #FF9800, #F57C00)',
              boxShadow: '0 4px 12px rgba(245, 124, 0, 0.3)',
              flexShrink: 0,
            }}
          >
            <DashboardIcon sx={{ color: '#fff', fontSize: { xs: 19, sm: 22 } }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.82rem', sm: '1rem' },
                lineHeight: 1.2,
                background: 'linear-gradient(135deg, #F57C00, #E65100)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Monitoring Penyisiran SE2026
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.62rem', sm: '0.75rem' },
                display: 'block',
              }}
            >
              [Sensus Ekonomi 2026] - BPS Provinsi Sumatera Barat
            </Typography>
          </Box>
        </Box>

        {/* Status / Last Updated Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flexShrink: 0 }}>
          {lastUpdated && (
            <Chip
              icon={<UpdateIcon sx={{ fontSize: '13px !important', color: 'text.secondary' }} />}
              label={lastUpdated}
              size="small"
              variant="outlined"
              sx={{
                height: 26,
                fontSize: '0.68rem',
                fontWeight: 500,
                borderColor: 'rgba(0,0,0,0.12)',
                color: 'text.secondary',
                backgroundColor: 'rgba(0,0,0,0.02)',
                display: { xs: 'none', md: 'inline-flex' },
              }}
            />
          )}

          {/* Tombol Refresh Data */}
          <Tooltip title={lastUpdated ? `Terakhir diperbarui: ${lastUpdated}. Klik untuk refresh` : 'Tarik data terbaru dari Google Sheet'} arrow>
            <span>
              <Button
                variant="contained"
                size="small"
                onClick={onRefresh}
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={15} color="inherit" />
                  ) : (
                    <RefreshIcon sx={{ fontSize: 17 }} />
                  )
                }
                sx={{
                  background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                  textTransform: 'none',
                  px: { xs: 1.2, sm: 2 },
                  py: 0.5,
                  minWidth: { xs: 'auto', sm: 110 },
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(245, 124, 0, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #F57C00, #E65100)',
                    boxShadow: '0 4px 12px rgba(245, 124, 0, 0.35)',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(255,255,255,0.7)',
                    background: 'rgba(245, 124, 0, 0.6)',
                  },
                }}
              >
                {loading ? 'Memuat...' : 'Refresh'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
