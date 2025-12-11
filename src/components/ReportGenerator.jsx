// src/components/ReportGenerator.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Document, Packer, Paragraph, ImageRun, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import {
  Container, Button, Grid, Typography, Box, Paper, Chip,
  LinearProgress, Snackbar, Alert
} from '@mui/material';
import ImageSlot from './ImageSlot';
import { processImageForReport } from '../utils/cmcImageProcessor';
import { getCellTargetDimensions } from '../utils/cmcDimensions';
import CompactCalculator from './CompactCalculator';
import RecalculationGuide from './RecalculationGuide';
import { nanoid } from 'nanoid';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { motion, AnimatePresence } from 'framer-motion';
import pLimit from 'p-limit';

const createNewSlot = (title = 'Evidencia Adicional') => ({
  id: nanoid(), file: null, title: title, rotation: 0, orientation: 'horizontal'
});

const FONT_SIZE = 18;
const BORDER_COLOR = 'E0E0E0';
const CONCURRENCY_LIMIT = 3;

/**
 * generateImageTable
 * - Procesa las imágenes con processImageForReport
 * - Mantiene el orden recibido en `slots`
 * - Agrupa en `cols` columnas; completa la última fila con celdas vacías si es necesario
 */
const generateImageTable = async (slots, cols, docChildren, onProgress) => {
  if (!slots || slots.length === 0) return;

  const limit = pLimit(CONCURRENCY_LIMIT);

  // márgenes en twips (coincide con el Document page margin en handleGenerateWord)
  const marginsTwipsLeft = 720;
  const marginsTwipsRight = 720;

  // Procesar cada imagen (manteniendo orden) con límite de concurrencia.
  const processed = await Promise.all(
    slots.map((s) =>
      limit(async () => {
        const targetDims = getCellTargetDimensions(cols, s.orientation, marginsTwipsLeft, marginsTwipsRight, 1);
        const result = await processImageForReport(s.file, s.rotation, s.orientation, targetDims);
        if (onProgress) onProgress();
        return { slot: s, result };
      })
    )
  );

  const rows = [];
  let currentCells = [];
  const cellWidthPercent = 100 / cols;

  for (let i = 0; i < processed.length; i++) {
    const { slot, result } = processed[i];

    const imageType = (result.mime && result.mime.toLowerCase().includes('png')) ? 'png' : 'jpeg';

    const cellContent = [
      new Paragraph({
        children: [new TextRun({ text: slot.title || 'Evidencia', bold: true, size: FONT_SIZE, font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 }
      }),
      new Paragraph({
        children: [new ImageRun({ data: result.buffer, transformation: { width: result.width, height: result.height }, type: imageType })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      })
    ];

    const cell = new TableCell({
      children: cellContent,
      width: { size: cellWidthPercent, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR }
      }
    });

    currentCells.push(cell);

    if (currentCells.length === cols) {
      rows.push(new TableRow({ children: currentCells }));
      currentCells = [];
    }
  }

  if (currentCells.length > 0) {
    while (currentCells.length < cols) {
      currentCells.push(new TableCell({
        children: [],
        width: { size: cellWidthPercent, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } }
      }));
    }
    rows.push(new TableRow({ children: currentCells }));
  }

  const imageTable = new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });
  docChildren.push(imageTable);
  docChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }));
};

