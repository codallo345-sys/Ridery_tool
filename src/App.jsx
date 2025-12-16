// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Tabs, Tab } from '@mui/material';
import Sidebar from './components/Sidebar';
import ReportGenerator from './components/ReportGenerator';
import FirestoreDemo from './components/FirestoreDemo';
import { CMC_STRUCTURE } from './data/cmcData';
import BoltIcon from '@mui/icons-material/Bolt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StorageIcon from '@mui/icons-material/Storage';
import DescriptionIcon from '@mui/icons-material/Description';

const initialCategory = Object.keys(CMC_STRUCTURE)[0] || '';
const initialOptionName = initialCategory ? Object.keys(CMC_STRUCTURE[initialCategory].options)[0] : '';
const getOptionData = (opt, cat) => ({ name: opt, category: cat, ...(CMC_STRUCTURE[cat]?.options[opt] || {}) });

export default function App() {
  const [currentOption, setCurrentOption] = useState(getOptionData(initialOptionName, initialCategory));
  const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem('cmc_is_admin'));
  const [openAdminDialog, setOpenAdminDialog] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem('cmc_is_admin'));
  }, []);

  const handleOpenAdmin = () => setOpenAdminDialog(true);
  const handleCloseAdmin = () => { setAdminPin(''); setOpenAdminDialog(false); };

  const handleAdminLogin = () => {
    const ADMIN_PIN = (import.meta.env?.VITE_CMC_ADMIN_PIN) || 'admin123';
    if (String(adminPin) === String(ADMIN_PIN)) {
      localStorage.setItem('cmc_is_admin', '1');
      setIsAdmin(true);
      handleCloseAdmin();
      alert('Modo administrador activado.');
    } else {
      alert('Passphrase incorrecta.');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar onSelectOption={(opt, cat) => setCurrentOption(getOptionData(opt, cat))} />

      <Box component="main" sx={{ flexGrow: 1, p: 4, ml: { md: '280px' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'white', mb: 0.5 }}>
              Ridery <span style={{ color: '#87fcd9' }}>Tools</span>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<BoltIcon style={{ color: '#3536ba' }} />}
              label="ACTIVO"
              sx={{ bgcolor: '#87fcd9', color: '#3536ba', fontWeight: 900, px: 1 }}
            />

            <Chip
              icon={<AdminPanelSettingsIcon style={{ color: '#fff' }} />}
              label={isAdmin ? 'ADMIN' : 'ADMIN (OFF)'}
              onClick={handleOpenAdmin}
              sx={{ cursor: 'pointer', bgcolor: isAdmin ? '#ffb300' : 'rgba(255,255,255,0.06)', color: isAdmin ? '#0f1720' : '#fff', fontWeight: 800 }}
            />
          </Box>
        </Box>

        {/* Tabs for switching between Reports and Firestore */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)', fontWeight: 600 },
              '& .Mui-selected': { color: '#87fcd9' },
              '& .MuiTabs-indicator': { backgroundColor: '#87fcd9' }
            }}
          >
            <Tab icon={<DescriptionIcon />} label="Reports" iconPosition="start" />
            <Tab icon={<StorageIcon />} label="Firestore Database" iconPosition="start" />
          </Tabs>
        </Box>

        {activeTab === 0 && <ReportGenerator currentOption={currentOption} />}
        {activeTab === 1 && <FirestoreDemo />}
      </Box>

      <Dialog open={openAdminDialog} onClose={handleCloseAdmin}>
        <DialogTitle>Acceder como Admin</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>Introduce la passphrase de administrador para desbloquear edición.</Typography>
          <TextField autoFocus value={adminPin} onChange={(e) => setAdminPin(e.target.value)} label="Passphrase" fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdmin}>Cancelar</Button>
          <Button variant="contained" onClick={handleAdminLogin}>Desbloquear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}