// ReportGenerator completo — guías con Firestore y UI refinada (gradientes suaves, chips y cards estilizadas).
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Document, Packer, Paragraph, ImageRun, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import {
  Container, Button, Grid, Typography, Box, Paper, Chip,
  LinearProgress, Snackbar, Alert, Tabs, Tab, TextField
} from '@mui/material';
import ImageSlot from './ImageSlot';
import { processImageForReport } from '../utils/cmcImageProcessor';
import { getDimensionsFor, CM_TO_TWIPS, CM_TO_PIXELS } from '../utils/cmcDimensions';
import CompactCalculator from './CompactCalculator';
import RecalculationGuide from './RecalculationGuide';
import RecalculationPanel from './RecalculationPanel';
import CategoryPanel from './CategoryPanel';
import { nanoid } from 'nanoid';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { motion, AnimatePresence } from 'framer-motion';
import pLimit from 'p-limit';

// Firestore helpers
import { saveGuia, subscribeToGuias } from '../lib/data/guias';
import { guideNameToSlug } from '../utils/guideSlugMap';

const createNewSlot = (title = 'Evidencia Adicional') => ({
  id: nanoid(), file: null, title: title, rotation: 0, orientation: 'horizontal', size: 'normal'
});

const FONT_SIZE = 18;
const BORDER_COLOR = 'E0E0E0';
const CONCURRENCY_LIMIT = 3;
const PAGE_WIDTH_CM = 21; // A4 width in cm (used to bound tables)
const PAGE_WIDTH_TWIPS = Math.round(PAGE_WIDTH_CM * CM_TO_TWIPS); // ~21 cm page width to bound table width
const PAGE_MARGIN_CM = 1.27; // 0.5 in
const PAGE_MARGIN_TWIPS = Math.round(PAGE_MARGIN_CM * CM_TO_TWIPS);  // aligns with section page.margin defined in the Document
const COLS_PER_ROW = 3; // 3 images per row
const BASE_DIMS_CM = {
  horizontal: { widthCm: 6.56, heightCm: 6.56 },
  vertical: { widthCm: 6.56, heightCm: 6.56 }
};
const QUALITY_RENDER_SCALE = 4; // render at higher resolution to improve clarity in Word
const MIN_OUTPUT_WIDTH_PX = 3840;
const MIN_OUTPUT_HEIGHT_PX = 2160;
const DEFAULT_REPORT_TITLE = 'REPORTE CMC HD';
const WHITESPACE_PATTERN = /\s+/g;
const INVALID_CHARS_PATTERN = /[^a-zA-Z0-9_-]/g;
const sanitizeForFilename = (value) => (value || '').trim().replace(WHITESPACE_PATTERN, '_').replace(INVALID_CHARS_PATTERN, '');

// --- Guías por defecto ---
const DEFAULT_GUIDES = {
  "CAMBIO DE MONTO CASH (CMC)": `Cambio de Monto CASH (CMC)
Descripción:
Se usa para corregir errores relacionados con cobros en efectivo. Adjunta ticket y evidencia del cobro. 
Pasos:
1) Verificar ticket.
2) Obtener captura de la transacción o fotografía del recibo.
3) Aplicar ajuste en Admin y registrar evidencia.`,

  "VIAJE REALIZADO": `Incidencia: Viaje Realizado
Descripción:
Se crea cuando el servicio fue prestado pero existen errores en el cobro/estado. 
Pasos:
- Revisar historial del viaje.
- Verificar comunicaciones con el rider.
- Registrar evidencias: ticket, viaje admin, mapa.`,

  "VIAJE REALIZADO CASH": `Incidencia: Viaje Realizado (CASH)
Descripción:
Usada cuando el viaje fue pagado en efectivo y no queda registrado correctamente.
Pasos:
- Verificar comprobante/ticket del conductor.
- Validar monto recibido.
- Aplicar abono o ajuste si corresponde.`,

  "RECÁLCULO": `Recalculo (Incidencia)
Descripción:
Se realiza cuando hay diferencias entre amount admin y amount real o problemas con surge.
Campos a considerar:
- Amount Admin: costo según Admin.
- Amount Real: fare mostrado en Dispatcher.
- Surge Real y Surge Admin.
Usar calculadora para validar si aplica recalculo.`,

  "MOVIMIENTO CERO": `Incidencia: Movimiento Cero
Descripción:
Se tramita cuando se detecta que el conductor reportó un cobro en efectivo inexistente ($0).
Pasos:
- Revisar evidencia y conversación.
- Si procede, anular el movimiento y notificar al conductor.`,

  "VIAJE YUNO": `Viaje YUNO
Descripción:
Incidencia asociada a pagos a través de la pasarela YUNO. Verifica estado del cobro y conciliación.`,

  "ABONO CXC DISPUTA MAL LIBERADA": `Abono CXC - Disputa mal liberada
Descripción:
Uso cuando una disputa fue liberada erróneamente y produjo un abono inadecuado. Adjuntar evidencia.`,

  "ABONO CXC PAGO MÓVIL": `Abono CXC (Pago Móvil)
Descripción:
Incidencia para pagos móviles registrados incorrectamente. Requiere captura del pago, banco, teléfono y referencia.`,

  // Guías adicionales que suelen aparecer (usuario side)
  "CAMBIO DE MONTO CASH (CMC)_USUARIO": `Cambio de Monto CASH (USUARIO)
Descripción:
Asunto similar a CMC conductor pero desde perspectiva usuario. Adjuntar evidencia de pago y ticket.`,

  "RECÁLCULO_PANEL": `Guía del Panel de Recalculo
Esta guía es la guía exclusiva del panel top-level de recalculo. Solo administradores pueden editarla.
Uso:
- Revisar la calculadora.
- Revisar las evidencias y mapa.
- Decidir si aplica recalculo y el monto a ajustar.`,

  // Mensajes por defecto si no hay guía específica
  "DEFAULT": `No hay guía específica para esta incidencia. Si eres administrador, puedes agregar una guía detallada para este caso.`
};

