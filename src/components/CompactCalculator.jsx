import React, { useMemo, useState, useEffect } from 'react';
import { Paper, Box, TextField, Typography, Divider, FormControlLabel, Checkbox } from '@mui/material';

/**
 * CompactCalculator (actualizado)
 * - Corrección lógica: "Aplica" cuando |CALCULO| >= 1 (valor absoluto mayor o igual a 1).
 * - Inputs en variant="outlined" para evitar labels/títulos que tapen entradas.
 * - Ajustes visuales para que entradas y subtítulos sean claramente visibles.
 *
 * Props: mode, values, onChange
 */
export default function CompactCalculator({ mode = 'cash', values = {}, onChange = () => {} }) {
  const incoming = {
    amountAdmin: Number(values.amountAdmin ?? 0),
    cashGiven: Number(values.cashGiven ?? 0),
    amountReal: Number(values.amountReal ?? 0),
    surgeAdmin: Number(values.surgeAdmin ?? 1),
    surgeReal: Number(values.surgeReal ?? 1),
    surgeType: values.surgeType ?? 'none',
    cashGivenAdmin: Number(values.cashGivenAdmin ?? 0),
    realCashGiven: Number(values.realCashGiven ?? 0)
  };

  const [amountStr, setAmountStr] = useState(incoming.amountAdmin === 0 ? '' : String(incoming.amountAdmin));
  const [cashStr, setCashStr] = useState(incoming.cashGiven === 0 ? '' : String(incoming.cashGiven));
  const [amountRealStr, setAmountRealStr] = useState(incoming.amountReal === 0 ? '' : String(incoming.amountReal));
  const [surgeAdminStr, setSurgeAdminStr] = useState(incoming.surgeAdmin === 1 ? '' : String(incoming.surgeAdmin));
  const [surgeRealStr, setSurgeRealStr] = useState(incoming.surgeReal === 1 ? '' : String(incoming.surgeReal));
  const [cashGivenAdminStr, setCashGivenAdminStr] = useState(incoming.cashGivenAdmin === 0 ? '' : String(incoming.cashGivenAdmin));
  const [realCashGivenStr, setRealCashGivenStr] = useState(incoming.realCashGiven === 0 ? '' : String(incoming.realCashGiven));

  const [surgeAdminEnabled, setSurgeAdminEnabled] = useState(incoming.surgeType === 'admin' || incoming.surgeType === 'both');
  const [surgeDispatchEnabled, setSurgeDispatchEnabled] = useState(incoming.surgeType === 'dispatch' || incoming.surgeType === 'both');

  useEffect(() => setAmountStr(incoming.amountAdmin === 0 ? '' : String(incoming.amountAdmin)), [incoming.amountAdmin]);
  useEffect(() => setCashStr(incoming.cashGiven === 0 ? '' : String(incoming.cashGiven)), [incoming.cashGiven]);
  useEffect(() => setAmountRealStr(incoming.amountReal === 0 ? '' : String(incoming.amountReal)), [incoming.amountReal]);
  useEffect(() => setSurgeAdminStr(incoming.surgeAdmin === 1 ? '' : String(incoming.surgeAdmin)), [incoming.surgeAdmin]);
  useEffect(() => setSurgeRealStr(incoming.surgeReal === 1 ? '' : String(incoming.surgeReal)), [incoming.surgeReal]);
  useEffect(() => setCashGivenAdminStr(incoming.cashGivenAdmin === 0 ? '' : String(incoming.cashGivenAdmin)), [incoming.cashGivenAdmin]);
  useEffect(() => setRealCashGivenStr(incoming.realCashGiven === 0 ? '' : String(incoming.realCashGiven)), [incoming.realCashGiven]);
  useEffect(() => {
    setSurgeAdminEnabled(incoming.surgeType === 'admin' || incoming.surgeType === 'both');
    setSurgeDispatchEnabled(incoming.surgeType === 'dispatch' || incoming.surgeType === 'both');
  }, [incoming.surgeType]);

  const parseNumber = (s, fallback = 0) => {
    if (s === '' || s === null || s === undefined) return fallback;
    const n = Number(String(s).replace(',', '.'));
    return Number.isFinite(n) ? n : fallback;
  };

  const amount = parseNumber(amountStr);
  const cashGiven = parseNumber(cashStr);
  const amountReal = parseNumber(amountRealStr);
  const surgeAdmin = parseNumber(surgeAdminStr) || 1;
  const surgeReal = parseNumber(surgeRealStr) || 1;
  const cashGivenAdmin = parseNumber(cashGivenAdminStr);
  const realCashGiven = parseNumber(realCashGivenStr);

  const fmt = useMemo(() => new Intl.NumberFormat('es-VE', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2
  }), []);

  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  // common calculations
  const IGTF = round2(amount * 0.03);
  const COMISION_RIDERY = round2(amount * 0.29);
  const GANANCIA_PROVIDER = round2(amount * 0.71);
  const REAL_AMOUNT = round2(amount - amount * 0.03);
  const MONTO_INCIDENCIA_CONDUCTOR = round2(GANANCIA_PROVIDER - cashGiven);
  const ABONAR_AL_CLIENTE = round2(cashGiven - amount);

  // recalculo adjusted amount based on checkboxes
  let AMOUNT_REAL_AJUSTADO = 0;
  if (mode === 'recalculo') {
    if (surgeAdminEnabled && !surgeDispatchEnabled) {
      AMOUNT_REAL_AJUSTADO = round2(amountReal * surgeAdmin);
    } else if (!surgeAdminEnabled && surgeDispatchEnabled) {
      AMOUNT_REAL_AJUSTADO = round2(amountReal / (surgeReal === 0 ? 1 : surgeReal));
    } else if (surgeAdminEnabled && surgeDispatchEnabled) {
      AMOUNT_REAL_AJUSTADO = round2((amountReal / (surgeReal === 0 ? 1 : surgeReal)) * surgeAdmin);
    } else {
      AMOUNT_REAL_AJUSTADO = round2(amountReal);
    }
  }

  const REC_COMISION_RIDERY = round2(amount * 0.29);
  const REC_GANANCIA_PROVIDER = round2(amount * 0.71);
  const MOVIMIENTO_CLIENTE = round2(amount - AMOUNT_REAL_AJUSTADO);
  const CALCULO = round2((AMOUNT_REAL_AJUSTADO - amount) * 0.71);
  const MOVIMIENTO_CONDUCTOR = CALCULO;

  const CAMBIO_MOVIMIENTO = round2(cashGivenAdmin - realCashGiven);
  const GANANCIA_CONDUCTOR = round2(amount * 0.71);
  const INCIDENCIA_CONDUCTOR = round2(cashGivenAdmin - GANANCIA_CONDUCTOR);

  const positiveStyle = { bg: 'rgba(105,240,174,0.10)', border: 'rgba(105,240,174,0.25)', color: '#06a24a' };
  const negativeStyle = { bg: 'rgba(255,55,117,0.10)', border: 'rgba(255,55,117,0.25)', color: '#ff2e6d' };
  const neutralStyle = { bg: 'transparent', border: '1px solid rgba(255,255,255,0.03)', color: 'white' };

  const colorForValue = (v) => (v > 0 ? positiveStyle : v < 0 ? negativeStyle : neutralStyle);

  // Output box: label in light-blue (#87fcd9), value in high-contrast '#e6faff'
  const OutputBox = ({ label, value, color = null, smallNote = null }) => (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      p: '8px 10px',
      borderRadius: 1,
      minWidth: 0,
      bgcolor: color?.bg ?? 'transparent',
      border: color?.border ? `1px solid ${color.border}` : '1px solid rgba(255,255,255,0.03)'
    }}>
      <Typography variant="caption" sx={{ color: '#87fcd9', lineHeight: 1, fontSize: '0.66rem' }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: '#e6faff', fontWeight: 800, lineHeight: 1, fontSize: '0.9rem' }}>{fmt.format(value)}</Typography>
      {smallNote && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.68rem', mt: 0.5 }}>{smallNote}</Typography>}
    </Box>
  );

  const notifyParent = (partial) => onChange(partial);

  // input handlers
  const onAmountChange = (e) => { const s = e.target.value; setAmountStr(s); notifyParent({ amountAdmin: parseNumber(s, 0) }); };
  const onCashChange = (e) => { const s = e.target.value; setCashStr(s); notifyParent({ cashGiven: parseNumber(s, 0) }); };
  const onAmountRealChange = (e) => { const s = e.target.value; setAmountRealStr(s); notifyParent({ amountReal: parseNumber(s, 0) }); };
  const onSurgeAdminValueChange = (e) => { const s = e.target.value; setSurgeAdminStr(s); notifyParent({ surgeAdmin: parseNumber(s, 1) }); };
  const onSurgeRealValueChange = (e) => { const s = e.target.value; setSurgeRealStr(s); notifyParent({ surgeReal: parseNumber(s, 1) }); };
  const onCashGivenAdminChange = (e) => { const s = e.target.value; setCashGivenAdminStr(s); notifyParent({ cashGivenAdmin: parseNumber(s, 0) }); };
  const onRealCashGivenChange = (e) => { const s = e.target.value; setRealCashGivenStr(s); notifyParent({ realCashGiven: parseNumber(s, 0) }); };

  const onAdminToggle = (e) => {
    const v = e.target.checked;
    setSurgeAdminEnabled(v);
    const newType = (v && surgeDispatchEnabled) ? 'both' : (v ? 'admin' : (surgeDispatchEnabled ? 'dispatch' : 'none'));
    notifyParent({ surgeType: newType });
  };

  const onDispatchToggle = (e) => {
    const v = e.target.checked;
    setSurgeDispatchEnabled(v);
    const newType = (v && surgeAdminEnabled) ? 'both' : (v ? 'dispatch' : (surgeAdminEnabled ? 'admin' : 'none'));
    notifyParent({ surgeType: newType });
  };

  const inputWidth = mode === 'recalculo' ? 120 : 140;
  const maxWidth = 560;

  // Aplica logic: ahora aplica si |CALCULO| >= 1
  const calcAplica = Math.abs(CALCULO) >= 1;

  return (
    <Paper elevation={0} sx={{ p: 1.25, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', maxWidth }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, pt: 1, pb: 0 }}>
        <Typography variant="subtitle1" sx={{ color: '#87fcd9', fontWeight: 900, fontSize: '0.95rem' }}>Calculadora</Typography>

        {mode === 'recalculo' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.76rem', mr: 0.5 }}>SURGE</Typography>
            <FormControlLabel control={<Checkbox checked={surgeAdminEnabled} onChange={onAdminToggle} sx={{ color: '#87fcd9' }} />} label={<Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem' }}>Admin</Typography>} />
            <FormControlLabel control={<Checkbox checked={surgeDispatchEnabled} onChange={onDispatchToggle} sx={{ color: '#87fcd9' }} />} label={<Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem' }}>Dispatch</Typography>} />
          </Box>
        )}
      </Box>

      {/* Inputs (outlined to avoid overlap) */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end', px: 1, pt: 0.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          variant="outlined"
          value={amountStr}
          onChange={onAmountChange}
          placeholder="0.00"
          label="AMOUNT ADMIN"
          type="text"
          margin="dense"
          InputLabelProps={{ shrink: true }}
          inputProps={{ inputMode: 'decimal', style: { fontSize: '0.86rem', padding: '8px 10px', lineHeight: '1', color: '#081823' } }}
          sx={{ bgcolor: 'rgba(255,255,255,0.02)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.04)' }, '& .MuiInputLabel-root': { color: 'rgba(135,252,217,0.9)', fontSize: '0.72rem' }, width: inputWidth, alignSelf: 'flex-end' }}
        />

        {mode === 'cash' && (
          <TextField
            size="small"
            variant="outlined"
            value={cashStr}
            onChange={onCashChange}
            placeholder="0.00"
            label="CASH GIVEN"
            type="text"
            margin="dense"
            InputLabelProps={{ shrink: true }}
            inputProps={{ inputMode: 'decimal', style: { fontSize: '0.86rem', padding: '8px 10px', lineHeight: '1', color: '#081823' } }}
            sx={{ bgcolor: 'rgba(255,255,255,0.02)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.04)' }, '& .MuiInputLabel-root': { color: 'rgba(135,252,217,0.9)', fontSize: '0.72rem' }, width: inputWidth, alignSelf: 'flex-end' }}
          />
        )}

        {mode === 'recalculo' && (
          <>
            <TextField
              size="small"
              variant="outlined"
              value={amountRealStr}
              onChange={onAmountRealChange}
              placeholder="0.00"
              label="AMOUNT REAL"
              type="text"
              margin="dense"
              InputLabelProps={{ shrink: true }}
              inputProps={{ inputMode: 'decimal', style: { fontSize: '0.86rem', padding: '8px 10px', lineHeight: '1', color: '#081823' } }}
              sx={{ bgcolor: 'rgba(255,255,255,0.02)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.04)' }, '& .MuiInputLabel-root': { color: 'rgba(135,252,217,0.9)', fontSize: '0.72rem' }, width: inputWidth, alignSelf: 'flex-end' }}
            />

            {surgeAdminEnabled && (<TextField size="small" variant="outlined" value={surgeAdminStr} onChange={onSurgeAdminValueChange} placeholder="1.00" label="Admin x" margin="dense" InputLabelProps={{ shrink: true }} inputProps={{ inputMode: 'decimal', style: { fontSize: '0.78rem', padding: '6px 8px', lineHeight: '1', color: '#081823' } }} sx={{ bgcolor: 'rgba(255,255,255,0.02)', width: 92, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.04)' } }} />)}
            {surgeDispatchEnabled && (<TextField size="small" variant="outlined" value={surgeRealStr} onChange={onSurgeRealValueChange} placeholder="1.00" label="Dispatch /" margin="dense" InputLabelProps={{ shrink: true }} inputProps={{ inputMode: 'decimal', style: { fontSize: '0.78rem', padding: '6px 8px', lineHeight: '1', color: '#081823' } }} sx={{ bgcolor: 'rgba(255,255,255,0.02)', width: 92, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.04)' } }} />)}
          </>
        )}

        {mode === 'cambio' && (
          <>
            <TextField size="small" variant="outlined" value={cashGivenAdminStr} onChange={onCashGivenAdminChange} placeholder="0.00" label="CASH GIVEN ADMIN" margin="dense" InputLabelProps={{ shrink: true }} inputProps={{ inputMode: 'decimal', style: { fontSize: '0.86rem', padding: '8px 10px', lineHeight: '1', color: '#081823' } }} sx={{ bgcolor: 'rgba(255,255,255,0.02)', width: inputWidth, alignSelf: 'flex-end', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.04)' } }} />
            <TextField size="small" variant="outlined" value={realCashGivenStr} onChange={onRealCashGivenChange} placeholder="0.00" label="REAL CASH GIVEN" margin="dense" InputLabelProps={{ shrink: true }} inputProps={{ inputMode: 'decimal', style: { fontSize: '0.86rem', padding: '8px 10px', lineHeight: '1', color: '#081823' } }} sx={{ bgcolor: 'rgba(255,255,255,0.02)', width: inputWidth, alignSelf: 'flex-end', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.04)' } }} />
          </>
        )}
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.04)', my: 0.5 }} />

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, px: 1, pb: 0.75 }}>
        {mode === 'cash' && (
          <>
            <OutputBox label="IGTF (3%)" value={IGTF} />
            <OutputBox label="Real Amount" value={REAL_AMOUNT} />
            <OutputBox label="Comisión Ridery (29%)" value={COMISION_RIDERY} />
            <OutputBox label="Ganancia Provider (71%)" value={GANANCIA_PROVIDER} />
            <OutputBox label="Monto Incidencia Conductor" value={MONTO_INCIDENCIA_CONDUCTOR} color={colorForValue(MONTO_INCIDENCIA_CONDUCTOR)} />
            <OutputBox label="Abonar al cliente" value={ABONAR_AL_CLIENTE} color={colorForValue(ABONAR_AL_CLIENTE)} />
          </>
        )}

        {mode === 'noncash' && (
          <>
            <OutputBox label="Ganancia Provider (71%)" value={GANANCIA_PROVIDER} />
            <OutputBox label="Comisión Ridery (29%)" value={COMISION_RIDERY} />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <OutputBox label="TOTAL" value={GANANCIA_PROVIDER} color={positiveStyle} />
            </Box>
          </>
        )}

        {mode === 'recalculo' && (
          <>
            <OutputBox label="COMISIÓN RIDERY" value={REC_COMISION_RIDERY} />
            <OutputBox label="GANANCIA PROVIDER" value={REC_GANANCIA_PROVIDER} />
            <OutputBox label="AMOUNT REAL AJUSTADO" value={AMOUNT_REAL_AJUSTADO} />
            <OutputBox label="CÁLCULO" value={CALCULO} color={colorForValue(CALCULO)} smallNote={calcAplica ? 'Aplica ✅' : 'No aplica ❌'} />
            <OutputBox label="Movimiento al cliente" value={MOVIMIENTO_CLIENTE} color={colorForValue(MOVIMIENTO_CLIENTE)} />
            <OutputBox label="Movimiento al conductor" value={MOVIMIENTO_CONDUCTOR} color={colorForValue(MOVIMIENTO_CONDUCTOR)} />
          </>
        )}

        {mode === 'cambio' && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <OutputBox label="Movimiento (CASH GIVEN ADMIN - REAL CASH GIVEN)" value={CAMBIO_MOVIMIENTO} color={colorForValue(CAMBIO_MOVIMIENTO)} />
          </Box>
        )}

        {mode === 'mvzero' && (
          <>
            <OutputBox label="Ganancia Conductor" value={GANANCIA_CONDUCTOR} />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <OutputBox label="Incidencia al conductor" value={INCIDENCIA_CONDUCTOR} color={colorForValue(INCIDENCIA_CONDUCTOR)} />
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}