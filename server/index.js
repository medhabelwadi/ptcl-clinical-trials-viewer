const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT ||5050;

app.use(cors());
app.use(express.json());

app.get('/api/clinical-trials', async (req, res) => {
  try {
    const params = { ...req.query };

    // Always use a broad PTCL condition if not provided or if "All" is selected
    if (!req.query.cond || req.query.cond === 'All' || req.query.cond.trim() === '') {
      params['query.term'] = 'peripheral T cell lymphoma';
    } else if (req.query.cond === 'peripheral T cell lymphoma') {
      // When frontend sends 'peripheral T cell lymphoma' (for "All" selection)
      params['query.term'] = 'peripheral T cell lymphoma';
    } else {
      // For specific subtypes, use query.term for better filtering
      params['query.term'] = req.query.cond;
    }
    delete params.cond;
    delete params['query.cond'];

    // Map status/status[] to filter.overallStatus
    let statusParam = req.query.status || req.query['status[]'];
    if (Array.isArray(statusParam)) {
      statusParam = statusParam.join(',');
    }
    if (statusParam) {
      params['filter.overallStatus'] = statusParam;
      delete params.status;
      delete params['status[]'];
    }

    // Remove unsupported location params
    delete params['filter.location'];
    delete params.lat;
    delete params.lon;
    delete params.radius;

    // Add geo filter if lat, lon, and radius are present
    if (req.query.lat && req.query.lon && req.query.radius) {
      params['filter.geo'] = `distance(${req.query.lat},${req.query.lon},${req.query.radius}mi)`;
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

    console.log('Final params sent to ClinicalTrials.gov:', params);

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