// --- funciones para generar tablas de imágenes (.docx) ---
const generateImageTableForGroup = async (slots, cols, orientation, docChildren, onProgress) => {
  if (!slots || slots.length === 0) return;
  const safeCols = Math.max(1, cols || 1);
  const limit = pLimit(CONCURRENCY_LIMIT);

  const usableWidthTwips = Math.max(1, PAGE_WIDTH_TWIPS - (PAGE_MARGIN_TWIPS * 2));
  const cellWidthTwips = Math.floor(usableWidthTwips / safeCols);
  const tableWidthTwips = cellWidthTwips * safeCols;
  const cellWidthCm = cellWidthTwips / CM_TO_TWIPS;
  const baseDims = orientation === 'vertical' ? BASE_DIMS_CM.vertical : BASE_DIMS_CM.horizontal;
  const targetWidthCm = Math.min(cellWidthCm, baseDims.widthCm);
  const targetHeightCm = targetWidthCm * (baseDims.heightCm / baseDims.widthCm);
  const targetDisplayWidthPx = Math.max(1, Math.round(targetWidthCm * CM_TO_PIXELS));
  const targetDisplayHeightPx = Math.max(1, Math.round(targetHeightCm * CM_TO_PIXELS));
  const renderScale = QUALITY_RENDER_SCALE;
  const minWidthPx = MIN_OUTPUT_WIDTH_PX;
  const minHeightPx = MIN_OUTPUT_HEIGHT_PX;

  const processed = await Promise.all(
    slots.map((s) =>
      limit(async () => {
        const dims = getDimensionsFor(s.size || 'normal', s.orientation || 'horizontal', 1);
        const baseWidth = Math.max(1, dims.width ?? targetDisplayWidthPx);
        const aspectRatio = (dims.height && dims.width) ? dims.height / dims.width : (targetDisplayHeightPx / targetDisplayWidthPx);
        const baseHeightFromAspect = Math.round(baseWidth * aspectRatio);
        let baseHeight = dims.height;
        if (baseHeight === undefined || baseHeight === null) baseHeight = baseHeightFromAspect;
        if (baseHeight === undefined || baseHeight === null) baseHeight = targetDisplayHeightPx;
        baseHeight = Math.max(1, baseHeight); // preserve aspect ratio even if height is missing
        const scale = Math.min(1, targetDisplayWidthPx / baseWidth);
        const targetDims = {
          width: Math.max(1, Math.round(baseWidth * scale)),
          height: Math.max(1, Math.round(baseHeight * scale)),
          displayWidth: targetDisplayWidthPx,
          displayHeight: targetDisplayHeightPx,
          renderScale,
          minWidth: minWidthPx,
          minHeight: minHeightPx
        };
        const result = await processImageForReport(s.file, s.rotation || 0, s.orientation || 'horizontal', targetDims);
        if (onProgress) onProgress();
        return { slot: s, result, dims };
      })
    )
  );

  if (processed.length === 0) return;

  const rows = [];
  let currentCells = [];

  for (let i = 0; i < processed.length; i++) {
    const { slot, result } = processed[i];
    const imageType = (result.mime && result.mime.toLowerCase().includes('png')) ? 'png' : 'jpeg';

    const titleParagraph = new Paragraph({
      children: [new TextRun({ text: slot.title || 'Evidencia', bold: true, size: FONT_SIZE, font: 'Calibri' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 }
    });

    const displayWidth = result.displayWidth || result.width;
    const displayHeight = result.displayHeight || result.height;

    const imageParagraph = new Paragraph({
      children: [new ImageRun({ data: result.buffer, transformation: { width: displayWidth, height: displayHeight }, type: imageType })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 }
    });

    const cell = new TableCell({
      children: [titleParagraph, imageParagraph],
      width: { size: cellWidthTwips, type: WidthType.DXA },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR }
      }
    });

    currentCells.push(cell);

    if (currentCells.length === safeCols) {
      rows.push(new TableRow({ children: currentCells }));
      currentCells = [];
    }
  }

  if (currentCells.length > 0) {
    while (currentCells.length < safeCols) {
      currentCells.push(new TableCell({
        children: [],
        width: { size: cellWidthTwips, type: WidthType.DXA },
        borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } }
      }));
    }
    rows.push(new TableRow({ children: currentCells }));
  }

  const imageTable = new Table({
    rows,
    width: { size: tableWidthTwips, type: WidthType.DXA }
  });

  docChildren.push(imageTable);
  docChildren.push(new Paragraph({ text: '', spacing: { after: 80 } }));
};

