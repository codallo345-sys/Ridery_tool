import React, { useMemo, useState, useEffect } from 'react';
import { Paper, Box, TextField, Typography, Divider, Select, MenuItem, FormControl } from '@mui/material';

/**
 * Calculadora
 *
 * Modes:
 *  - 'cash'     : VIAJE REALIZADO CASH (inputs: amountAdmin, cashGiven)
 *  - 'noncash'  : VIAJE REALIZADO / VIAJE YUNO (inputs: amountAdmin)
 *  - 'recalculo': RECÁLCULO (inputs: amountAdmin, amountReal, surgeAdmin, surgeReal, surgeType)
 *  - 'cambio'   : CAMBIO DE MONTO CASH (inputs: amountAdmin, cashGivenAdmin, realCashGiven)
 *  - 'mvzero'   : MOVIMIENTO CERO (inputs: amountAdmin, cashGivenAdmin, realCashGiven)
 *
 * Behavior:
 *  - Inputs show empty instead of '0' so first typed digit replaces it.
 *  - Removed the small caption that showed mode text.
 *  - Max 2 columns for outputs.
 *  - Dynamic colors: positive green, negative red, zero neutral.
 *  - In recalculo: if Movimiento al cliente > 1 => "Aplica ✅", else "No aplica ❌".
 *  - Inputs and numeric displays are slightly smaller to avoid overlap.
 *
 * onChange receives partial object with numeric values and surgeType when changed.
 */
