import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Paper, IconButton, Box, TextField, ToggleButton, ToggleButtonGroup, Button, Typography } from '@mui/material';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import { recognizeImage } from '../utils/ocrWorker';

// Función auxiliar para buscar el patrón #123456
const getTicketNumberMatch = (inputTitle) => {
  return (inputTitle || '').match(/#\d+/);
};

const ImageSlot = React.memo(({ slot, onChange, onDelete }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const pasteInputRef = useRef(null);

  useEffect(() => {
    if (slot.file) {
      const url = URL.createObjectURL(slot.file);
      setPreviewUrl(url);
      return () => {
        try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
        setPreviewUrl(null);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [slot.file && slot.file.name]);

  const ticketMatch = useMemo(() => getTicketNumberMatch(slot.title), [slot.title]);

  /**
   * processNewFile:
   * - obtiene orientación
   * - intenta detectar ticket desde filename
   * - si no hay title y no hay ticket en filename, ejecuta OCR (reconocimiento) sobre la imagen
   *   y busca patrón #\d+. Si encuentra, pone titulo `TICKET #...`
   */
  const processNewFile = useCallback((file) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    // Detectar ticket desde el nombre del archivo (por ejemplo "screenshot #12345.png")
    const filenameTicket = (file.name || '').match(/#\d+/)?.[0];

    img.onload = async () => {
      const orient = img.height > img.width ? 'vertical' : 'horizontal';

      // Construir objeto base de slot actualizado
      const baseUpdate = { ...slot, file, orientation: orient };

      // Si el slot ya tiene título, no intentamos sobrescribirlo
      if (slot.title && slot.title.trim() !== '') {
        onChange(baseUpdate);
        try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
        return;
      }

      // Si filename contiene ticket, lo usamos
      if (filenameTicket) {
        onChange({ ...baseUpdate, title: `TICKET ${filenameTicket}`, _ocrAttempted: true });
        try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
        return;
      }

      // Si no hay ticket en filename y slot no tiene title, intentamos OCR (async)
      try {
        // recognizeImage acepta File/Blob o URL; le pasamos el File para evitar problemas con CORS
        const text = await recognizeImage(file);
        const ocrMatch = (text || '').match(/#\d+/);
        if (ocrMatch && ocrMatch[0]) {
          onChange({ ...baseUpdate, title: `TICKET ${ocrMatch[0]}`, _ocrAttempted: true });
        } else {
          // no detectado: sólo actualizamos file/orientation y marcamos que intentamos OCR para no repetir
          onChange({ ...baseUpdate, _ocrAttempted: true });
        }
      } catch (err) {
        console.warn('OCR failed or was skipped', err);
        onChange({ ...baseUpdate, _ocrAttempted: true });
      } finally {
        try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
      }
    };

    img.onerror = () => {
      try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
      alert('No se pudo procesar la imagen.');
    };

    img.src = url;
  }, [slot, onChange]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processNewFile(file);
    }
    e.target.value = null;
  };

  const handlePasteClick = async () => {
    try {
      // Intentamos leer texto del portapapeles primero (puede tener #12345)
      let clipboardText = '';
      try {
        clipboardText = await navigator.clipboard.readText();
      } catch (e) {
        clipboardText = '';
      }
      const textTicket = clipboardText.match(/#\d+/)?.[0];
      if (textTicket && (!slot.title || slot.title.trim() === '')) {
        onChange({ ...slot, title: `TICKET ${textTicket}` });
      }

      // Intentamos leer imágenes del portapapeles
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find(t => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          const file = new File([blob], 'pasted_image.png', { type });
          processNewFile(file);
          return;
        }
      }
      alert('No hay imagen en el portapapeles.');
    } catch (err) {
      if (pasteInputRef.current) {
        pasteInputRef.current.focus({ preventScroll: true });
        alert('Permiso al portapapeles denegado. Intenta pegar en el campo oculto (Ctrl+V) y luego clic en Pegar.');
      } else {
        console.warn(err);
      }
    }
  };

  const handleInputPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Intentar extraer texto que contenga ticket
    const text = e.clipboardData?.getData('text') || '';
    const t = text.match(/#\d+/)?.[0];
    if (t && (!slot.title || slot.title.trim() === '')) {
      onChange({ ...slot, title: `TICKET ${t}` });
    }

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        processNewFile(file);
        e.preventDefault();
        return;
      }
    }
  };

  const handleRotation = () => {
    const newRotation = (slot.rotation + 90) % 360;
    onChange({ ...slot, rotation: newRotation });
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Paper
        elevation={0}
        onPaste={handleInputPaste}
        sx={{
          p: 2,
          width: '100%',
          maxWidth: 320,
          height: 340,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          transition: 'border 0.2s',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          '&:hover': { border: '1px solid #87fcd9' }
        }}
      >
        <input ref={pasteInputRef} type="text" style={{ position: 'fixed', top: '-10000px', opacity: 0 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
          <TextField
            variant="standard"
            value={slot.title}
            onChange={(e) => {
              const newTitle = e.target.value;
              onChange({ ...slot, title: newTitle });
            }}
            InputProps={{ disableUnderline: true, style: { fontSize: '0.9rem', fontWeight: 600, color: '#f5f5ff' } }}
            fullWidth sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          />
          <IconButton size="small" onClick={() => onDelete(slot.id)} sx={{ color: '#ff3775', bgcolor: 'rgba(255, 55, 117, 0.1)' }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>

        {ticketMatch && <Typography variant="caption" sx={{ color: '#87fcd9', mb: 1 }}>{ticketMatch[0]}</Typography>}

        <Box sx={{
          flexGrow: 1, borderRadius: '12px', mb: 2,
          border: '2px dashed rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', bgcolor: 'rgba(0,0,0,0.2)'
        }}>
          {previewUrl ? (
            <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: `rotate(${slot.rotation}deg)` }} />
          ) : (
            <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              <AddPhotoAlternateIcon sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="caption" display="block">Arrastra o Pega</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <input type="file" id={`file-${slot.id}`} style={{ display: 'none' }} onChange={handleFileChange} />
            <label htmlFor={`file-${slot.id}`}>
              <Button component="span" size="small" sx={{ color: '#87fcd9', borderColor: '#87fcd9', minWidth: 'auto', px: 1, fontSize: '0.7rem' }} variant="outlined">Abrir</Button>
            </label>
            <Button size="small" onClick={handlePasteClick} startIcon={<ContentPasteIcon />} sx={{ color: 'white', fontSize: '0.7rem' }}>Pegar</Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={handleRotation} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)' }}>
              <RotateRightIcon fontSize="small" />
            </IconButton>
            <ToggleButtonGroup
              value={slot.orientation}
              exclusive
              onChange={(e, v) => v && onChange({ ...slot, orientation: v })}
              size="small" sx={{ height: 28, bgcolor: 'rgba(255,255,255,0.05)' }}
            >
              <ToggleButton value="horizontal" sx={{ border: 'none', color: '#aaa', '&.Mui-selected': { color: '#87fcd9' } }}><ViewWeekIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="vertical" sx={{ border: 'none', color: '#aaa', '&.Mui-selected': { color: '#87fcd9' } }}><ViewStreamIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}, (prev, next) => {
  return prev.slot.id === next.slot.id &&
         prev.slot.title === next.slot.title &&
         prev.slot.rotation === next.slot.rotation &&
         prev.slot.orientation === next.slot.orientation &&
         prev.slot.file === next.slot.file;
});

export default ImageSlot;
