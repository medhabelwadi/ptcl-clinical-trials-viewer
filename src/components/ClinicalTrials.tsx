import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Card, CardContent, CircularProgress, Button, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox, ListItemText, Box, TextField, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface ClinicalTrial {
  nctId: string;
  briefTitle: string;
  briefSummary?: string;
  overallStatus?: string;
}

interface TrialLocations {
  [nctId: string]: string[];
}

const PTCL_SUBTYPES = [
  'All',
  'Peripheral T-cell lymphoma, not otherwise specified (PTCL-NOS)',
  'Angioimmunoblastic T-cell lymphoma (AITL)',
  'Follicular T-cell lymphoma (FTCL)',
  'Nodal PTCL with T follicular helper (TFH) phenotype',
  'Anaplastic large cell lymphoma (ALCL), ALK-positive',
  'Anaplastic large cell lymphoma (ALCL), ALK-negative',
  'Primary cutaneous ALCL',
  'Breast implant-associated ALCL',
  'T-cell prolymphocytic leukemia (T-PLL)',
  'Adult T-cell leukemia/lymphoma (ATL)',
  'Sézary syndrome',
  'Extranodal NK/T-cell lymphoma, nasal type (ENKTL)',
  'Enteropathy-associated T-cell lymphoma (EATL)',
  'Monomorphic epitheliotropic intestinal T-cell lymphoma (MEITL)',
  'Hepatosplenic T-cell lymphoma (HSTCL)',
  'Subcutaneous panniculitis-like T-cell lymphoma (SPTCL)',
  'Indolent T-cell lymphoproliferative disorder of the gastrointestinal tract',
  'Primary cutaneous acral CD8+ T-cell lymphoma',
  'Primary central nervous system T-cell lymphoma',
  'Primary testicular T-cell lymphoma',
];

const STATUS_OPTIONS = [
  'ACTIVE_NOT_RECRUITING',
  'COMPLETED',
  'ENROLLING_BY_INVITATION',
  'NOT_YET_RECRUITING',
  'RECRUITING',
  'SUSPENDED',
  'TERMINATED',
  'WITHDRAWN',
  'AVAILABLE',
  'NO_LONGER_AVAILABLE',
  'TEMPORARILY_NOT_AVAILABLE',
  'APPROVED_FOR_MARKETING',
  'WITHHELD',
  'UNKNOWN',
];

