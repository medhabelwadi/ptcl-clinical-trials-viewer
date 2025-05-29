const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/clinical-trials', async (req, res) => {
  try {
    const params = {
      'query.cond': req.query.cond || 'peripheral T cell lymphoma',
      fields: [
        'protocolSection.identificationModule.nctId',
        'protocolSection.identificationModule.briefTitle',
        'protocolSection.descriptionModule.briefSummary',
        'protocolSection.statusModule.overallStatus'
      ].join(','),
      pageSize: 10
    };
    if (req.query.pageToken) {
      params.pageToken = req.query.pageToken;
    }
    let statusParam = req.query.status || req.query['status[]'];
    if (statusParam) {
      params['filter.overallStatus'] = Array.isArray(statusParam)
        ? statusParam.join(',')
        : statusParam;
    }
    // Add geo filter if lat, lon, and radius are present
    if (req.query.lat && req.query.lon && req.query.radius) {
      params['filter.geo'] = `distance(${req.query.lat},${req.query.lon},${req.query.radius}mi)`;
    }
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 