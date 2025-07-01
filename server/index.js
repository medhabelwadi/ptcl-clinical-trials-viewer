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
    // Always use a broad PTCL condition if not provided
    params['query.cond'] = req.query.cond || 'peripheral T cell lymphoma';
    // Remove any direct 'cond' property to avoid conflicts
    delete params.cond;
    // Map 'status' to 'filter.overallStatus' for the API
    if (params.status) {
      params['filter.overallStatus'] = params.status;
      delete params.status;
    }
    // Remove any status[] parameter (in case frontend sends arrays)
    if (params['status[]']) {
      params['filter.overallStatus'] = params['status[]'];
      delete params['status[]'];
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

    console.log('Params sent to ClinicalTrials.gov:', params);

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