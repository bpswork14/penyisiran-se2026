import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';

/**
 * DeltaCell - Shows a value with its delta indicator
 *
 * Props:
 * - value: number
 * - delta: number (change from yesterday)
 * - pct: number (percent change)
 * - compact: bool (if true, show only delta chip)
 * - showValue: bool (default true)
 */
export default function DeltaCell({ value, delta, pct, compact = false, showValue = true, bold = false }) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const isZero = delta === 0;

  const color = isPositive ? 'success' : isNegative ? 'error' : 'default';
  const textColor = isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.secondary';

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('id-ID');
  };

  const formatDelta = (num) => {
    if (num === 0) return '0';
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toLocaleString('id-ID')}`;
  };

  const formatPct = (num) => {
    if (num === 0) return '0%';
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  if (compact) {
    return (
      <Chip
        size="small"
        icon={
          isPositive ? (
            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
          ) : isNegative ? (
            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
          ) : (
            <RemoveIcon sx={{ fontSize: 12 }} />
          )
        }
        label={`${formatDelta(delta)} (${formatPct(pct)})`}
        color={color}
        variant="outlined"
        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
      {showValue && (
        <Typography variant="body2" sx={{ fontWeight: bold ? 800 : 600, lineHeight: 1.2 }}>
          {formatNumber(value)}
        </Typography>
      )}
      {delta !== undefined && delta !== null && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            color: textColor,
          }}
        >
          {isPositive && <ArrowUpwardIcon sx={{ fontSize: 10 }} />}
          {isNegative && <ArrowDownwardIcon sx={{ fontSize: 10 }} />}
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 600,
              lineHeight: 1,
              color: textColor,
            }}
          >
            {formatDelta(delta)} ({formatPct(pct)})
          </Typography>
        </Box>
      )}
    </Box>
  );
}
