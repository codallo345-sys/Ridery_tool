// src/components/CategoryPanel.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableBody, TableRow, TableCell, Grid
} from '@mui/material';

const CITIES = [
  'Caracas','Acarigua','Barcelona','Barinas','Barquisimeto','Cabimas','Charallave','Ciudad Bolívar','Ciudad Guayana',
  'Colonia Tovar','Coro','Cumaná','El Vigía','Guarenas','Guatire','Higuerote','La Guaira','La Victoria','Los Teques',
  'Maracaibo','Maracay','Margarita','Maturín','Porlamar','Puerto Cabello','Puerto La Cruz','San Antonio de Los Altos','San Cristóbal'
];

const CATEGORY_OPTIONS = [
  { key: 'todas', label: 'Todas' },
  { key: 'evaluacion', label: 'Evaluación' },
  { key: 'impulso', label: 'Impulso' },
  { key: 'ascenso', label: 'En Ascenso' },
  { key: 'destacado', label: 'Destacado' },
  { key: 'lider', label: 'Líder' }
];

const VEHICLE_OPTIONS = [
  { key: 'todos', label: 'Todos' },
  { key: 'carro', label: 'Carro' },
  { key: 'moto', label: 'Moto' }
];

const DEFAULT_METRICS = {
  eval_carro: 0, eval_moto: 0,
  impulso_carro: 0, impulso_moto: 0,
  ascenso_carro: 0, ascenso_moto: 0,
  destacado_carro: 0, destacado_moto: 0,
  lider_carro: 0, lider_moto: 0
};

const STORAGE_KEY = 'cmc_category_params';

