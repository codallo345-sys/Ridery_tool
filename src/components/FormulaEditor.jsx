import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import FunctionsIcon from '@mui/icons-material/Functions';

export default function FormulaEditor({ optionName = '', value = '', onSave = () => {}, isAdmin = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const safeOption = optionName || 'Incidencia';

  useEffect(() => {
    setDraft(value || '');
    setEditing(false);
  }, [value, optionName]);

  const handleSave = async () => {
    if (!isAdmin) {
      alert('Solo administradores pueden editar fórmulas.');
      return;
    }
    try {
      await onSave(optionName, draft);
      setEditing(false);
    } catch (error) {
      console.error(error);
      alert('No se pudo guardar la fórmula.');
    }
  };

  return (
    <Paper
      sx={{
        p: 2.5,
        bgcolor: 'transparent',
        border: '1px solid rgba(135,252,217,0.15)',
        borderRadius: '14px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FunctionsIcon sx={{ color: '#87fcd9' }} />
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#87fcd9', fontWeight: 700 }}>
              Fórmula
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {safeOption}
            </Typography>
          </Box>
        </Box>
        {isAdmin && !editing && (
          <Button size="small" variant="outlined" onClick={() => setEditing(true)} sx={{ color: '#87fcd9', borderColor: '#87fcd9' }}>
            Editar
          </Button>
        )}
      </Box>

      {!editing ? (
        <Typography sx={{ whiteSpace: 'pre-line', color: 'rgba(255,255,255,0.92)' }}>
          {value || 'No hay fórmula definida para esta incidencia.'}
        </Typography>
      ) : (
        <>
          <TextField
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            multiline
            minRows={4}
            fullWidth
            placeholder="Define aquí la fórmula o pasos de cálculo."
            sx={{ bgcolor: 'rgba(255,255,255,0.02)', '& .MuiInputBase-input': { color: '#fff' } }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
            <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#87fcd9', color: '#0f1720' }}>
              Guardar
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setEditing(false);
                setDraft(value || '');
              }}
              sx={{ color: '#87fcd9', borderColor: '#87fcd9' }}
            >
              Cancelar
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}
