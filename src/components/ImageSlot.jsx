import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Paper, IconButton, Box, TextField, ToggleButton, ToggleButtonGroup, Button, Typography } from '@mui/material';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';

// Aux: encontrar ticket en título
const getTicketNumberMatch = (inputTitle) => (inputTitle || '').match(/#\d+/);

const ImageSlot = React.memo(({ slot, onChange, onDelete }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const pasteInputRef = useRef(null);

  useEffect(() => {
    if (!slot.file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(slot.file);
    setPreviewUrl(url);
    return () => { try { URL.revokeObjectURL(url); } catch (e) {} };
  }, [slot.file?.name, slot.file?.size, slot.file?.lastModified]);

  const ticketMatch = useMemo(() => getTicketNumberMatch(slot.title), [slot.title]);

  const processNewFile = useCallback((file) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const filenameTicket = (file.name || '').match(/#\d+/)?.[0];

    img.onload = () => {
      const orient = img.height > img.width ? 'vertical' : 'horizontal';
      if ((!slot.title || slot.title.trim() === '') && filenameTicket) {
        onChange({ ...slot, file, orientation: orient, title: `TICKET ${filenameTicket}` });
      } else {
        onChange({ ...slot, file, orientation: orient });
      }
      try { URL.revokeObjectURL(url); } catch (e) {}
    };
    img.onerror = () => { try { URL.revokeObjectURL(url); } catch (e) {} ; alert('No se pudo procesar la imagen.'); };
    img.src = url;
  }, [slot, onChange]);

  const handleFileChange = (e) => { const file = e.target.files?.[0]; if (file) processNewFile(file); e.target.value = null; };
  const handlePasteClick = async () => {
    try {
      let clipboardText = '';
      try { clipboardText = await navigator.clipboard.readText(); } catch (e) { clipboardText = ''; }
      const textTicket = clipboardText.match(/#\d+/)?.[0];
      if (textTicket && (!slot.title || slot.title.trim() === '')) onChange({ ...slot, title: `TICKET ${textTicket}` });

      if (navigator.clipboard && navigator.clipboard.read) {
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
      }
      alert('No hay imagen en el portapapeles o permiso denegado.');
    } catch (err) {
      if (pasteInputRef.current) { pasteInputRef.current.focus({ preventScroll: true }); alert('Permiso al portapapeles denegado. Pega en el campo oculto y clic Pegar.'); } else { console.warn(err); }
    }
  };

  const handleInputPaste = (e) => {
    const items = e.clipboardData?.items; if (!items) return;
    const text = e.clipboardData?.getData('text') || '';
    const t = text.match(/#\d+/)?.[0];
    if (t && (!slot.title || slot.title.trim() === '')) onChange({ ...slot, title: `TICKET ${t}` });
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        processNewFile(file);
        e.preventDefault();
        return;
      }
    }
  };

  const handleRotation = () => onChange({ ...slot, rotation: (slot.rotation + 90) % 360 });

  const size = slot.size || 'normal';
  const onSizeChange = (e, v) => { if (!v) return; onChange({ ...slot, size: v }); };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Paper elevation={0} onPaste={handleInputPaste} sx={{ p: 2, width: '100%', maxWidth: 320, height: 360, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', transition: 'border 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', '&:hover': { border: '1px solid #87fcd9' } }}>
        <input ref={pasteInputRef} type="text" style={{ position: 'fixed', top: '-10000px', opacity: 0 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
          <TextField variant="standard" value={slot.title} onChange={(e) => onChange({ ...slot, title: e.target.value })} InputProps={{ disableUnderline: true, style: { fontSize: '0.9rem', fontWeight: 600, color: '#f5f5ff' } }} fullWidth sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
          <IconButton size="small" onClick={() => onDelete(slot.id)} sx={{ color: '#ff3775', bgcolor: 'rgba(255, 55, 117, 0.1)' }}><DeleteOutlineIcon fontSize="small" /></IconButton>
        </Box>

        {ticketMatch && <Typography variant="caption" sx={{ color: '#87fcd9', mb: 1 }}>{ticketMatch[0]}</Typography>}

        <Box sx={{ flexGrow: 1, borderRadius: '12px', mb: 1, border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', bgcolor: 'rgba(0,0,0,0.2)' }}>
          {previewUrl ? <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: `rotate(${slot.rotation}deg)` }} /> : <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}><AddPhotoAlternateIcon sx={{ fontSize: 30, mb: 1 }} /><Typography variant="caption" display="block">Arrastra o Pega</Typography></Box>}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <input type="file" id={`file-${slot.id}`} style={{ display: 'none' }} onChange={handleFileChange} />
            <label htmlFor={`file-${slot.id}`}><Button component="span" size="small" sx={{ color: '#87fcd9', borderColor: '#87fcd9', minWidth: 'auto', px: 1, fontSize: '0.7rem' }} variant="outlined">Abrir</Button></label>
            <Button size="small" onClick={handlePasteClick} startIcon={<ContentPasteIcon />} sx={{ color: 'white', fontSize: '0.7rem' }}>Pegar</Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <ToggleButtonGroup value={size} exclusive onChange={onSizeChange} size="small" sx={{ height: 28, bgcolor: 'rgba(255,255,255,0.03)' }}>
              <ToggleButton value="normal" sx={{ border: 'none', color: '#aaa', '&.Mui-selected': { color: '#87fcd9' } }} title="Normal"><ViewModuleIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="mediana" sx={{ border: 'none', color: '#aaa', '&.Mui-selected': { color: '#87fcd9' } }} title="Mediana"><ViewComfyIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="grande" sx={{ border: 'none', color: '#aaa', '&.Mui-selected': { color: '#87fcd9' } }} title="Grande"><ViewComfyIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>

            <IconButton size="small" onClick={handleRotation} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)' }}><RotateRightIcon fontSize="small" /></IconButton>
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
         prev.slot.file === next.slot.file &&
         (prev.slot.size || 'normal') === (next.slot.size || 'normal');
});

export default ImageSlot;