export default function CategoryPanel({ currentOptionName = '', onSave = null }) {
  const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem('cmc_is_admin'));
  const [openUnlock, setOpenUnlock] = useState(false);
  const [pin, setPin] = useState('');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0,7);
  });
  const [city, setCity] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todas');

  const [paramsMap, setParamsMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editingValues, setEditingValues] = useState({ ...DEFAULT_METRICS });

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem('cmc_is_admin'));
  }, []);

  const handleOpenUnlock = () => setOpenUnlock(true);
  const handleCloseUnlock = () => { setPin(''); setOpenUnlock(false); };
  const handleUnlock = () => {
    const ADMIN_PIN = (import.meta.env?.VITE_CMC_ADMIN_PIN) || 'admin123';
    if (String(pin) === String(ADMIN_PIN)) {
      localStorage.setItem('cmc_is_admin', '1');
      setIsAdmin(true);
      handleCloseUnlock();
      alert('Modo administrador activado.');
    } else {
      alert('Passphrase incorrecta.');
    }
  };

  // current params lookup
  const currentParams = useMemo(() => {
    return (paramsMap[month] && paramsMap[month][city]) ? paramsMap[month][city] : { ...DEFAULT_METRICS };
  }, [paramsMap, month, city]);

  const handleEditOpen = () => {
    if (!isAdmin) { alert('Solo administradores pueden editar parámetros.'); return; }
    setEditingValues({ ...currentParams });
    setEditOpen(true);
  };
  const handleEditClose = () => setEditOpen(false);

  const handleEditSave = () => {
    const copy = { ...paramsMap };
    if (!copy[month]) copy[month] = {};
    copy[month][city] = { ...editingValues };
    setParamsMap(copy);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(copy)); } catch (e) { console.warn(e); }
    setEditOpen(false);
    if (typeof onSave === 'function') onSave(month, city, editingValues);
  };

  const mapLabel = (k) => {
    const labels = {
      eval_carro: 'EVAL. CARRO', eval_moto: 'EVAL. MOTO',
      impulso_carro: 'IMPULSO CARRO', impulso_moto: 'IMPULSO MOTO',
      ascenso_carro: 'ASCENSO CARRO', ascenso_moto: 'ASCENSO MOTO',
      destacado_carro: 'DESTACADO CARRO', destacado_moto: 'DESTACADO MOTO',
      lider_carro: 'LÍDER CARRO', lider_moto: 'LÍDER MOTO'
    };
    return labels[k] || k;
  };

  const renderTableHead = () => {
    const cols = [{ key: 'ciudad', label: 'CIUDAD' }];
    if (categoryFilter === 'todas') {
      if (vehicleFilter === 'todos' || vehicleFilter === 'carro') cols.push({ key: 'eval_carro', label: 'EVAL. CARRO' });
      if (vehicleFilter === 'todos' || vehicleFilter === 'moto') cols.push({ key: 'eval_moto', label: 'EVAL. MOTO' });
      if (vehicleFilter === 'todos' || vehicleFilter === 'carro') cols.push({ key: 'impulso_carro', label: 'IMPULSO CARRO' });
      if (vehicleFilter === 'todos' || vehicleFilter === 'moto') cols.push({ key: 'impulso_moto', label: 'IMPULSO MOTO' });
      if (vehicleFilter === 'todos' || vehicleFilter === 'carro') cols.push({ key: 'ascenso_carro', label: 'ASCENSO CARRO' });
      if (vehicleFilter === 'todos' || vehicleFilter === 'moto') cols.push({ key: 'ascenso_moto', label: 'ASCENSO MOTO' });
      if (vehicleFilter === 'todos' || vehicleFilter === 'carro') cols.push({ key: 'destacado_carro', label: 'DESTACADO CARRO' });
      if (vehicleFilter === 'todos' || vehicleFilter === 'moto') cols.push({ key: 'destacado_moto', label: 'DESTACADO MOTO' });
      if (vehicleFilter === 'todos' || vehicleFilter === 'carro') cols.push({ key: 'lider_carro', label: 'LÍDER CARRO' });
      if (vehicleFilter === 'todos' || vehicleFilter === 'moto') cols.push({ key: 'lider_moto', label: 'LÍDER MOTO' });
    } else {
      const map = {
        evaluacion: ['eval_carro','eval_moto'],
        impulso: ['impulso_carro','impulso_moto'],
        ascenso: ['ascenso_carro','ascenso_moto'],
        destacado: ['destacado_carro','destacado_moto'],
        lider: ['lider_carro','lider_moto']
      };
      const keys = map[categoryFilter] || [];
      if (vehicleFilter === 'todos') keys.forEach(k => cols.push({ key: k, label: mapLabel(k) }));
      else if (vehicleFilter === 'carro') cols.push({ key: keys[0], label: mapLabel(keys[0]) });
      else if (vehicleFilter === 'moto') cols.push({ key: keys[1], label: mapLabel(keys[1]) });
    }
    return cols;
  };

  const rows = CITIES.map(c => {
    const v = (paramsMap[month] && paramsMap[month][c]) ? paramsMap[month][c] : { ...DEFAULT_METRICS };
    return { ciudad: c, ...v };
  });

  // Condition: require vehicle != 'todos' && category != 'todas' && city selected to "calculate" (show table)
  const readyToCalculate = vehicleFilter !== 'todos' && categoryFilter !== 'todas' && !!city;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ color: '#87fcd9', fontWeight: 900 }}>{currentOptionName || 'Parámetros de categoría'}</Typography>

      {/* Message & legend - always visible above filters */}
      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <span role="img" aria-label="chart">📊</span> Datos Detallados
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1, mb: 1 }}>
          Debes filtrar por tu geolocalización actual, es decir, la ciudad en dónde te encuentras.
        </Typography>

        <Typography sx={{ fontWeight: 700, mt: 1 }}>📋 Leyenda de Categorías</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
          <Typography variant="body2" sx={{ color: '#2ecc71' }}><strong>EVAL.</strong> = Evaluación</Typography>
          <Typography variant="body2" sx={{ color: '#2196f3' }}>En Ascenso = En Ascenso</Typography>
          <Typography variant="body2" sx={{ color: '#ff9800' }}>Destacado = Destacado</Typography>
          <Typography variant="body2" sx={{ color: '#4caf50' }}>Líder = Líder</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Vehículo</InputLabel>
              <Select value={vehicleFilter} label="Vehículo" onChange={(e) => setVehicleFilter(e.target.value)}>
                {VEHICLE_OPTIONS.map(o => <MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select value={categoryFilter} label="Categoría" onChange={(e) => setCategoryFilter(e.target.value)}>
                {CATEGORY_OPTIONS.map(o => <MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField label="Mes" type="month" fullWidth value={month} onChange={(e) => setMonth(e.target.value)} />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Ciudad</InputLabel>
              <Select value={city} label="Ciudad" onChange={(e) => setCity(e.target.value)}>
                <MenuItem value=""><em>Todas</em></MenuItem>
                {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          {!isAdmin ? (
            <Button variant="outlined" onClick={handleOpenUnlock} sx={{ color: '#87fcd9', borderColor: '#87fcd9' }}>Desbloquear edición (Admin)</Button>
          ) : (
            <Button variant="contained" onClick={handleEditOpen} sx={{ bgcolor: '#87fcd9', color: '#1a1a2e' }}>Editar parámetros (admin)</Button>
          )}

          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Filtra por vehículo, categoría y ciudad para ver datos detallados.
          </Typography>
        </Box>

        {/* If not ready, show instruction area and do not render the table */}
        {!readyToCalculate ? (
          <Paper sx={{ p: 4, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#87fcd9', mb: 1 }}>Filtra para ver datos</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Selecciona Vehículo, Categoría y Ciudad para ver los parámetros detallados de la categoría seleccionada.
            </Typography>
          </Paper>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {renderTableHead().map(h => <TableCell key={h.key} sx={{ fontWeight: 800 }}>{h.label}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.ciudad}>
                  {renderTableHead().map(h => (
                    <TableCell key={h.key} sx={{ whiteSpace: 'nowrap' }}>
                      {h.key === 'ciudad' ? r.ciudad : (typeof r[h.key] === 'number' ? r[h.key] : (r[h.key] ?? 0))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={openUnlock} onClose={handleCloseUnlock}>
        <DialogTitle>Desbloquear edición (Admin)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>Introduce la passphrase de administrador para habilitar edición.</Typography>
          <TextField value={pin} onChange={(e) => setPin(e.target.value)} label="Passphrase" fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUnlock}>Cancelar</Button>
          <Button onClick={handleUnlock} variant="contained">Desbloquear</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Editar parámetros — {city || '—'} • {month}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {Object.keys(DEFAULT_METRICS).map((k) => (
              <Grid item xs={12} md={6} key={k}>
                <TextField
                  label={mapLabel(k)}
                  fullWidth
                  type="number"
                  value={editingValues[k] ?? 0}
                  onChange={(e) => setEditingValues(prev => ({ ...prev, [k]: Number(e.target.value) }))}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}