export default function ReportGenerator({ currentOption }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const slotsEndRef = useRef(null);

  // Snackbar state for "Reporte descargado"
  const [snackOpen, setSnackOpen] = useState(false);

  // Calculator state (shared for compact calculator)
  const [calcState, setCalcState] = useState({
    amountAdmin: 0,
    cashGiven: 0,
    amountReal: 0,
    surgeAdmin: 1,
    surgeReal: 1,
    surgeType: 'none',
    cashGivenAdmin: 0,
    realCashGiven: 0
  });

  // Guía HTML (ajustada: línea larga removida y textos compactos)
  const guideHtml = `
    <h2>¿Qué es un recalculo?</h2>
    <p>Es una incidencia que se realiza cuando hay algún tipo de error con la dirección del viaje — por ejemplo, cliente colocó la dirección mal o el conductor sufrió un accidente y no pudo llegar al destino.</p>

    <h3>¿Qué hay que tener en cuenta?</h3>
    <p>Debemos tener en cuenta dos puntos principales:</p>
    <ol>
      <li>Si es por dirección errónea y el cliente debe pagar más, el cliente debe aprobar y pagar el monto extra antes de crear la incidencia.</li>
      <li>Si el conductor sufrió un accidente: el viaje debe tener más de 50% de recorrido para permitir recalculo; si es menos, se cancela el viaje.</li>
    </ol>

    <h3>Dispatcher</h3>
    <p>Para validar un trip completed selecciona: tipo de flota, dirección de origen y dirección de destino.</p>

    <h3>Calculadora</h3>
    <p>Se usa para saber si aplica el recalculo. Campos clave:</p>
    <ul>
      <li><strong>Amount Admin</strong>: costo según Admin.</li>
      <li><strong>Amount Real</strong>: fare mostrado en Dispatcher.</li>
      <li><strong>Surge Real</strong>: surge en Dispatcher.</li>
      <li><strong>Surge Admin</strong>: surge en Admin (debe ser > 1.00 para usarse).</li>
    </ul>

    <h3>Página Admin</h3>
    <p>De aquí sacamos amount admin y surge admin para la calculadora y mapa del viaje.</p>
  `;

  // Show guide only when option is a recalculation flow (conductor o usuario)
  const optionName = (currentOption?.name || '').toUpperCase();
  const showGuide = optionName.includes('RECÁLCULO') || optionName.includes('RECALCULO');

  // images to show in guide: user-supplied images should be placed in public/assets/
  // Image mapping (upload your images to public/assets with these exact filenames)
  const guideImages = [
    { src: '/assets/guide_dispatch.png', alt: 'Dispatcher', width: 380 },   // image 8
    { src: '/assets/guide_calculator.png', alt: 'Calculadora', width: 300 },// image 9
    { src: '/assets/guide_admin.png', alt: 'Página Admin', width: 420 }     // image 10
  ];

  useEffect(() => {
    const requiredItems = currentOption?.items || [];
    let initialSlots = requiredItems.map(itemTitle => createNewSlot(itemTitle));
    if (initialSlots.length === 0) initialSlots.push(createNewSlot('Evidencia Principal'));
    setSlots(initialSlots);
    setSnackOpen(false);
    // reset calculator when option changes
    setCalcState({
      amountAdmin: 0,
      cashGiven: 0,
      amountReal: 0,
      surgeAdmin: 1,
      surgeReal: 1,
      surgeType: 'none',
      cashGivenAdmin: 0,
      realCashGiven: 0
    });
  }, [currentOption]);

  const handleAddSlot = useCallback(() => setSlots(prev => [...prev, createNewSlot('Nueva Evidencia')]), []);
  const handleSlotChange = useCallback((u) => setSlots(p => p.map(s => s.id === u.id ? { ...u } : s)), []);
  const handleSlotDelete = useCallback((id) => {
    setSlots(prev => {
      if (prev.length === 1) return [createNewSlot('Evidencia Principal')];
      return prev.filter(s => s.id !== id);
    });
  }, []);

  const handleGenerateWord = async () => {
    const validSlots = slots.filter(s => s.file);
    if (validSlots.length === 0) { alert('Sube al menos una imagen.'); return; }

    setLoading(true);
    setProcessedCount(0);
    setTotalToProcess(validSlots.length);

    try {
      const docChildren = [];

      docChildren.push(new Paragraph({
        children: [new TextRun({ text: 'REPORTE CMC', bold: true, size: 28, font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }));

      if (currentOption) {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: `CASO: ${currentOption.name}`, bold: true, size: 24, font: 'Calibri' })],
          spacing: { after: 200 }
        }));
      }

      // Procesamos en orden: horizontales (3 cols) y verticales (4 cols), manteniendo orden interno
      const horizontalSlots = validSlots.filter(s => s.orientation === 'horizontal');
      const verticalSlots = validSlots.filter(s => s.orientation === 'vertical');

      const onProgress = () => setProcessedCount(p => p + 1);

      if (horizontalSlots.length > 0) {
        await generateImageTable(horizontalSlots, 3, docChildren, onProgress);
      }

      if (verticalSlots.length > 0) {
        await generateImageTable(verticalSlots, 4, docChildren, onProgress);
      }

      const doc = new Document({
        sections: [{
          children: docChildren,
          properties: {
            page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
          }
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Reporte_CMC_${Date.now()}.docx`);

      // show snackbar notification after download
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

  // Decide if we should show the calculator and which mode
  const showCalculator = ['VIAJE REALIZADO CASH', 'VIAJE REALIZADO', 'VIAJE YUNO', 'RECÁLCULO', 'CAMBIO DE MONTO CASH (CMC)', 'MOVIMIENTO CERO'].includes(optionName);
  const calculatorMode = optionName === 'VIAJE REALIZADO CASH'
    ? 'cash'
    : (optionName === 'RECÁLCULO' ? 'recalculo' : (optionName === 'CAMBIO DE MONTO CASH (CMC)' ? 'cambio' : (optionName === 'MOVIMIENTO CERO' ? 'mvzero' : 'noncash')));

  return (
    <Container maxWidth="xl" sx={{ pb: 15 }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800 }}>{currentOption?.name}</Typography>
          <Chip label={currentOption?.category} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#87fcd9', fontWeight: 'bold' }} />
        </Box>
      </motion.div>

      {/* Snackbar notification shown once after download */}
      <Snackbar open={snackOpen} autoHideDuration={8000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackOpen(false)} severity="success" sx={{ width: '100%', bgcolor: '#3536ba', color: 'white' }}>
          <strong>✅ Reporte descargado</strong> — Para obtener el mejor PDF: abre el .docx en Word y use Archivo → Exportar para guardar en PDF de alta calidad.
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentOption?.warning && (
              <Paper sx={{ bgcolor: 'rgba(255, 55, 117, 0.15)', border: '1px solid #ff3775', p: 2, borderRadius: '16px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ff3775', mb: 1 }}>
                  <WarningAmberIcon /><Typography variant="h6">Atención</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#ffc1e3' }}>{currentOption.warning}</Typography>
              </Paper>
            )}

            {/* Mostrar guía solo en apartados de recalculo (conductor/usuario) */}
            {showGuide && (
              <RecalculationGuide
                guideHtml={guideHtml}
                images={guideImages}
                onEdit={null}
              />
            )}

            {/* Calculator (compact) for supported options */}
            {showCalculator && (
              <CompactCalculator
                mode={calculatorMode}
                values={calcState}
                onChange={(partial) => setCalcState(s => ({ ...s, ...partial }))}
              />
            )}

            {currentOption?.items && (
              <Paper sx={{ p: 2, bgcolor: 'rgba(20, 20, 40, 0.6)', border: '1px solid rgba(135, 252, 217, 0.2)', borderRadius: '16px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                  <AssignmentIcon sx={{ color: '#87fcd9' }} />
                  <Typography variant="subtitle1" sx={{ color: '#87fcd9', fontWeight: 700 }}>REQUISITOS</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {currentOption.items.map((item, i) => (
                    <Chip key={i} icon={<CheckCircleOutlineIcon sx={{ fontSize: '16px !important', color: '#87fcd9 !important' }} />} label={item} variant="outlined" sx={{ color: 'rgba(255,255,255,0.9)' }} />
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: 'white' }}>Evidencias ({slots.length})</Typography>
          </Box>

          <Grid container spacing={3}>
            <AnimatePresence>
              {slots.map((slot) => (
                <Grid item xs={12} md={6} lg={4} key={slot.id} component={motion.div} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <ImageSlot slot={slot} onChange={handleSlotChange} onDelete={handleSlotDelete} />
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
          <div ref={slotsEndRef} />

          {totalToProcess > 0 && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={progressValue} />
              <Typography variant="caption" sx={{ color: 'white', mt: 1 }}>{processedCount} / {totalToProcess} procesadas</Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          p: 1,
          borderRadius: '50px',
          display: 'flex',
          gap: 2,
          bgcolor: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #87fcd9',
          boxShadow: '0 0 20px rgba(135, 252, 217, 0.2)'
        }}
      >
        <Button variant="text" startIcon={<AddIcon />} onClick={handleAddSlot} sx={{ color: '#87fcd9', px: 3, borderRadius: '30px', fontWeight: 'bold' }}>
          Añadir Extra
        </Button>
        <Button variant="contained" startIcon={<DescriptionIcon />} onClick={handleGenerateWord} disabled={loading} sx={{ bgcolor: '#87fcd9', color: '#1a1a2e', fontWeight: '900', px: 4, borderRadius: '30px' }}>
          {loading ? 'Procesando...' : 'Descargar Reporte'}
        </Button>
      </Paper>
    </Container>
  );
}
