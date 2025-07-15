import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  Alert,
  CircularProgress
} from '@mui/material';

interface ChatInterfaceProps {}

const ChatInterface: React.FC<ChatInterfaceProps> = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nlwebUrl, setNlwebUrl] = useState<string>('');

  useEffect(() => {
    // Get NLWeb backend URL from environment or use default
    const backendUrl = process.env.REACT_APP_NLWEB_URL || 'http://localhost:8000';
    setNlwebUrl(backendUrl);
    
    // Check if NLWeb backend is accessible
    fetch(`${backendUrl}/mcp/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then(response => {
        if (response.ok) {
          setIsLoading(false);
        } else {
          setError('NLWeb backend is not responding properly');
          setIsLoading(false);
        }
      })
      .catch(err => {
        setError('Cannot connect to NLWeb backend. Please make sure it is running on port 8000.');
        setIsLoading(false);
      });
  }, []);

  // Optionally, render a fallback message in case redirect fails
  return (
    <Container maxWidth="lg" sx={{ height: 'calc(100vh - 120px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant="h6">Redirecting to NLWeb Chat...</Typography>
    </Container>
  );
};

export default ChatInterface; 