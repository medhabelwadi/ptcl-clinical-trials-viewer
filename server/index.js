const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const qs = require('qs');

const app = express();
const PORT = process.env.PORT ||5050;

app.use(cors());
app.use(express.json());

app.get('/api/clinical-trials', async (req, res) => {
  try {
    const params = { ...req.query };
    // Always use a broad PTCL condition if not provided
    params['query.cond'] = req.query.cond || 'peripheral T cell lymphoma';
    // Remove any direct 'cond' property to avoid conflicts
    delete params.cond;
    // Map 'status' to 'filter.overallStatus' for the API
    if (params.status) {
      if (Array.isArray(params.status)) {
        params['filter.overallStatus'] = params.status.join(',');
      } else {
        params['filter.overallStatus'] = params.status;
      }
      delete params.status;
    }
    params.fields = [
      'protocolSection.identificationModule.nctId',
      'protocolSection.identificationModule.briefTitle',
      'protocolSection.descriptionModule.briefSummary',
      'protocolSection.statusModule.overallStatus',
      'protocolSection.statusModule.startDateStruct',
      'protocolSection.statusModule.primaryCompletionDateStruct',
      'protocolSection.contactsLocationsModule.locations',
      'protocolSection.designModule.phases'
    ].join(',');
    if (!params.pageSize) params.pageSize = 10;

    const response = await axios.get(
      'https://clinicaltrials.gov/api/v2/studies',
      { params }
    );
    res.json(response.data);
  } catch (error) {
    // Log the full error for debugging
    if (error.response) {
      console.error('ClinicalTrials.gov API error:', error.response.status, error.response.data);
      res.status(500).json({ error: 'Failed to fetch data from ClinicalTrials.gov', details: error.response.data });
    } else {
      console.error('Backend error:', error.message);
      res.status(500).json({ error: 'Failed to fetch data from ClinicalTrials.gov', details: error.message });
    }
  }
});

app.get('/api/clinical-trials/:nctId', async (req, res) => {
  try {
    const response = await axios.get(
      `https://clinicaltrials.gov/api/v2/studies/${req.params.nctId}`
    );
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      console.error('ClinicalTrials.gov API error:', error.response.status, error.response.data);
      res.status(500).json({ error: 'Failed to fetch study details from ClinicalTrials.gov', details: error.response.data });
    } else {
      console.error('Backend error:', error.message);
      res.status(500).json({ error: 'Failed to fetch study details from ClinicalTrials.gov', details: error.message });
    }
  }
});

// Proxy all /nlweb and subpaths to NLWeb backend
app.use('/nlweb', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: { '^/nlweb': '' },
}));

// Proxy /static to NLWeb backend for static assets
app.use('/static', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
}));

// Proxy additional NLWeb API endpoints
const nlwebApiEndpoints = ['/sites', '/ask', '/mcp', '/conversations', '/favicon.ico'];
nlwebApiEndpoints.forEach(endpoint => {
  app.use(endpoint, createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
  }));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 