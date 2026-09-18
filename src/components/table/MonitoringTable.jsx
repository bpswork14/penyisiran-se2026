import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  Collapse,
  Chip,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeltaCell from './DeltaCell';
import { COLUMN_GROUPS, SUMMARY_FIELDS, NUMERIC_FIELDS } from '../../config';
import { aggregateDeltas, getSubSlsCodes, getTotalDeltas } from '../../utils/deltaCalculator';

const LEVEL_LABELS = ['Kab/Kota', 'Kecamatan', 'Desa', 'SLS', 'Sub SLS'];
const LEVEL_COLORS = [
  { bg: '#FFF3E0', border: '#FFB74D' },
  { bg: '#FFF8E1', border: '#FFD54F' },
  { bg: '#FFFDE7', border: '#FFF176' },
  { bg: '#F1F8E9', border: '#AED581' },
  { bg: '#FFFFFF', border: 'transparent' },
];

/**
 * Build all column definitions from groups + summary (Ringkasan diletakkan di depan)
 */
function getColumnDefs() {
  const allCols = [];

  // Ringkasan di DEPAN
  SUMMARY_FIELDS.forEach((field) => {
    allCols.push({ ...field, group: 'Ringkasan', groupColor: '#2E7D32', groupBg: '#E8F5E9' });
  });

  const groups = Object.values(COLUMN_GROUPS);
  groups.forEach((group) => {
    group.fields.forEach((field) => {
      allCols.push({ ...field, group: group.label, groupColor: group.color, groupBg: group.bgColor });
    });
  });

  return allCols;
}

/**
 * Hierarchical Row Component
 */
