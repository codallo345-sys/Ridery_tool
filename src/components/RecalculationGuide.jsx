import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * RecalculationGuide
 * - Muestra la guía de recálculo en un Accordion estilizado.
 * - Props:
 *    - guideHtml: (string) HTML seguro con el contenido de la guía. Si se pasa vacío
 *                 se muestra un placeholder y botón Editar (onEdit).
 *    - images: optional array of { src, alt, width } para mostrar ilustraciones.
 *    - onEdit: callback para editar la guía (opcional).
 */
export default function RecalculationGuide({ guideHtml = '', images = [], onEdit = null }) {
  return (
    <Accordion defaultExpanded={false} sx={{
      bgcolor: 'rgba(20,20,40,0.72)',
      color: 'rgba(255,255,255,0.95)',
      border: '1px solid rgba(135,252,217,0.08)',
      borderRadius: 2,
      mb: 2
    }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#87fcd9' }} />} aria-controls="rec-guide-content" id="rec-guide-header" sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ color: '#87fcd9', fontWeight: 800, letterSpacing: 0.2 }}>Guía de recálculo</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Consulta paso a paso</Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, pb: 2 }}>
        {guideHtml ? (
          <Box sx={{
            '& h2': { color: '#eaf6ff', fontWeight: 800, mb: 1 },
            '& h3': { color: '#eaf6ff', fontWeight: 700 },
            '& p': { color: 'rgba(255,255,255,0.92)', lineHeight: 1.45, mb: 1 },
            '& ul': { color: 'rgba(255,255,255,0.92)', paddingLeft: 18 },
            '& li': { marginBottom: 8 }
          }}>
            <Box dangerouslySetInnerHTML={{ __html: guideHtml }} />
            {images.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {images.map((im, i) => (
                  <Box key={i} component="img" src={im.src} alt={im.alt || `img-${i}`} sx={{ width: im.width || 180, borderRadius: 1, border: '1px solid rgba(255,255,255,0.04)' }} />
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
            <Typography sx={{ mb: 1 }}>Pega aquí la guía de recálculo (texto o HTML). Si quieres imágenes, súbelas y las insertamos.</Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)' }}>Sugerencia: pega texto plano o HTML simple. Evita scripts.</Typography>
            {onEdit && <Button size="small" variant="outlined" onClick={onEdit} sx={{ mt: 1 }}>Editar guía</Button>}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}