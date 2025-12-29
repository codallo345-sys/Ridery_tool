import React, { useEffect, useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Button, TextField } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * RecalculationGuide
 * Props:
 * - guideKey: string (clave/id de la guía)
 * - title: string (título visible)
 * - content: string (texto/HTML de la guía)
 * - isAdmin: boolean (muestra botón Editar si true)
 * - onSave: async function(guideKey, newHtml) -> guarda la guía (puede ser a Firestore)
 *
 * Nota: mostramos el contenido como texto (preformatted). Si quieres renderizar HTML,
 * puedes cambiar a dangerouslySetInnerHTML en el bloque de visualización.
 */
export default function RecalculationGuide({ guideKey = 'GUIDE', title = 'Guía', content = '', isAdmin = false, onSave = null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(content || '');
  }, [content]);

  const handleSave = async () => {
    if (!isAdmin) { alert('Solo administradores pueden editar.'); setEditing(false); return; }
    try {
      setSaving(true);
      if (typeof onSave === 'function') {
        await onSave(guideKey, draft);
      } else {
        // si no hay onSave, guardamos en localStorage como fallback (temporal)
        try {
          const existing = JSON.parse(localStorage.getItem('cmc_guides') || '{}');
          existing[guideKey] = draft;
          localStorage.setItem('cmc_guides', JSON.stringify(existing));
        } catch (e) { console.warn(e); }
      }
      setEditing(false);
    } catch (e) {
      console.error(e);
      alert('Error al guardar la guía.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Accordion defaultExpanded={false} sx={{ bgcolor: 'rgba(20,20,40,0.72)', color: 'white', mb: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#87fcd9' }} />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ color: '#87fcd9', fontWeight: 800 }}>{title}</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Consulta paso a paso</Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        {!editing ? (
          <Box>
            <Typography sx={{ whiteSpace: 'pre-line', color: 'rgba(255,255,255,0.92)' }}>
              {content || 'No hay guía disponible para esta incidencia.'}
            </Typography>

            {isAdmin && (
              <Box sx={{ mt: 1 }}>
                <Button variant="outlined" onClick={() => setEditing(true)} sx={{ color: '#87fcd9', borderColor: '#87fcd9' }}>
                  Editar
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <TextField
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              multiline
              minRows={8}
              fullWidth
              sx={{ bgcolor: 'rgba(255,255,255,0.02)', '& .MuiInputBase-input': { color: '#fff' } }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
              <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: '#87fcd9', color: '#0f1720' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="outlined" onClick={() => { setEditing(false); setDraft(content || ''); }} sx={{ color: '#87fcd9', borderColor: '#87fcd9' }}>
                Cancelar
              </Button>
            </Box>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}