function HierarchicalRow({ node, deltaMap, expandedMap, onToggle, depth = 0 }) {
  const isExpanded = expandedMap[node.id] || false;
  const isLeaf = !node.childrenArray || node.childrenArray.length === 0;
  const cols = useMemo(() => getColumnDefs(), []);

  // Get delta data for this node (O(1) precomputed, with fallback)
  const nodeDelta = useMemo(() => {
    if (node.deltas) return node.deltas;
    if (!deltaMap || deltaMap.size === 0) return null;
    const subSlsCodes = getSubSlsCodes(node);
    return aggregateDeltas(deltaMap, subSlsCodes);
  }, [node, deltaMap]);

  const levelColor = LEVEL_COLORS[node.level] || LEVEL_COLORS[4];

  // Calculate percentage didata (pembagi: TARGET_PRELIST)
  const totalPrelist = node.data?.TARGET_PRELIST || 0;
  const totalDidata = node.data?.TOTAL_RESPONDEN_DIDATA || 0;
  const pctDidata = totalPrelist > 0 ? ((totalDidata / totalPrelist) * 100).toFixed(2) : '0.00';

  return (
    <>
      <TableRow
        sx={{
          backgroundColor: isLeaf ? '#fff' : levelColor.bg,
          borderLeft: isLeaf ? 'none' : `3px solid ${levelColor.border}`,
          cursor: isLeaf ? 'default' : 'pointer',
          '&:hover': {
            backgroundColor: isLeaf ? alpha('#FF9800', 0.04) : alpha(levelColor.border, 0.15),
          },
          transition: 'background-color 0.15s ease',
        }}
        onClick={() => !isLeaf && onToggle(node.id)}
      >
        {/* Expand / Name cell */}
        <TableCell
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 2,
            backgroundColor: isLeaf ? '#fff' : levelColor.bg,
            borderRight: '2px solid rgba(0,0,0,0.08)',
            minWidth: { xs: 150, sm: 200, md: 260 },
            maxWidth: { xs: 180, sm: 240, md: 350 },
            px: { xs: 1, sm: 2 },
            py: '4px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', pl: depth * 1.5, minWidth: 0 }}>
            {!isLeaf ? (
              <IconButton size="small" sx={{ p: 0, mr: 0.5, flexShrink: 0 }}>
                {isExpanded ? (
                  <KeyboardArrowDownIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                ) : (
                  <KeyboardArrowRightIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                )}
              </IconButton>
            ) : (
              <Box sx={{ width: 18, mr: 0.5, flexShrink: 0 }} />
            )}
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Tooltip title={node.nama} enterDelay={400} arrow placement="top-start">
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: isLeaf ? 400 : 600,
                    fontSize: isLeaf
                      ? { xs: '0.68rem', sm: '0.75rem' }
                      : { xs: '0.72rem', sm: '0.8rem' },
                    lineHeight: 1.25,
                  }}
                >
                  {node.nama}
                </Typography>
              </Tooltip>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: '0.6rem', sm: '0.65rem' },
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {node.kode}
                {!isLeaf && node.childCount > 0 && (
                  <Chip
                    label={`${node.childCount} sub sls`}
                    size="small"
                    sx={{
                      ml: 0.5,
                      height: 15,
                      fontSize: '0.58rem',
                      bgcolor: alpha(levelColor.border, 0.2),
                    }}
                  />
                )}
              </Typography>
            </Box>
          </Box>
        </TableCell>

        {/* Status columns & Ringkasan */}
        {cols.map((col) => {
          if (col.isPercent) {
            return (
              <TableCell key={col.key} align="center" sx={{ minWidth: 75, py: '4px' }}>
                <Chip
                  label={`${pctDidata}%`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor:
                      parseFloat(pctDidata) >= 80
                        ? 'success.light'
                        : parseFloat(pctDidata) >= 50
                          ? '#FFE0B2'
                          : '#FFCDD2',
                    color:
                      parseFloat(pctDidata) >= 80
                        ? 'success.main'
                        : parseFloat(pctDidata) >= 50
                          ? '#E65100'
                          : 'error.main',
                  }}
                />
              </TableCell>
            );
          }

          if (col.isProgresHarian) {
            const progresData = nodeDelta?.PROGRES_HARIAN;
            const val = progresData?.value || 0;
            const pct = progresData?.pct || 0;
            const isPositive = val > 0;
            const isNegative = val < 0;
            const color = isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.secondary';
            const sign = isPositive ? '+' : '';

            return (
              <TableCell
                key={col.key}
                align="right"
                sx={{ minWidth: { xs: 95, sm: 110 }, py: '4px' }}
              >
                <Tooltip
                  title={
                    <Box sx={{ p: 0.5, fontSize: '0.75rem', lineHeight: 1.45 }}>
                      <b>Progres Harian: {sign}{val.toLocaleString('id-ID')}</b>
                      {progresData?.sumToday !== undefined && (
                        <div>Hari ini (selain open/draft): {progresData.sumToday.toLocaleString('id-ID')}</div>
                      )}
                      {progresData?.sumYesterday !== undefined && (
                        <div>Kemarin (selain open/draft): {progresData.sumYesterday.toLocaleString('id-ID')}</div>
                      )}
                      <div>Pertumbuhan harian: {sign}{pct.toFixed(2)}%</div>
                      {progresData?.pctAssignment !== undefined && (
                        <div>Terhadap total assignment: {sign}{progresData.pctAssignment.toFixed(2)}%</div>
                      )}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0, cursor: 'pointer' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '0.72rem', sm: '0.78rem' },
                        lineHeight: 1.2,
                        color: isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.primary',
                      }}
                    >
                      {sign}{val.toLocaleString('id-ID')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color }}>
                      {isPositive && <ArrowUpwardIcon sx={{ fontSize: 10 }} />}
                      {isNegative && <ArrowDownwardIcon sx={{ fontSize: 10 }} />}
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          lineHeight: 1,
                          color,
                        }}
                      >
                        {sign}{pct.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>
              </TableCell>
            );
          }

          const val = node.data?.[col.key] || 0;
          const delta = nodeDelta?.[col.key];
          const hasBreakdown =
            col.key === 'TARGET_PRELIST' &&
            ((node.data?.TARGET_KELUARGA || 0) > 0 ||
              (node.data?.TARGET_UB || 0) > 0 ||
              (node.data?.TARGET_UM || 0) > 0 ||
              (node.data?.TARGET_UMK || 0) > 0);

          const cellContent = (
            <DeltaCell
              value={val}
              delta={col.noDelta ? null : delta?.delta}
              pct={col.noDelta ? null : delta?.pct}
            />
          );

          return (
            <TableCell
              key={col.key}
              align="right"
              sx={{
                minWidth:
                  col.key === 'TOTAL_RESPONDEN_DIDATA'
                    ? 140
                    : col.key === 'TARGET_PRELIST'
                      ? 95
                      : 90,
                py: '4px',
              }}
            >
              {hasBreakdown ? (
                <Tooltip
                  title={
                    <Box sx={{ p: 0.5, fontSize: '0.75rem', lineHeight: 1.45 }}>
                      <b>Komposisi Target Prelist:</b>
                      <div>• Keluarga: {(node.data?.TARGET_KELUARGA || 0).toLocaleString('id-ID')}</div>
                      <div>• Usaha Baru (UB): {(node.data?.TARGET_UB || 0).toLocaleString('id-ID')}</div>
                      <div>• Usaha Menetap (UM): {(node.data?.TARGET_UM || 0).toLocaleString('id-ID')}</div>
                      <div>• UMK: {(node.data?.TARGET_UMK || 0).toLocaleString('id-ID')}</div>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Box sx={{ cursor: 'pointer' }}>{cellContent}</Box>
                </Tooltip>
              ) : (
                cellContent
              )}
            </TableCell>
          );
        })}
      </TableRow>

      {/* Children rows */}
      {isExpanded &&
        node.childrenArray &&
        node.childrenArray.map((child) => (
          <HierarchicalRow
            key={child.id}
            node={child}
            deltaMap={deltaMap}
            expandedMap={expandedMap}
            onToggle={onToggle}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

/**
 * Provinsi Sumatera Barat Accumulation Row Component
 */
function ProvinsiRow({ totals, totalDeltas, entities, cols }) {
  const totalPrelist = totals?.TARGET_PRELIST || 0;
  const totalDidata = totals?.TOTAL_RESPONDEN_DIDATA || 0;
  const pctDidata = totalPrelist > 0 ? ((totalDidata / totalPrelist) * 100).toFixed(2) : '0.00';

  const rowBg = '#FFE8D6';
  const rowHover = '#FFDEC0';
  const accentBorder = '#E65100';
  const bottomBorder = '#FFB74D';

  return (
    <TableRow
      sx={{
        backgroundColor: rowBg,
        borderLeft: `4px solid ${accentBorder}`,
        borderBottom: `2px solid ${bottomBorder}`,
        '&:hover': {
          backgroundColor: rowHover,
        },
        transition: 'background-color 0.15s ease',
      }}
    >
      {/* Sticky Region / Name cell */}
      <TableCell
        sx={{
          position: 'sticky',
          left: 0,
          zIndex: 2,
          backgroundColor: rowBg,
          borderRight: '2px solid rgba(0,0,0,0.08)',
          borderBottom: `2px solid ${bottomBorder}`,
          minWidth: { xs: 150, sm: 200, md: 260 },
          maxWidth: { xs: 180, sm: 240, md: 350 },
          px: { xs: 1, sm: 2 },
          py: '6px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Box sx={{ width: 18, mr: 0.5, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 800,
                fontSize: { xs: '0.74rem', sm: '0.82rem' },
                color: '#431407',
                lineHeight: 1.25,
                letterSpacing: '0.01em',
              }}
            >
              PROVINSI SUMATERA BARAT
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.2 }}>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: '#78350F',
                  fontSize: { xs: '0.62rem', sm: '0.68rem' },
                  fontWeight: 700,
                }}
              >
                13
              </Typography>
              <Chip
                label={
                  entities?.subSls > 0
                    ? `19 Kab/Kota (${entities.subSls.toLocaleString('id-ID')} Sub SLS)`
                    : '19 Kab/Kota'
                }
                size="small"
                sx={{
                  height: 16,
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  bgcolor: alpha('#E65100', 0.12),
                  color: '#9A3412',
                  borderRadius: 1,
                  border: '1px solid rgba(230,81,0,0.2)',
                }}
              />
            </Box>
          </Box>
        </Box>
      </TableCell>

      {/* Columns & Ringkasan */}
      {cols.map((col) => {
        if (col.isPercent) {
          return (
            <TableCell
              key={col.key}
              align="center"
              sx={{
                minWidth: 75,
                py: '6px',
                backgroundColor: rowBg,
                borderBottom: `2px solid ${bottomBorder}`,
              }}
            >
              <Chip
                label={`${pctDidata}%`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  bgcolor:
                    parseFloat(pctDidata) >= 80
                      ? 'success.light'
                      : parseFloat(pctDidata) >= 50
                        ? '#FFE0B2'
                        : '#FFCDD2',
                  color:
                    parseFloat(pctDidata) >= 80
                      ? 'success.main'
                      : parseFloat(pctDidata) >= 50
                        ? '#E65100'
                        : 'error.main',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              />
            </TableCell>
          );
        }

        if (col.isProgresHarian) {
          const progresData = totalDeltas?.PROGRES_HARIAN;
          const val = progresData?.value || 0;
          const pct = progresData?.pct || 0;
          const isPositive = val > 0;
          const isNegative = val < 0;
          const color = isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.secondary';
          const sign = isPositive ? '+' : '';

          return (
            <TableCell
              key={col.key}
              align="right"
              sx={{
                minWidth: { xs: 95, sm: 110 },
                py: '6px',
                backgroundColor: rowBg,
                borderBottom: `2px solid ${bottomBorder}`,
              }}
            >
              <Tooltip
                title={
                  <Box sx={{ p: 0.5, fontSize: '0.75rem', lineHeight: 1.45 }}>
                    <b>Progres Harian Provinsi: {sign}{val.toLocaleString('id-ID')}</b>
                    {progresData?.sumToday !== undefined && (
                      <div>Hari ini (selain open/draft): {progresData.sumToday.toLocaleString('id-ID')}</div>
                    )}
                    {progresData?.sumYesterday !== undefined && (
                      <div>Kemarin (selain open/draft): {progresData.sumYesterday.toLocaleString('id-ID')}</div>
                    )}
                    <div>Pertumbuhan harian: {sign}{pct.toFixed(2)}%</div>
                    {progresData?.pctAssignment !== undefined && (
                      <div>Terhadap total assignment: {sign}{progresData.pctAssignment.toFixed(2)}%</div>
                    )}
                  </Box>
                }
                arrow
                placement="top"
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0, cursor: 'pointer' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '0.74rem', sm: '0.82rem' },
                      lineHeight: 1.2,
                      color: isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.primary',
                    }}
                  >
                    {sign}{val.toLocaleString('id-ID')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color }}>
                    {isPositive && <ArrowUpwardIcon sx={{ fontSize: 10 }} />}
                    {isNegative && <ArrowDownwardIcon sx={{ fontSize: 10 }} />}
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        lineHeight: 1,
                        color,
                      }}
                    >
                      {sign}{pct.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>
            </TableCell>
          );
        }

        const val = totals?.[col.key] || 0;
        const delta = totalDeltas?.[col.key];
        const hasBreakdown =
          col.key === 'TARGET_PRELIST' &&
          ((totals?.TARGET_KELUARGA || 0) > 0 ||
            (totals?.TARGET_UB || 0) > 0 ||
            (totals?.TARGET_UM || 0) > 0 ||
            (totals?.TARGET_UMK || 0) > 0);

        const cellContent = (
          <DeltaCell
            value={val}
            delta={col.noDelta ? null : delta?.delta}
            pct={col.noDelta ? null : delta?.pct}
            bold
          />
        );

        return (
          <TableCell
            key={col.key}
            align="right"
            sx={{
              minWidth:
                col.key === 'TOTAL_RESPONDEN_DIDATA'
                  ? 140
                  : col.key === 'TARGET_PRELIST'
                    ? 95
                    : 90,
              py: '6px',
              backgroundColor: rowBg,
              borderBottom: `2px solid ${bottomBorder}`,
            }}
          >
            {hasBreakdown ? (
              <Tooltip
                title={
                  <Box sx={{ p: 0.5, fontSize: '0.75rem', lineHeight: 1.45 }}>
                    <b>Komposisi Target Prelist Provinsi:</b>
                    <div>• Keluarga: {(totals?.TARGET_KELUARGA || 0).toLocaleString('id-ID')}</div>
                    <div>• Usaha Baru (UB): {(totals?.TARGET_UB || 0).toLocaleString('id-ID')}</div>
                    <div>• Usaha Menetap (UM): {(totals?.TARGET_UM || 0).toLocaleString('id-ID')}</div>
                    <div>• UMK: {(totals?.TARGET_UMK || 0).toLocaleString('id-ID')}</div>
                  </Box>
                }
                arrow
                placement="top"
              >
                <Box sx={{ cursor: 'pointer' }}>{cellContent}</Box>
              </Tooltip>
            ) : (
              cellContent
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

/**
 * Main Monitoring Table Component
 */
export default function MonitoringTable({ hierarchy, deltaMap, totals, totalDeltas, entities }) {
  const [expandedMap, setExpandedMap] = useState({});
  const [selectedKab, setSelectedKab] = useState('ALL');

  const cols = useMemo(() => getColumnDefs(), []);

  // Compute fallback totals & totalDeltas if not directly provided
  const effectiveTotals = useMemo(() => {
    if (totals) return totals;
    if (!hierarchy || hierarchy.length === 0) return null;
    const result = {};
    NUMERIC_FIELDS.forEach((f) => {
      result[f] = 0;
    });
    hierarchy.forEach((kab) => {
      NUMERIC_FIELDS.forEach((f) => {
        result[f] += kab.data?.[f] || 0;
      });
    });
    return result;
  }, [totals, hierarchy]);

  const effectiveTotalDeltas = useMemo(() => {
    if (totalDeltas) return totalDeltas;
    if (!deltaMap || deltaMap.size === 0) return null;
    return getTotalDeltas(deltaMap);
  }, [totalDeltas, deltaMap]);

  const handleToggle = useCallback((id) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  // Build grouped column header info
  const groupHeaders = useMemo(() => {
    const groups = [];
    const groupMap = new Map();

    cols.forEach((col) => {
      if (!groupMap.has(col.group)) {
        groupMap.set(col.group, {
          label: col.group,
          color: col.groupColor,
          bgColor: col.groupBg || '#FFF8E1',
          count: 0,
        });
        groups.push(groupMap.get(col.group));
      }
      groupMap.get(col.group).count += 1;
    });

    return groups;
  }, [cols]);

  // Filter hierarchy by selected kabupaten/kota
  const filteredHierarchy = useMemo(() => {
    if (selectedKab === 'ALL') return hierarchy;
    return hierarchy.filter((node) => node.kode === selectedKab);
  }, [hierarchy, selectedKab]);

  return (
    <Box>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: 1.5,
          mb: 1.5,
        }}
      >
        {/* Legend */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
          {LEVEL_LABELS.map((label, i) => (
            <Chip
              key={label}
              label={label}
              size="small"
              sx={{
                height: 20,
                fontSize: { xs: '0.62rem', sm: '0.68rem' },
                fontWeight: 500,
                bgcolor: LEVEL_COLORS[i].bg,
                borderColor: LEVEL_COLORS[i].border,
                borderWidth: 1,
                borderStyle: 'solid',
              }}
            />
          ))}
        </Box>

        {/* Compact Kab/Kota Filter on right (full-width on mobile) */}
        <FormControl
          size="small"
          sx={{
            width: { xs: '100%', sm: 220 },
            minWidth: { sm: 200 },
            maxWidth: { sm: 240 },
            '& .MuiInputLabel-root': { fontSize: '0.78rem' },
          }}
        >
          <InputLabel id="select-kab-label">Kabupaten / Kota</InputLabel>
          <Select
            labelId="select-kab-label"
            id="select-kab"
            value={selectedKab}
            label="Kabupaten / Kota"
            onChange={(e) => setSelectedKab(e.target.value)}
            sx={{
              height: 32,
              fontSize: '0.78rem',
              backgroundColor: '#fff',
              borderRadius: 1.5,
              fontWeight: 500,
              '& .MuiSelect-select': {
                py: '4px !important',
                display: 'flex',
                alignItems: 'center',
              },
            }}
          >
            <MenuItem value="ALL" sx={{ fontSize: '0.78rem' }}>
              <em>Semua Wilayah ({hierarchy.length})</em>
            </MenuItem>
            {hierarchy.map((kab) => (
              <MenuItem key={kab.id} value={kab.kode} sx={{ fontSize: '0.78rem' }}>
                [{kab.kode}] {kab.nama}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Mobile Horizontal Scroll Hint */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.2,
          py: 0.6,
          mb: 1,
          borderRadius: 1.5,
          bgcolor: alpha('#FF9800', 0.08),
          color: '#E65100',
          fontSize: '0.7rem',
          fontWeight: 500,
        }}
      >
        <span>👉 Geser tabel ke kanan untuk melihat status lainnya</span>
        <Chip
          label="Swipe ↔"
          size="small"
          sx={{
            height: 18,
            fontSize: '0.6rem',
            bgcolor: '#FF9800',
            color: '#fff',
            fontWeight: 700,
          }}
        />
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: { xs: '65vh', sm: '72vh', md: 'calc(100vh - 160px)' },
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            width: 7,
            height: 7,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.03)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(245, 124, 0, 0.35)',
            borderRadius: 4,
            '&:hover': {
              backgroundColor: 'rgba(245, 124, 0, 0.6)',
            },
          },
        }}
      >
        <Table size="small" sx={{ width: '100%', minWidth: 900 }}>
          <TableHead>
            {/* Group header row (Row 1 - Top: 0 inside TableContainer) */}
            <TableRow sx={{ height: 36 }}>
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 0,
                  top: 0,
                  zIndex: 10,
                  minWidth: { xs: 150, sm: 200, md: 260 },
                  maxWidth: { xs: 180, sm: 240, md: 350 },
                  backgroundColor: '#FFFFFF',
                  borderRight: '2px solid rgba(0,0,0,0.08)',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.82rem' },
                  height: 35,
                  px: { xs: 1, sm: 2 },
                  py: '4px',
                  boxShadow: '2px 0 4px -2px rgba(0,0,0,0.08)',
                }}
              >
                Wilayah
              </TableCell>

              {groupHeaders.map((group) => (
                <TableCell
                  key={group.label}
                  align="center"
                  colSpan={group.count}
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 5,
                    backgroundColor: group.bgColor,
                    borderBottom: `2px solid ${group.color}`,
                    borderRight: '1px solid rgba(0,0,0,0.06)',
                    fontWeight: 700,
                    color: group.color,
                    fontSize: { xs: '0.72rem', sm: '0.78rem' },
                    letterSpacing: '0.03em',
                    height: 35,
                    py: '4px',
                  }}
                >
                  {group.label}
                </TableCell>
              ))}
            </TableRow>

            {/* Sub-header row (Row 2 - Top: 34px directly below Row 1) */}
            <TableRow sx={{ height: 34 }}>
              {/* Sticky Continuation Cell for Wilayah column */}
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 0,
                  top: '34px',
                  zIndex: 10,
                  minWidth: { xs: 150, sm: 200, md: 260 },
                  maxWidth: { xs: 180, sm: 240, md: 350 },
                  backgroundColor: '#FFFFFF',
                  borderRight: '2px solid rgba(0,0,0,0.08)',
                  borderBottom: '2px solid rgba(0,0,0,0.12)',
                  fontWeight: 600,
                  fontSize: { xs: '0.62rem', sm: '0.68rem' },
                  color: 'text.secondary',
                  height: 34,
                  px: { xs: 1, sm: 2 },
                  py: '4px',
                  boxShadow: '2px 2px 4px -2px rgba(0,0,0,0.08)',
                }}
              >
                Nama & Kode
              </TableCell>

              {cols.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.isPercent ? 'center' : 'right'}
                  sx={{
                    position: 'sticky',
                    top: '34px',
                    zIndex: 4,
                    backgroundColor: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    minWidth:
                      col.key === 'TOTAL_RESPONDEN_DIDATA'
                        ? { xs: 120, sm: 140 }
                        : col.key === 'TARGET_PRELIST'
                          ? { xs: 80, sm: 95 }
                          : col.isProgresHarian
                            ? { xs: 95, sm: 110 }
                            : col.isPercent
                              ? 70
                              : 85,
                    borderBottom: '2px solid rgba(0,0,0,0.12)',
                    borderRight: '1px solid rgba(0,0,0,0.04)',
                    whiteSpace: 'nowrap',
                    height: 34,
                    py: '4px',
                    boxShadow: '0 2px 3px -1px rgba(0,0,0,0.05)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: col.isPercent ? 'center' : 'flex-end',
                      gap: 0.5,
                      width: '100%',
                    }}
                  >
                    <span>{col.label}</span>
                    {col.description && (
                      <Tooltip
                        title={
                          <Box sx={{ p: 0.5, whiteSpace: 'pre-line', fontSize: '0.75rem', lineHeight: 1.45 }}>
                            {col.description}
                          </Box>
                        }
                        arrow
                        placement="top"
                      >
                        <InfoOutlinedIcon sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer' }} />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Akumulasi Provinsi Sumatera Barat */}
            {selectedKab === 'ALL' && effectiveTotals && (
              <ProvinsiRow
                totals={effectiveTotals}
                totalDeltas={effectiveTotalDeltas}
                entities={entities}
                cols={cols}
              />
            )}

            {filteredHierarchy.map((node) => (
              <HierarchicalRow
                key={node.id}
                node={node}
                deltaMap={deltaMap}
                expandedMap={expandedMap}
                onToggle={handleToggle}
                depth={0}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
