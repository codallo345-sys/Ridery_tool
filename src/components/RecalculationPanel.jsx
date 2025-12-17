import React from 'react';
import { Box, Typography } from '@mui/material';
import RecalculationGuide from './RecalculationGuide';
import CompactCalculator from './CompactCalculator';

/**
 * RecalculationPanel
 * - Panel top-level para RECÁLCULO (guía única editable por admin)
 * Props:
 * - guideHtml: content string for RECÁLCULO_PANEL
 * - onSaveGuide: function(guideKey, html)
 * - isAdmin: boolean
 */
export default function RecalculationPanel({ guideHtml = '', onSaveGuide = null, isAdmin = false }) {
  const PANEL_KEY = 'RECÁLCULO_PANEL';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ color: '#87fcd9', fontWeight: 900 }}>Recalculo (Panel)</Typography>

      <RecalculationGuide
        guideKey={PANEL_KEY}
        title="Guía del Panel de Recalculo"
        content={guideHtml}
        isAdmin={isAdmin}
        onSave={onSaveGuide}
      />

      <CompactCalculator mode="recalculo" values={{}} onChange={() => {}} />

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Este panel es únicamente para consulta y cálculo. No cargues evidencias ni generes reportes desde aquí.
      </Typography>
    </Box>
  );
}