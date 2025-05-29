import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ClinicalTrials from './components/ClinicalTrials';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ClinicalTrials />
    </ThemeProvider>
  );
}

export default App; 