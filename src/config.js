export const CONFIG = {
  WEBAPP_URL: import.meta.env.VITE_WEBAPP_URL || '',
};

export const COLUMN_MAPPING = {
  NO: 0,
  KODE_PROV: 1,
  PROV: 2,
  KODE_KAB: 3,
  KAB: 4,
  KODE_KEC: 5,
  KEC: 6,
  KODE_DESA: 7,
  DESA: 8,
  SLS: 9,
  KODE_SUB_SLS: 10,
  TOTAL_OPEN: 11,
  TOTAL_DRAFT: 12,
  TOTAL_SUBMITTED_RESPONDENT: 13,
  TOTAL_SUBMITTED_BY_PENCACAH: 14,
  TOTAL_APPROVED_BY_PENGAWAS: 15,
  TOTAL_EDITED_BY_PENGAWAS: 16,
  TOTAL_REJECTED_BY_PENGAWAS: 17,
  TOTAL_REVOKED_BY_PENGAWAS: 18,
  TOTAL_COMPLETED_BY_ADMIN_KABUPATEN: 19,
  TOTAL_REJECTED_BY_ADMIN_KABUPATEN: 20,
  TOTAL_EDITED_BY_ADMIN_KABUPATEN: 21,
  TOTAL_REVOKED_BY_ADMIN_KABUPATEN: 22,
  TOTAL_ASSIGNMENT: 23,
  TOTAL_RESPONDEN_DIDATA: 24,
};

export const NUMERIC_FIELDS = [
  'TARGET_PRELIST',
  'TARGET_KELUARGA',
  'TARGET_UB',
  'TARGET_UM',
  'TARGET_UMK',
  'TOTAL_OPEN',
  'TOTAL_DRAFT',
  'TOTAL_SUBMITTED_RESPONDENT',
  'TOTAL_SUBMITTED_BY_PENCACAH',
  'TOTAL_APPROVED_BY_PENGAWAS',
  'TOTAL_EDITED_BY_PENGAWAS',
  'TOTAL_REJECTED_BY_PENGAWAS',
  'TOTAL_REVOKED_BY_PENGAWAS',
  'TOTAL_COMPLETED_BY_ADMIN_KABUPATEN',
  'TOTAL_REJECTED_BY_ADMIN_KABUPATEN',
  'TOTAL_EDITED_BY_ADMIN_KABUPATEN',
  'TOTAL_REVOKED_BY_ADMIN_KABUPATEN',
  'TOTAL_ASSIGNMENT',
  'TOTAL_RESPONDEN_DIDATA',
];

// Column groups for the status assignment table
export const COLUMN_GROUPS = {
  PENCACAH: {
    label: 'Pencacah',
    color: '#E65100',
    bgColor: '#FFF3E0',
    fields: [
      // { key: 'TOTAL_OPEN', label: 'Open' },
      { key: 'TOTAL_DRAFT', label: 'Draft' },
      { key: 'TOTAL_REJECTED_BY_PENGAWAS', label: 'Rej. Pws' },
      { key: 'TOTAL_SUBMITTED_RESPONDENT', label: 'Sub. Resp' },
      { key: 'TOTAL_SUBMITTED_BY_PENCACAH', label: 'Sub. Pcch' },
    ],
  },
  PENGAWAS: {
    label: 'Pengawas',
    color: '#D84315',
    bgColor: '#FBE9E7',
    fields: [
      { key: 'TOTAL_REVOKED_BY_PENGAWAS', label: 'Rev. Pws' },
      { key: 'TOTAL_EDITED_BY_PENGAWAS', label: 'Edit Pws' },
      { key: 'TOTAL_REJECTED_BY_ADMIN_KABUPATEN', label: 'Rej. Adm' },
      { key: 'TOTAL_APPROVED_BY_PENGAWAS', label: 'App. Pws' },
    ],
  },
  ADMIN_KAB: {
    label: 'Admin Kab/Kota',
    color: '#C2185B',
    bgColor: '#FCE4EC',
    fields: [
      { key: 'TOTAL_REVOKED_BY_ADMIN_KABUPATEN', label: 'Rev. Adm' },
      { key: 'TOTAL_EDITED_BY_ADMIN_KABUPATEN', label: 'Edit Adm' },
      { key: 'TOTAL_COMPLETED_BY_ADMIN_KABUPATEN', label: 'Comp. Adm' },
    ],
  },
};

export const KETERANGAN_RESPONDEN_DIDATA = {
  title: 'Responden Didata (Usaha & Keluarga Ditemukan/Baru/Force Submit):',
  body: 'Jumlah responden usaha BKU dan keluarga yang telah berhasil didata (selain status open/draft) dengan kriteria keberadaan ditemukan dan baru termasuk usaha BKU yang diklaim sebagai usaha keluarga (force submit).'
};

export const STATUS_EXCEPT_OPEN_DRAFT = [
  'TOTAL_SUBMITTED_RESPONDENT',
  'TOTAL_SUBMITTED_BY_PENCACAH',
  'TOTAL_APPROVED_BY_PENGAWAS',
  'TOTAL_EDITED_BY_PENGAWAS',
  'TOTAL_REJECTED_BY_PENGAWAS',
  'TOTAL_REVOKED_BY_PENGAWAS',
  'TOTAL_COMPLETED_BY_ADMIN_KABUPATEN',
  'TOTAL_REJECTED_BY_ADMIN_KABUPATEN',
  'TOTAL_EDITED_BY_ADMIN_KABUPATEN',
  'TOTAL_REVOKED_BY_ADMIN_KABUPATEN',
];

export const SUMMARY_FIELDS = [
  {
    key: 'TARGET_PRELIST',
    label: 'Prelist',
    description: 'Target Prelist per wilayah (Keluarga + Usaha)',
    noDelta: true,
  },
  {
    key: 'TOTAL_RESPONDEN_DIDATA',
    label: 'Responden Didata',
    description: `${KETERANGAN_RESPONDEN_DIDATA.title}\n${KETERANGAN_RESPONDEN_DIDATA.body}`
  },
  {
    key: 'PERCENT_DIDATA',
    label: '% Didata',
    isPercent: true,
    description: 'Persentase responden didata terhadap target prelist.'
  },
  {
    key: 'TOTAL_ASSIGNMENT',
    label: 'Assignment',
  },
  {
    key: 'PROGRES_HARIAN',
    label: 'Progres Harian',
    isProgresHarian: true,
    description: 'Penjumlahan semua status (selain open & draft) hari ini dikurang hari kemarin beserta persentasenya.'
  },
];