export default function CompactCalculator({ mode = 'cash', values = {}, onChange = () => {} }) {
  // incoming numeric values (fallbacks)
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

  // local string states so initial 0 appears as '' and typing replaces it
  const [amountStr, setAmountStr] = useState(incoming.amountAdmin === 0 ? '' : String(incoming.amountAdmin));
  const [cashStr, setCashStr] = useState(incoming.cashGiven === 0 ? '' : String(incoming.cashGiven));
  const [amountRealStr, setAmountRealStr] = useState(incoming.amountReal === 0 ? '' : String(incoming.amountReal));
  const [surgeAdminStr, setSurgeAdminStr] = useState(incoming.surgeAdmin === 1 ? '' : String(incoming.surgeAdmin));
  const [surgeRealStr, setSurgeRealStr] = useState(incoming.surgeReal === 1 ? '' : String(incoming.surgeReal));
  const [surgeType, setSurgeType] = useState(incoming.surgeType);
  const [cashGivenAdminStr, setCashGivenAdminStr] = useState(incoming.cashGivenAdmin === 0 ? '' : String(incoming.cashGivenAdmin));
  const [realCashGivenStr, setRealCashGivenStr] = useState(incoming.realCashGiven === 0 ? '' : String(incoming.realCashGiven));

  // sync when parent resets values
  useEffect(() => setAmountStr(incoming.amountAdmin === 0 ? '' : String(incoming.amountAdmin)), [incoming.amountAdmin]);
  useEffect(() => setCashStr(incoming.cashGiven === 0 ? '' : String(incoming.cashGiven)), [incoming.cashGiven]);
  useEffect(() => setAmountRealStr(incoming.amountReal === 0 ? '' : String(incoming.amountReal)), [incoming.amountReal]);
  useEffect(() => setSurgeAdminStr(incoming.surgeAdmin === 1 ? '' : String(incoming.surgeAdmin)), [incoming.surgeAdmin]);
  useEffect(() => setSurgeRealStr(incoming.surgeReal === 1 ? '' : String(incoming.surgeReal)), [incoming.surgeReal]);
  useEffect(() => setSurgeType(incoming.surgeType), [incoming.surgeType]);
  useEffect(() => setCashGivenAdminStr(incoming.cashGivenAdmin === 0 ? '' : String(incoming.cashGivenAdmin)), [incoming.cashGivenAdmin]);
  useEffect(() => setRealCashGivenStr(incoming.realCashGiven === 0 ? '' : String(incoming.realCashGiven)), [incoming.realCashGiven]);

  const parseNumber = (s, fallback = 0) => {
    if (s === '' || s === null || s === undefined) return fallback;
    const n = Number(String(s).replace(',', '.'));
    return Number.isFinite(n) ? n : fallback;
  };

  // numeric values derived from local strings
  const amount = parseNumber(amountStr, 0);
  const cashGiven = parseNumber(cashStr, 0);
  const amountReal = parseNumber(amountRealStr, 0);
  const surgeAdmin = parseNumber(surgeAdminStr, 1);
  const surgeReal = parseNumber(surgeRealStr, 1);
  const cashGivenAdmin = parseNumber(cashGivenAdminStr, 0);
  const realCashGiven = parseNumber(realCashGivenStr, 0);

  // formatter
  const fmt = useMemo(() => new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), []);

  // rounding helper
  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  // Standard calculations
  const IGTF = round2(amount * 0.03);
  const COMISION_RIDERY = round2(amount * 0.29);
  const GANANCIA_PROVIDER = round2(amount * 0.71);
  const REAL_AMOUNT = round2(amount - amount * 0.03);
  const MONTO_INCIDENCIA_CONDUCTOR = round2(GANANCIA_PROVIDER - cashGiven);
  const ABONAR_AL_CLIENTE = round2(cashGiven - amount);

  // RECÁLCULO calculations (surge logic: divide by surgeReal then multiply by surgeAdmin when both)
  let AMOUNT_REAL_AJUSTADO = 0;
  if (mode === 'recalculo') {
    if (surgeType === 'admin') {
      AMOUNT_REAL_AJUSTADO = round2(amountReal * surgeAdmin);
    } else if (surgeType === 'dispatch') {
      AMOUNT_REAL_AJUSTADO = round2(amountReal / (surgeReal === 0 ? 1 : surgeReal));
    } else if (surgeType === 'both') {
      AMOUNT_REAL_AJUSTADO = round2((amountReal / (surgeReal === 0 ? 1 : surgeReal)) * surgeAdmin);
    } else {
      AMOUNT_REAL_AJUSTADO = round2(amountReal);
    }
  }

  const REC_COMISION_RIDERY = round2(amount * 0.29); // fixed on amountAdmin
  const REC_GANANCIA_PROVIDER = round2(amount * 0.71); // fixed on amountAdmin
  const MOVIMIENTO_CLIENTE = round2(amount - AMOUNT_REAL_AJUSTADO);
  const CALCULO = round2((AMOUNT_REAL_AJUSTADO - amount) * 0.71);
  const MOVIMIENTO_CONDUCTOR = CALCULO;

  // CAMBIO DE MONTO CASH calculation (simple difference)
  const CAMBIO_MOVIMIENTO = round2(cashGivenAdmin - realCashGiven);

  // MOVIMIENTO CERO calculations
  const GANANCIA_CONDUCTOR = round2(amount * 0.71);
  const INCIDENCIA_CONDUCTOR = round2(cashGivenAdmin - GANANCIA_CONDUCTOR);

  // color helpers
  const positiveStyle = { bg: 'rgba(105,240,174,0.10)', border: 'rgba(105,240,174,0.25)', color: '#06a24a' };
  const negativeStyle = { bg: 'rgba(255,55,117,0.10)', border: 'rgba(255,55,117,0.25)', color: '#ff2e6d' };
  const neutralStyle = { bg: 'transparent', border: '1px solid rgba(255,255,255,0.03)', color: 'white' };

  const colorForValue = (v) => {
    if (v > 0) return positiveStyle;
    if (v < 0) return negativeStyle;
    return neutralStyle;
  };

  // compact output cell
  const OutputBox = ({ label, value, color = null, smallNote = null }) => (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      p: '6px 8px',
      borderRadius: 1,
      minWidth: 0,
      bgcolor: color?.bg ?? 'transparent',
      border: color?.border ? `1px solid ${color.border}` : '1px solid rgba(255,255,255,0.03)'
    }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1, fontSize: '0.62rem' }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: color?.color ?? 'white', fontWeight: 700, lineHeight: 1, fontSize: '0.76rem' }}>{fmt.format(value)}</Typography>
      {smallNote && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem' }}>{smallNote}</Typography>}
    </Box>
  );

  // handlers: update local strings and notify parent with numeric partials
  const onAmountChange = (e) => {
    const s = e.target.value;
    setAmountStr(s);
    onChange({ amountAdmin: parseNumber(s, 0) });
  };
  const onCashChange = (e) => {
    const s = e.target.value;
    setCashStr(s);
    onChange({ cashGiven: parseNumber(s, 0) });
  };
  const onAmountRealChange = (e) => {
    const s = e.target.value;
    setAmountRealStr(s);
    onChange({ amountReal: parseNumber(s, 0) });
  };
  const onSurgeAdminChange = (e) => {
    const s = e.target.value;
    setSurgeAdminStr(s);
    onChange({ surgeAdmin: parseNumber(s, 1) });
  };
  const onSurgeRealChange = (e) => {
    const s = e.target.value;
    setSurgeRealStr(s);
    onChange({ surgeReal: parseNumber(s, 1) });
  };
  const onSurgeTypeChange = (e) => {
    const v = e.target.value;
    setSurgeType(v);
    onChange({ surgeType: v });
  };
  const onCashGivenAdminChange = (e) => {
    const s = e.target.value;
    setCashGivenAdminStr(s);
    onChange({ cashGivenAdmin: parseNumber(s, 0) });
  };
  const onRealCashGivenChange = (e) => {
    const s = e.target.value;
    setRealCashGivenStr(s);
    onChange({ realCashGiven: parseNumber(s, 0) });
  };

  // layout limits: two columns max, allow wider container
  const inputWidth = mode === 'recalculo' ? 98 : 120;
  const maxWidth = 420;

  return (
    <Paper elevation={0} sx={{ p: 0.5, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', maxWidth }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, pt: 0.5, pb: 0 }}>
        <Typography variant="subtitle2" sx={{ color: '#87fcd9', fontWeight: 800, fontSize: '0.78rem' }}>Calculadora</Typography>
      </Box>

      {/* Inputs row(s) */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', px: 1, pt: 0.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          variant="filled"
          value={amountStr}
          onChange={onAmountChange}
          placeholder="0.00"
          label="AMOUNT ADMIN"
          type="text"
          inputProps={{ inputMode: 'decimal', style: { fontSize: '0.72rem', padding: '6px' } }}
          sx={{
            bgcolor: 'rgba(255,255,255,0.03)',
            '& .MuiInputBase-input': { color: 'white', fontSize: '0.72rem' },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem' },
            width: inputWidth,
            '& .MuiFilledInput-root': { paddingTop: '2px', paddingBottom: '2px' }
          }}
        />

        {mode === 'cash' && (
          <TextField
            size="small"
            variant="filled"
            value={cashStr}
            onChange={onCashChange}
            placeholder="0.00"
            label="CASH GIVEN"
            type="text"
            inputProps={{ inputMode: 'decimal', style: { fontSize: '0.72rem', padding: '6px' } }}
            sx={{
              bgcolor: 'rgba(255,255,255,0.03)',
              '& .MuiInputBase-input': { color: 'white', fontSize: '0.72rem' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem' },
              width: inputWidth,
              '& .MuiFilledInput-root': { paddingTop: '2px', paddingBottom: '2px' }
            }}
          />
        )}

        {mode === 'recalculo' && (
          <>
            <TextField
              size="small"
              variant="filled"
              value={amountRealStr}
              onChange={onAmountRealChange}
              placeholder="0.00"
              label="AMOUNT REAL"
              type="text"
              inputProps={{ inputMode: 'decimal', style: { fontSize: '0.72rem', padding: '6px' } }}
              sx={{ bgcolor: 'rgba(255,255,255,0.03)', '& .MuiInputBase-input': { color: 'white', fontSize: '0.72rem' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem' }, width: inputWidth, '& .MuiFilledInput-root': { paddingTop: '2px', paddingBottom: '2px' } }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={surgeType}
                onChange={onSurgeTypeChange}
                variant="filled"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.03)',
                  color: 'white',
                  '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' },
                  fontSize: '0.72rem'
                }}
              >
                <MenuItem value="none">No surge</MenuItem>
                <MenuItem value="admin">Surge Admin</MenuItem>
                <MenuItem value="dispatch">Surge Dispatch</MenuItem>
                <MenuItem value="both">Ambos</MenuItem>
              </Select>
            </FormControl>

            {(surgeType === 'admin' || surgeType === 'both') && (
              <TextField
                size="small"
                variant="filled"
                value={surgeAdminStr}
                onChange={onSurgeAdminChange}
                placeholder="1.00"
                label="SURGE_ADMIN"
                type="text"
                inputProps={{ inputMode: 'decimal', style: { fontSize: '0.72rem', padding: '6px' } }}
                sx={{ bgcolor: 'rgba(255,255,255,0.03)', '& .MuiInputBase-input': { color: 'white', fontSize: '0.72rem' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem' }, width: inputWidth, '& .MuiFilledInput-root': { paddingTop: '2px', paddingBottom: '2px' } }}
              />
            )}

            {(surgeType === 'dispatch' || surgeType === 'both') && (
              <TextField
                size="small"
                variant="filled"
                value={surgeRealStr}
                onChange={onSurgeRealChange}
                placeholder="1.00"
                label="SURGE_REAL"
                type="text"
                inputProps={{ inputMode: 'decimal', style: { fontSize: '0.72rem', padding: '6px' } }}
                sx={{ bgcolor: 'rgba(255,255,255,0.03)', '& .MuiInputBase-input': { color: 'white', fontSize: '0.72rem' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem' }, width: inputWidth, '& .MuiFilledInput-root': { paddingTop: '2px', paddingBottom: '2px' } }}
              />
            )}
          </>
        )}

        {mode === 'cambio' && (
          <>
            <TextField
              size="small"
              variant="filled"
              value={cashGivenAdminStr}
              onChange={onCashGivenAdminChange}
              placeholder="0.00"
              label="CASH GIVEN ADMIN"
              type="text"
              inputProps={{ inputMode: 'decimal', style: { fontSize: '0.72rem', padding: '6px' } }}
              sx={{ bgcolor: 'rgba(255,255,255,0.03)', '& .MuiInputBase-input': { color: 'white', fontSize: '0.72rem' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem' }, width: inputWidth, '& .MuiFilledInput-root': { paddingTop: '2px', paddingBottom: '2px' } }}
            />
            <TextField
              size="small"
              variant="filled"
              value={realCashGivenStr}
              onChange={onRealCashGivenChange}
              placeholder="0.00"
              label="REAL CASH GIVEN"
              type="text"
              inputProps={{ inputMode: 'decimal', style: { fontSize: '0.72rem', padding: '6px' } }}
              sx={{ bgcolor: 'rgba(255,255,255,0.03)', '& .MuiInputBase-input': { color: 'white', fontSize: '0.72rem' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem' }, width: inputWidth, '& .MuiFilledInput-root': { paddingTop: '2px', paddingBottom: '2px' } }}
            />
          </>
        )}

        {mode === 'mvzero' && (
          <>
            <TextField
              size="small"
              variant="filled"
              value={cashGivenAdminStr}
              onChange={onCashGivenAdminChange}
              placeholder="0.00"
              label="CASH GIVEN ADMIN"
              type="text"
              inputProps={{ inputMode: 'decimal', style: { fontSize: '0.72rem', padding: '6px' } }}
              sx={{ bgcolor: 'rgba(255,255,255,0.03)', '& .MuiInputBase-input': { color: 'white', fontSize: '0.72rem' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem' }, width: inputWidth, '& .MuiFilledInput-root': { paddingTop: '2px', paddingBottom: '2px' } }}
            />
            <TextField
              size="small"
              variant="filled"
              value={amountStr}
              onChange={onAmountChange}
              placeholder="0.00"
              label="AMOUNT ADMIN"
              type="text"
              inputProps={{ inputMode: 'decimal', style: { fontSize: '0.72rem', padding: '6px' } }}
              sx={{ bgcolor: 'rgba(255,255,255,0.03)', '& .MuiInputBase-input': { color: 'white', fontSize: '0.72rem' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem' }, width: inputWidth, '& .MuiFilledInput-root': { paddingTop: '2px', paddingBottom: '2px' } }}
            />
          </>
        )}
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.04)', my: 0.5 }} />

      {/* Outputs - max 2 columns to avoid tall layout */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0.5,
        px: 1,
        pb: 0.75
      }}>
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

            <OutputBox
              label="Movimiento al cliente"
              value={MOVIMIENTO_CLIENTE}
              color={colorForValue(MOVIMIENTO_CLIENTE)}
              smallNote={MOVIMIENTO_CLIENTE > 1 ? 'Aplica ✅' : 'No aplica ❌'}
            />
            <OutputBox label="CÁLCULO" value={CALCULO} color={colorForValue(CALCULO)} />
            <OutputBox label="Movimiento al conductor" value={MOVIMIENTO_CONDUCTOR} color={colorForValue(MOVIMIENTO_CONDUCTOR)} />
          </>
        )}

        {mode === 'cambio' && (
          <>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <OutputBox label="Movimiento (CASH GIVEN ADMIN - REAL CASH GIVEN)" value={CAMBIO_MOVIMIENTO} color={colorForValue(CAMBIO_MOVIMIENTO)} />
            </Box>
          </>
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