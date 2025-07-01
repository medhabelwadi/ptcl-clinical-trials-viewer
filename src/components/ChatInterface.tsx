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

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ height: 'calc(100vh - 120px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" mt={2}>
            Connecting to NLWeb...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ height: 'calc(100vh - 120px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            NLWeb Connection Error
          </Typography>
          <Typography variant="body1" gutterBottom>
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            To fix this:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Make sure NLWeb backend is running: <code>cd NLWeb/code && python app-file.py</code></li>
            <li>Check that it's running on port 8000</li>
            <li>Verify your OpenAI API key is configured</li>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ height: 'calc(100vh - 120px)', p: 0 }}>
      <Typography variant="h4" component="h1" textAlign="center" gutterBottom sx={{ py: 2 }}>
        PTCL Clinical Trials Assistant
      </Typography>
      <Typography variant="subtitle1" textAlign="center" color="text.secondary" mb={2}>
        Powered by NLWeb - Natural Language Interface
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          height: 'calc(100vh - 200px)',
          overflow: 'hidden',
          borderRadius: 2
        }}
      >
        <iframe
          src={nlwebUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '8px'
          }}
          title="NLWeb Chat Interface"
          onLoad={() => setIsLoading(false)}
        />
      </Paper>
    </Container>
  );
};

export default ChatInterface; 