// ------------------ componente principal ------------------
export default function ReportGenerator({ currentOption }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const slotsEndRef = useRef(null);

  const [snackOpen, setSnackOpen] = useState(false);

  const [calcState, setCalcState] = useState({
    amountAdmin: 0, cashGiven: 0, amountReal: 0, surgeAdmin: 1, surgeReal: 1, surgeType: 'none', cashGivenAdmin: 0, realCashGiven: 0
  });

  const [reportTitle, setReportTitle] = useState(DEFAULT_REPORT_TITLE);
  const [incidentTitle, setIncidentTitle] = useState('');

  const [guideMap, setGuideMap] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('cmc_guides') || '{}');
      return { ...DEFAULT_GUIDES, ...stored };
    } catch (e) {
      return { ...DEFAULT_GUIDES };
    }
  });

  const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem('cmc_is_admin'));

  // Suscripción a Firestore para traer guías y rellenar guideMap
  useEffect(() => {
    let unsub = null;
    try {
      unsub = subscribeToGuias((docs) => {
        const map = {};
        docs.forEach((d) => {
          const key = d.title || d.slug || '';
          if (key) map[key] = d.content || '';
        });
        setGuideMap((prev) => ({ ...DEFAULT_GUIDES, ...prev, ...map }));
        try { localStorage.setItem('cmc_guides', JSON.stringify(map)); } catch (e) {}
      });
    } catch (e) {
      console.warn('subscribeToGuides failed', e);
    }
    return () => { if (unsub) unsub(); };
  }, []);

  // when currentOption changes, reset slots and calc
  useEffect(() => {
    const requiredItems = currentOption?.items || [];
    let initialSlots = requiredItems.map(itemTitle => createNewSlot(itemTitle));
    if (initialSlots.length === 0) initialSlots.push(createNewSlot('Evidencia Principal'));
    setSlots(initialSlots);
    setSnackOpen(false);
    setCalcState({
      amountAdmin: 0, cashGiven: 0, amountReal: 0, surgeAdmin: 1, surgeReal: 1, surgeType: 'none', cashGivenAdmin: 0, realCashGiven: 0
    });
    const defaultTitle = currentOption?.name ? `REPORTE ${currentOption.name} HD` : DEFAULT_REPORT_TITLE;
    setReportTitle(defaultTitle);
    setIncidentTitle(currentOption?.name || '');
    const onStorage = () => setIsAdmin(!!localStorage.getItem('cmc_is_admin'));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [currentOption]);

  // Guardar guía en Firestore por slug fijo
  const handleGuideSave = async (optionKey, newHtml) => {
    if (!localStorage.getItem('cmc_is_admin')) { alert('Solo admin puede guardar guías.'); return; }
    try {
      const slug = guideNameToSlug(optionKey);
      await saveGuia(slug, {
        title: optionKey,
        content: newHtml,
        audiences: [],
        isPublished: true,
        category: 'incidencias',
        updatedBy: 'admin',
      });
      const stored = JSON.parse(localStorage.getItem('cmc_guides') || '{}');
      stored[optionKey] = newHtml;
      localStorage.setItem('cmc_guides', JSON.stringify(stored));
      setGuideMap(prev => ({ ...prev, [optionKey]: newHtml }));
    } catch (e) {
      console.error(e);
      alert('Error guardando guía.');
    }
  };

  // slot handlers
  const handleAddSlot = useCallback(() => setSlots(prev => [...prev, createNewSlot('Nueva Evidencia')]), []);
  const handleSlotChange = useCallback((u) => setSlots(p => p.map(s => s.id === u.id ? { ...u } : s)), []);
  const handleSlotDelete = useCallback((id) => {
    setSlots(prev => {
      if (prev.length === 1) return [createNewSlot('Evidencia Principal')];
      return prev.filter(s => s.id !== id);
    });
  }, []);

  const extractTicketFromSlots = (slotList) => {
    const ticketRegex = /#\d+/;
    for (const s of slotList) {
      if (s.title) {
        const m = String(s.title).match(ticketRegex);
        if (m) return m[0];
      }
      if (s.file && s.file.name) {
        const m2 = String(s.file.name).match(ticketRegex);
        if (m2) return m2[0];
      }
    }
    return null;
  };

  const handleGenerateWord = async () => {
    const validSlots = slots.filter(s => s.file);
    if (validSlots.length === 0) { alert('Sube al menos una imagen.'); return; }

    const effectiveReportTitle = (reportTitle || DEFAULT_REPORT_TITLE).trim() || DEFAULT_REPORT_TITLE;
    const effectiveIncidentTitle = (incidentTitle || currentOption?.name || 'Incidencia').trim();

    setLoading(true);
    setProcessedCount(0);
    setTotalToProcess(validSlots.length);

    try {
      const docChildren = [];

      docChildren.push(new Paragraph({
        children: [new TextRun({ text: effectiveReportTitle, bold: true, size: 28, font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 }
      }));

      if (currentOption) {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: `CASO: ${effectiveIncidentTitle}`, bold: true, size: 24, font: 'Calibri' })],
          spacing: { after: 60 }
        }));
        const ticket = extractTicketFromSlots(validSlots);
        if (ticket) {
          docChildren.push(new Paragraph({
            children: [new TextRun({ text: `TICKET: ${ticket}`, bold: false, size: 22, font: 'Calibri' })],
            spacing: { after: 120 }
          }));
        }
      }

      const horizontalSlots = validSlots.filter((s) => {
        const orientation = s.orientation ?? 'horizontal';
        return orientation === 'horizontal';
      });
      const verticalSlots = validSlots.filter(s => s.orientation === 'vertical');

      const groupAndProcess = async (arr, orientation, onProgress) => {
        const bySize = { normal: [], mediana: [], grande: [] };
        arr.forEach(s => bySize[s.size || 'normal'].push(s));

        if (bySize.normal.length) await generateImageTableForGroup(bySize.normal, COLS_PER_ROW, orientation, docChildren, onProgress);
        if (bySize.mediana.length) await generateImageTableForGroup(bySize.mediana, COLS_PER_ROW, orientation, docChildren, onProgress);
        if (bySize.grande.length) await generateImageTableForGroup(bySize.grande, COLS_PER_ROW, orientation, docChildren, onProgress);
      };

      const onProgress = () => setProcessedCount(p => p + 1);

      if (horizontalSlots.length > 0) await groupAndProcess(horizontalSlots, 'horizontal', onProgress);
      if (verticalSlots.length > 0) await groupAndProcess(verticalSlots, 'vertical', onProgress);

      const doc = new Document({
        sections: [{
          children: docChildren,
          properties: {
            page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
          }
        }]
      });

      const blob = await Packer.toBlob(doc);
      const safeIncident = sanitizeForFilename(effectiveIncidentTitle) || 'CMC';
      const safeTitle = sanitizeForFilename(effectiveReportTitle) || 'Reporte';
      saveAs(blob, `${safeTitle}_${safeIncident}_${Date.now()}.docx`);
      setSnackOpen(true);
    } catch (error) {
      console.error(error);
      alert('Error al generar reporte.');
    } finally {
      setLoading(false);
      setTotalToProcess(0);
      setProcessedCount(0);
    }
  };

  const progressValue = totalToProcess > 0 ? Math.round((processedCount / totalToProcess) * 100) : 0;

  const currentCategory = currentOption?.category || '';
  const isRecalculoPanel = currentCategory === 'RECALCULO';
  const isCategoryPanel = currentCategory === 'CATEGORIAS';

  const optionName = (currentOption?.name || '').toUpperCase();
  const showCalculator = ['VIAJE REALIZADO CASH','VIAJE REALIZADO','VIAJE YUNO','RECÁLCULO','RECALCULO','CAMBIO DE MONTO CASH (CMC)','MOVIMIENTO CERO'].includes(optionName);
  const calculatorMode = optionName === 'VIAJE REALIZADO CASH' ? 'cash' : (optionName === 'RECÁLCULO' || optionName === 'RECALCULO' ? 'recalculo' : (optionName === 'CAMBIO DE MONTO CASH (CMC)' ? 'cambio' : (optionName === 'MOVIMIENTO CERO' ? 'mvzero' : 'noncash')));

  // pick guide: look for exact currentOption.name first, otherwise try to match keys by inclusion
  const pickGuideHtml = () => {
    if (!currentOption) return DEFAULT_GUIDES.DEFAULT;
    const name = currentOption.name;
  if (guideMap[name]) return guideMap[name];
  if (DEFAULT_GUIDES[name]) return DEFAULT_GUIDES[name];
    const foundKey = Object.keys(guideMap).find(k => k && name.toUpperCase().includes(k.toUpperCase()));
    if (foundKey) return guideMap[foundKey];
    const foundDefaultKey = Object.keys(DEFAULT_GUIDES).find(k => k && name.toUpperCase().includes(k.toUpperCase()));
    if (foundDefaultKey) return DEFAULT_GUIDES[foundDefaultKey];
    return DEFAULT_GUIDES.DEFAULT;
  };

  const guideHtml = pickGuideHtml();

  return (
    <Container
      maxWidth="xl"
      sx={{
        pb: 15,
        background: 'transparent',
        minHeight: '100vh',
        py: 4
      }}
    >
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, letterSpacing: 0.3 }}>
            {currentOption?.name}
          </Typography>
          <Chip
            label={currentOption?.category}
            size="small"
            sx={{
              bgcolor: 'rgba(135,252,217,0.12)',
              color: '#87fcd9',
              border: '1px solid rgba(135,252,217,0.3)',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
            />
          </Box>
        </motion.div>

        {!isRecalculoPanel && !isCategoryPanel && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <TextField
              label="Título del reporte (Word)"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              variant="filled"
              size="small"
              sx={{ minWidth: 260 }}
              InputProps={{ sx: { color: 'white', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.04)' } }}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
            />
            <TextField
              label="Título de la incidencia"
              value={incidentTitle}
              onChange={(e) => setIncidentTitle(e.target.value)}
              variant="filled"
              size="small"
              sx={{ minWidth: 260 }}
              InputProps={{ sx: { color: 'white', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.04)' } }}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
              helperText="Se usa en el encabezado y nombre del archivo"
              FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.6)' } }}
            />
          </Box>
        )}

      <Snackbar open={snackOpen} autoHideDuration={8000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert
          onClose={() => setSnackOpen(false)}
          severity="success"
          sx={{
            width: '100%',
            bgcolor: '#1f2937',
            color: '#c7fcec',
            border: '1px solid rgba(135,252,217,0.25)'
          }}
        >
          <strong>✅ Reporte descargado</strong> — Para mejor PDF: abre el .docx en Word y usa Exportar → PDF.
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentOption?.warning && (
              <Paper sx={{
                bgcolor: 'rgba(255, 55, 117, 0.12)',
                border: '1px solid rgba(255,55,117,0.35)',
                p: 2.5,
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ff95b8', mb: 1 }}>
                  <WarningAmberIcon /><Typography variant="h6" sx={{ fontWeight: 700 }}>Atención</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{currentOption.warning}</Typography>
              </Paper>
            )}

            {isRecalculoPanel ? (
              <Paper sx={{
                p: 2.5,
                bgcolor: 'transparent',
                border: '1px solid rgba(135,252,217,0.15)',
                borderRadius: '14px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
              }}>
                <Typography variant="subtitle2" sx={{ color: '#87fcd9', fontWeight: 700, mb: 1 }}>
                  Guía editable
                </Typography>
                <RecalculationPanel guideHtml={guideMap['RECÁLCULO_PANEL'] || DEFAULT_GUIDES['RECÁLCULO_PANEL']} onSaveGuide={handleGuideSave} isAdmin={isAdmin} />
              </Paper>
            ) : isCategoryPanel ? (
              <Paper sx={{
                p: 2.5,
                bgcolor: 'transparent',
                border: '1px solid rgba(135,252,217,0.15)',
                borderRadius: '14px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
              }}>
                <CategoryPanel currentOptionName={currentOption?.name || ''} onSave={handleGuideSave} />
              </Paper>
            ) : (
              <Paper sx={{
                p: 2.5,
                bgcolor: 'transparent',
                border: '1px solid rgba(135,252,217,0.15)',
                borderRadius: '14px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
              }}>
                <RecalculationGuide guideKey={currentOption?.name || 'GUIDE'} title={currentOption?.name || 'Guía'} content={guideHtml} isAdmin={isAdmin} onSave={handleGuideSave} />
              </Paper>
            )}

            {!isRecalculoPanel && !isCategoryPanel && showCalculator && (
              <Paper sx={{
                p: 2,
                bgcolor: 'transparent',
                border: '1px solid rgba(135, 252, 217, 0.2)',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
              }}>
                <CompactCalculator mode={calculatorMode} values={calcState} onChange={(partial) => setCalcState(s => ({ ...s, ...partial }))} />
              </Paper>
            )}

            {!isRecalculoPanel && currentOption?.items && (
              <Paper sx={{
                p: 2,
                bgcolor: 'transparent',
                border: '1px solid rgba(135, 252, 217, 0.2)',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                  <AssignmentIcon sx={{ color: '#87fcd9' }} />
                  <Typography variant="subtitle1" sx={{ color: '#87fcd9', fontWeight: 700 }}>REQUISITOS</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {currentOption.items.map((item, i) => (
                    <Chip
                      key={i}
                      icon={<CheckCircleOutlineIcon sx={{ fontSize: '16px !important', color: '#87fcd9 !important' }} />}
                      label={item}
                      variant="outlined"
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        borderColor: 'rgba(135,252,217,0.3)',
                        background: 'rgba(135,252,217,0.06)',
                        fontWeight: 600
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Grid>

        {!isRecalculoPanel && !isCategoryPanel ? (
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'white', letterSpacing: 0.2 }}>Evidencias ({slots.length})</Typography>
            </Box>

            <Grid container spacing={2.5}>
              <AnimatePresence>
                {slots.map((slot) => (
                  <Grid item xs={12} sm={6} md={6} lg={4} key={slot.id} component={motion.div} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    <ImageSlot slot={slot} onChange={handleSlotChange} onDelete={handleSlotDelete} />
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
            <div ref={slotsEndRef} />

            {totalToProcess > 0 && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#87fcd9' }
                  }}
                />
                <Typography variant="caption" sx={{ color: 'white', mt: 1 }}>{processedCount} / {totalToProcess} procesadas</Typography>
              </Box>
            )}
          </Grid>
        ) : (
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.92)', mb: 1 }}>
                Esta pestaña es de consulta y cálculo solamente. No puedes añadir evidencias ni generar reportes desde aquí.
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Usa las pestañas de Conductor/Usuario para crear incidencias y generar reportes con evidencias.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {!isRecalculoPanel && !isCategoryPanel && (
        <Paper elevation={24} sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          p: 1,
          borderRadius: '999px',
          display: 'flex',
          gap: 1.5,
          bgcolor: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(135,252,217,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)'
        }}>
          <Button
            variant="text"
            startIcon={<AddIcon />}
            onClick={handleAddSlot}
            sx={{
              color: '#87fcd9',
              px: 3,
              borderRadius: '30px',
              fontWeight: 'bold',
              '&:hover': { backgroundColor: 'rgba(135,252,217,0.1)' }
            }}
          >
            Añadir Extra
          </Button>
          <Button
            variant="contained"
            startIcon={<DescriptionIcon />}
            onClick={handleGenerateWord}
            disabled={loading}
            sx={{
              bgcolor: '#87fcd9',
              color: '#0f172a',
              fontWeight: 900,
              px: 4,
              borderRadius: '30px',
              '&:hover': { bgcolor: '#6ee7c8' },
              '&:disabled': { bgcolor: 'rgba(135,252,217,0.35)', color: 'rgba(15,23,42,0.65)' }
            }}
          >
            {loading ? 'Procesando...' : 'Descargar Reporte'}
          </Button>
        </Paper>
      )}
    </Container>
  );
}
