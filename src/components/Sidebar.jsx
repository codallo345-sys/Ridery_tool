// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { Drawer, List, ListItemButton, ListItemText, Box, Typography, Collapse, Divider, IconButton } from '@mui/material';
import { CMC_STRUCTURE } from '../data/cmcData';
import { motion } from 'framer-motion';
import CircleIcon from '@mui/icons-material/Circle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const drawerWidth = 280;

export default function Sidebar({ onSelectOption, isAdmin }) {
  // Estado para solucionar el bug de selección doble (usamos Categoría y Opción)
  const [activeSelection, setActiveSelection] = useState({
    category: "CONDUCTOR",
    option: "CAMBIO DE MONTO CASH (CMC)"
  });

  // control de desplegables por categoría: inicio cerrados
  const [openCategories, setOpenCategories] = useState(() => {
    const initial = {};
    Object.keys(CMC_STRUCTURE).forEach(k => { initial[k] = false; });
    return initial;
  });

  const handleListItemClick = (optionName, category) => {
    setActiveSelection({ category, option: optionName });
    onSelectOption(optionName, category);
  };

  const toggleCategory = (category) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            background: 'transparent'
        },
      }}
    >
      <Box sx={{
          m: 2,
          height: '95vh',
          borderRadius: '24px',
          background: 'rgba(53, 54, 186, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(135, 252, 217, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          overflowY: 'auto',
          '::-webkit-scrollbar': { display: 'none' }
      }}>

        {/* LOGO AREA */}
        <Box sx={{ p: 4, pb: 2, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '1px', color: 'white', fontStyle: 'italic' }}>
                RIDERY
            </Typography>
            <Typography variant="caption" sx={{ color: '#87fcd9', letterSpacing: '2px', fontWeight: 'bold' }}>
                VENEZUELA
            </Typography>
        </Box>

        {/* Incidencias header */}
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="caption" sx={{ color: '#87fcd9', fontWeight: 900, letterSpacing: '1px' }}>INCIDENCIAS</Typography>
        </Box>

        {/* LISTA DE NAVEGACIÓN */}
        <Box sx={{ py: 1 }}>
          {Object.entries(CMC_STRUCTURE).map(([category, data]) => {
            // Hide CATEGORIAS section if not admin
            if (category === 'CATEGORIAS' && !isAdmin) {
              return null;
            }
            
            return (
            <Box key={category} sx={{ mb: 1 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, cursor: 'pointer' }}
                onClick={() => toggleCategory(category)} // clicking anywhere on the line toggles
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                      width: '4px', height: '15px',
                      bgcolor: category === 'CONDUCTOR' ? '#fff' : '#87fcd9',
                      mr: 1, borderRadius: '2px'
                  }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'white',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      opacity: 0.9,
                    }}
                  >
                    {category}
                  </Typography>
                </Box>

                <IconButton size="small" onClick={() => toggleCategory(category)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {openCategories[category] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>

              <Collapse in={openCategories[category]} timeout="auto" unmountOnExit>
                <List sx={{ px: 1 }}>
                  {Object.entries(data.options).map(([optionName]) => {
                      const isSelected = activeSelection.option === optionName && activeSelection.category === category;

                      return (
                      <ListItemButton
                          key={optionName}
                          selected={isSelected}
                          onClick={() => handleListItemClick(optionName, category)}
                          component={motion.div}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          sx={{
                            mx: 1, mb: 0.5, borderRadius: '12px',
                            transition: 'all 0.2s ease',
                            background: isSelected ? 'rgba(135, 252, 217, 0.2)' : 'transparent',
                            border: isSelected ? '1px solid #87fcd9' : '1px solid transparent',
                            '&:hover': { background: 'rgba(255,255,255,0.1)' }
                          }}
                      >
                          <CircleIcon
                              sx={{
                                  fontSize: 8,
                                  mr: 2,
                                  color: isSelected ? '#87fcd9' : 'rgba(255,255,255,0.3)',
                                  filter: isSelected ? 'drop-shadow(0 0 5px #87fcd9)' : 'none'
                              }}
                          />

                          <ListItemText
                              primary={optionName}
                              primaryTypographyProps={{
                                  fontSize: '0.8rem',
                                  fontWeight: isSelected ? 700 : 400,
                                  color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)',
                                  letterSpacing: '0.5px'
                              }}
                          />
                      </ListItemButton>
                      );
                  })}
                </List>
              </Collapse>

              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.03)', my: 1 }} />
            </Box>
            );
          })}
        </Box>
      </Box>
    </Drawer>
  );
}