const ClinicalTrials: React.FC = () => {
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedSubtype, setSelectedSubtype] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [trialLocations, setTrialLocations] = useState<TrialLocations>({});
  const [zipcode, setZipcode] = useState('');
  const [radius, setRadius] = useState('');
  const [geo, setGeo] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const fetchTrials = async (pageToken?: string, subtype?: string, status?: string[], geoOverride?: { lat: number; lon: number } | null) => {
    try {
      // Build params for API call
      const params: any = {};
      if (pageToken) params.pageToken = pageToken;
      if (subtype && subtype !== 'All') params.cond = subtype;
      if (status && status.length > 0) params.status = status.join(',');
      const geoToUse = geoOverride !== undefined ? geoOverride : geo;
      if (geoToUse && radius) {
        params.lat = geoToUse.lat;
        params.lon = geoToUse.lon;
        params.radius = radius;
      }
      // Use URLSearchParams to serialize status as repeated keys
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      });
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/clinical-trials?${searchParams.toString()}`);
      const trialsData = (response.data.studies || []).map((study: any) => ({
        nctId: study.protocolSection?.identificationModule?.nctId || 'N/A',
        briefTitle: study.protocolSection?.identificationModule?.briefTitle || 'No Title',
        briefSummary: study.protocolSection?.descriptionModule?.briefSummary || 'No Summary',
        overallStatus: study.protocolSection?.statusModule?.overallStatus || 'Unknown',
      }));
      if (pageToken) {
        setTrials(prev => [...prev, ...trialsData]);
      } else {
        setTrials(trialsData);
      }
      setNextPageToken(response.data.nextPageToken || null);
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      setError('Failed to fetch clinical trials data');
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTrials(undefined, selectedSubtype, selectedStatus);
    // eslint-disable-next-line
  }, [selectedSubtype, selectedStatus, geo, radius]);

  const handleLoadMore = () => {
    if (nextPageToken) {
      setLoadingMore(true);
      fetchTrials(nextPageToken, selectedSubtype, selectedStatus);
    }
  };

  // Fetch locations for a given NCT ID
  const fetchLocations = async (nctId: string) => {
    if (trialLocations[nctId]) return; // Already fetched
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/clinical-trials/${nctId}`);
      const locations = response.data.protocolSection?.contactsLocationsModule?.locations || [];
      const locationStrings = locations.map((loc: any) => {
        let parts = [];
        if (loc.facility) parts.push(loc.facility);
        if (loc.city) parts.push(loc.city);
        if (loc.state) parts.push(loc.state);
        if (loc.country) parts.push(loc.country);
        return parts.join(', ');
      });
      setTrialLocations(prev => ({ ...prev, [nctId]: locationStrings }));
    } catch (err) {
      setTrialLocations(prev => ({ ...prev, [nctId]: ['Failed to fetch locations'] }));
    }
  };

  // Fetch locations when trials change
  useEffect(() => {
    trials.forEach(trial => {
      fetchLocations(trial.nctId);
    });
    // eslint-disable-next-line
  }, [trials]);

  // Geocode zipcode to lat/lon
  const handleGeoSearch = async () => {
    if (!zipcode || !radius) return;
    setGeoLoading(true);
    setGeoError(null);
    try {
      const resp = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          postalcode: zipcode,
          country: 'us',
          format: 'json',
          limit: 1
        }
      });
      if (resp.data && resp.data.length > 0) {
        setGeo({ lat: parseFloat(resp.data[0].lat), lon: parseFloat(resp.data[0].lon) });
      } else {
        setGeo(null);
        setGeoError('Could not find location for that ZIP code.');
      }
    } catch (err) {
      setGeo(null);
      setGeoError('Failed to geocode ZIP code.');
    }
    setGeoLoading(false);
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom style={{ marginTop: '2rem' }}>
        Peripheral T Cell Lymphoma Clinical Trials
      </Typography>
      <Box display="flex" gap={2} mb={3}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel id="subtype-label">PTCL Subtype</InputLabel>
          <Select
            labelId="subtype-label"
            value={selectedSubtype}
            label="PTCL Subtype"
            onChange={e => setSelectedSubtype(e.target.value)}
          >
            {PTCL_SUBTYPES.map(subtype => (
              <MenuItem key={subtype} value={subtype}>{subtype}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            multiple
            value={selectedStatus}
            onChange={e => setSelectedStatus(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            input={<OutlinedInput label="Status" />}
            renderValue={selected => (selected as string[]).join(', ')}
          >
            {STATUS_OPTIONS.map(status => (
              <MenuItem key={status} value={status}>
                <Checkbox checked={selectedStatus.indexOf(status) > -1} />
                <ListItemText primary={status} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <TextField
            label="ZIP Code"
            value={zipcode}
            onChange={e => setZipcode(e.target.value)}
            size="small"
            inputProps={{ maxLength: 10 }}
          />
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <TextField
            label="Radius (miles)"
            value={radius}
            onChange={e => setRadius(e.target.value.replace(/[^0-9]/g, ''))}
            size="small"
            inputProps={{ maxLength: 4 }}
          />
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGeoSearch}
          disabled={geoLoading || !zipcode || !radius}
        >
          {geoLoading ? 'Locating...' : 'Apply Location Filter'}
        </Button>
        {geoError && <Typography color="error">{geoError}</Typography>}
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          {trials.map((trial) => (
            <Card key={trial.nctId} style={{ marginBottom: '1rem' }}>
              <CardContent>
                <Typography variant="h6">{trial.briefTitle}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  NCT ID: {trial.nctId}
                </Typography>
                <Typography variant="body2" paragraph>
                  {trial.briefSummary}
                </Typography>
                <Typography color="primary">
                  Status: {trial.overallStatus}
                </Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: '1rem' }}
                >
                  View on ClinicalTrials.gov
                </Button>
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Locations</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {trialLocations[trial.nctId] ? (
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {trialLocations[trial.nctId].map((loc, idx) => (
                          <li key={idx}>{loc}</li>
                        ))}
                      </ul>
                    ) : (
                      <Typography variant="body2">Loading locations...</Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          ))}
          {nextPageToken && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{ margin: '2rem auto', display: 'block' }}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          )}
          <Box mt={6} mb={2}>
            <Typography variant="subtitle2" color="textSecondary" align="center">
              Data sourced from <a href="https://clinicaltrials.gov/" target="_blank" rel="noopener noreferrer">ClinicalTrials.gov</a>.<br />
              Geocoding provided by <a href="https://nominatim.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap Nominatim</a>.<br />
            </Typography>
          </Box>
        </>
      )}
    </Container>
  );
};

export default ClinicalTrials; 