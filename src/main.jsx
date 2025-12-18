// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GlobalStyles } from '@mui/material';

// TEMA RIDERY OFICIAL
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#87fcd9', contrastText: '#3536ba' }, 
    secondary: { main: '#ff3775' }, 
    background: { default: '#31405f', paper: '#3536ba' },
    text: { primary: '#f5f5ff', secondary: '#87fcd9' },
    error: { main: '#ff3775' }
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h4: { fontWeight: 800, letterSpacing: '-0.5px', color: '#87fcd9' },
    h6: { fontWeight: 700 },
    button: { fontWeight: 800 }
  },
  shape: { borderRadius: 16 }, 
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px', 
          padding: '10px 30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        },
        containedPrimary: {
            background: 'linear-gradient(45deg, #87fcd9 30%, #69f0ae 90%)',
            color: '#3536ba',
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', 
          backgroundColor: '#3536ba',
          border: '1px solid rgba(135, 252, 217, 0.1)', 
        },
      },
    }
  },
});

const globalStyles = (
  <GlobalStyles
    styles={{
      body: { 
        backgroundColor: '#31405f', 
        backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(53, 54, 186, 0.4) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(255, 55, 117, 0.15) 0%, transparent 40%)
        `,
        backgroundAttachment: 'fixed',
        overflowX: 'hidden'
      },
      '::-webkit-scrollbar': { width: '8px' },
      '::-webkit-scrollbar-track': { background: '#31405f' },
      '::-webkit-scrollbar-thumb': { background: '#87fcd9', borderRadius: '10px' },
    }}
  />
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);