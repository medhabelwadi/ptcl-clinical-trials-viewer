import React from 'react';
import { CssBaseline, ThemeProvider, createTheme, AppBar, Tabs, Tab, Toolbar, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ClinicalTrials from './components/ClinicalTrials';
import Dashboard_data from './components/Dashboard';
import ChatInterface from './components/ChatInterface';

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

function NavTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const tabValue =
    location.pathname === '/dashboard' ? 1 : 
    location.pathname === '/map' ? 2 : 
    location.pathname === '/chat' ? 3 : 0;
  return (
    <AppBar position="static">
      <Toolbar>
        <Tabs value={tabValue} onChange={(_, v) => {
          if (v === 0) navigate('/');
          if (v === 1) navigate('/dashboard');
          if (v === 2) navigate('/map');
          if (v === 3) navigate('/chat');
        }} textColor="inherit" indicatorColor="secondary">
          <Tab label="Home" />
          <Tab label="Dashboard" />
          <Tab label="Map" />
          <Tab label="Chat" />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}

function Dashboard() {
  return <Box p={3}><h2>Dashboard</h2></Box>;
}

function MapPage() {
  return <Box p={3}><h2>Map</h2></Box>;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <NavTabs />
        <Routes>
          <Route path="/" element={<ClinicalTrials />} />
          <Route path="/dashboard" element={<Dashboard_data />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/chat" element={<ChatInterface />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 