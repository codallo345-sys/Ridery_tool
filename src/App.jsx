// src/App.jsx
import React, { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import Sidebar from './components/Sidebar';
import ReportGenerator from './components/ReportGenerator';
import { CMC_STRUCTURE } from './data/cmcData';
import BoltIcon from '@mui/icons-material/Bolt';

const initialCategory = Object.keys(CMC_STRUCTURE)[0];
const initialOptionName = Object.keys(CMC_STRUCTURE[initialCategory].options)[0];
const getOptionData = (opt, cat) => ({ name: opt, category: cat, ...CMC_STRUCTURE[cat].options[opt] });

export default function App() {
  const [currentOption, setCurrentOption] = useState(getOptionData(initialOptionName, initialCategory));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* SIDEBAR */}
      <Sidebar onSelectOption={(opt, cat) => setCurrentOption(getOptionData(opt, cat))} />

      {/* CONTENIDO PRINCIPAL */}
      <Box component="main" sx={{ flexGrow: 1, p: 4, ml: { md: '280px' } }}>
        
        {/* HEADER LIMPIO */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5, pb: 2, borderBottom: '2px solid #87fcd9' }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'white', mb: 0.5 }}>
              Ridery <span style={{ color: '#87fcd9' }}>Tools</span>
            </Typography>
          </Box>
          
          <Chip 
            icon={<BoltIcon style={{ color: '#3536ba' }} />} 
            label="ACTIVO" 
            sx={{ 
                bgcolor: '#87fcd9', color: '#3536ba', fontWeight: 900, px: 1 
            }} 
          />
        </Box>

        {/* GENERADOR */}
        <ReportGenerator currentOption={currentOption} />
      </Box>
    </Box>
  );
}