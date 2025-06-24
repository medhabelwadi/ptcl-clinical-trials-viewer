import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Paper, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LineChart, Line } from 'recharts';

const statusColors = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#ffc107']; // Example colors
const locationColors = ['#1976d2', '#ff7043', '#00bcd4', '#7c4dff', '#757575'];
const phaseColors = ['#1976d2', '#26a69a', '#43a047', '#00bcd4', '#7c4dff', '#757575'];

const statuses = [
    { label: 'Recruiting', value: 'RECRUITING' },
    { label: 'Active, not recruiting', value: 'ACTIVE_NOT_RECRUITING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Terminated', value: 'TERMINATED' },
    { label: 'Not yet recruiting', value: 'NOT_YET_RECRUITING' }
];

const ptclSubtypes = [
  { label: 'PTCL-NOS', cond: 'Peripheral T-cell lymphoma, not otherwise specified' },
  { label: 'ALCL', cond: 'Anaplastic large cell lymphoma' },
  { label: 'AITL', cond: 'Angioimmunoblastic T-cell lymphoma' },
  { label: 'ENKTL', cond: 'Extranodal NK/T-cell lymphoma, nasal type' },
  // ...add more as needed
];

const Dashboard_data: React.FC = () => {
    const [total, setTotal] = useState(null);
    const [recruiting, setRecruiting] = useState(null);
    const [completed, setCompleted] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<String | null>(null);

    const [statusData, setStatusData] = useState<{ name: string, value: number }[]>([]);
    const [subtypeData, setSubtypeData] = useState<{ name: string, value: number }[]>([]);
    const [yearData, setYearData] = useState<{ year: number, value: number }[]>([]);
    const [locationData, setLocationData] = useState<{ name: string, value: number }[]>([]);

    useEffect(() => {
        Promise.all(
            statuses.map(status =>
                axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/clinical-trials`, {
                    params: {
                        countTotal: 'true',
                        pageSize: 1,
                        cond: 'peripheral T cell lymphoma',
                        status: status.value
                    }
                })
            )
        ).then(responses => {
            const data = responses.map((res, i) => ({
                name: statuses[i].label,
                value: res.data.totalCount || 0
            }));
            setStatusData(data);
        });
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/clinical-trials`, { params: { countTotal: true, pageSize: 1, cond: 'peripheral T cell lymphoma' } }),
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/clinical-trials`, { params: { countTotal: true, pageSize: 1, cond: 'peripheral T cell lymphoma', status: 'RECRUITING' } }),
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/clinical-trials`, { params: { countTotal: true, pageSize: 1, cond: 'peripheral T cell lymphoma', status: 'COMPLETED' } }),
        ])
            .then(([totalRes, recruitingRes, completedRes]) => {
                setTotal(totalRes.data.totalCount);
                setRecruiting(recruitingRes.data.totalCount);
                setCompleted(completedRes.data.totalCount);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load dashboard data');
                setLoading(false);
            });
    }, []);

    // Subtype bar chart data fetching and aggregation
    useEffect(() => {
      const listedSubtypes = ptclSubtypes;
      const subtypePromises = listedSubtypes.map(subtype =>
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/clinical-trials`, {
          params: {
            countTotal: 'true',
            pageSize: 1,
            cond: subtype.cond
          }
        })
      );
      const totalPromise = axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/clinical-trials`, {
        params: {
          countTotal: 'true',
          pageSize: 1,
          cond: 'peripheral T cell lymphoma'
        }
      });
      Promise.all([...subtypePromises, totalPromise]).then(responses => {
        const totalCount = responses[responses.length - 1].data.totalCount || 0;
        const listedCounts = responses.slice(0, -1).map((res, i) => ({
          name: ptclSubtypes[i].label,
          value: res.data.totalCount || 0
        }));
        const sumListed = listedCounts.reduce((sum, item) => sum + item.value, 0);
        const otherCount = Math.max(totalCount - sumListed, 0);
        setSubtypeData([
          ...listedCounts,
          { name: 'Other subtypes', value: otherCount }
        ]);
      });
    }, []);

    // Trials by Year data fetching and aggregation
    useEffect(() => {
      axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/clinical-trials`, {
        params: {
          cond: 'peripheral T cell lymphoma',
          pageSize: 1000 // adjust as needed
        }
      }).then(res => {
        const counts: Record<number, number> = {};
        (res.data.studies || []).forEach((study: any) => {
          const dateStr = study.protocolSection?.statusModule?.startDateStruct?.date;
          if (dateStr) {
            const year = new Date(dateStr).getFullYear();
            counts[year] = (counts[year] || 0) + 1;
          }
        });
        const data = Object.entries(counts)
          .map(([year, value]) => ({ year: Number(year), value }))
          .sort((a, b) => a.year - b.year);
        setYearData(data);
      });
    }, []);

    // Trials by Location data fetching and aggregation
    useEffect(() => {
      axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/clinical-trials`, {
        params: {
          cond: 'peripheral T cell lymphoma',
          pageSize: 1000 // or as needed
        }
      }).then(res => {
        const countryCounts: Record<string, number> = {};
        (res.data.studies || []).forEach((study: any) => {
          const locations = study.protocolSection?.contactsLocationsModule?.locations || [];
          const countries = new Set(locations.map((loc: any) => loc.country).filter(Boolean));
          countries.forEach(country => {
            countryCounts[country as string] = (countryCounts[country as string] || 0) + 1;
          });
        });
        // Group top 4 countries, rest as 'Other'
        const sorted = Object.entries(countryCounts) as [string, number][];
        sorted.sort((a, b) => b[1] - a[1]);
        const main = sorted.slice(0, 4).map(([name, value]) => ({ name, value }));
        const otherValue = sorted.slice(4).reduce((sum, [, value]) => sum + value, 0);
        const data = otherValue > 0 ? [...main, { name: 'Other', value: otherValue }] : main;
        setLocationData(data);
      });
    }, []);

    return (
        <div>
          <h2>PTCL Clinical Trials Dashboard</h2>
          <Box display="flex" gap={4} mt={6} justifyContent="center" alignItems="stretch">
            <StatusPieChart statusData={statusData} />
            <SubtypeBarChart data={subtypeData} />
          </Box>
          <Box display="flex" gap={4} mt={6} justifyContent="center" alignItems="stretch">
            <TrialsByLocationChart data={locationData} />
            <TrialsByYearChart data={yearData} />
          </Box>
        </div>
      );
};

const StatusPieChart: React.FC<{ statusData: { name: string, value: number }[] }> = ({ statusData }) => (
  <Box flex={1} maxWidth={600}>
    <Paper elevation={3} sx={{ p: 3, minWidth: 400, textAlign: 'center', height: '100%' }}>
      <Typography variant="h6">Trial Status Distribution</Typography>
      <Box mt={4}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  </Box>
);

const SubtypeBarChart: React.FC<{ data: { name: string, value: number }[] }> = ({ data }) => (
  <Box flex={1} maxWidth={600}>
    <Paper elevation={3} sx={{ p: 3, minWidth: 400, textAlign: 'center', height: '100%' }}>
      <Typography variant="h6">Trials by PTCL Subtype</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#0277bd" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  </Box>
);

const TrialsByYearChart: React.FC<{ data: { year: number, value: number }[] }> = ({ data }) => (
  <Box flex={1} maxWidth={600}>
    <Paper elevation={3} sx={{ p: 3, minWidth: 400, textAlign: 'center', height: '100%' }}>
      <Typography variant="h6">Trials by Year</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#ff7043" strokeWidth={3} dot />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  </Box>
);

const TrialsByLocationChart: React.FC<{ data: { name: string, value: number }[] }> = ({ data }) => (
  <Box flex={1} maxWidth={600}>
    <Paper elevation={3} sx={{ p: 3, minWidth: 400, textAlign: 'center', height: '100%' }}>
      <Typography variant="h6">Trials by Location</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ percent }) => percent !== undefined ? `${(percent * 100).toFixed(0)}%` : ''}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-location-${index}`} fill={locationColors[index % locationColors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  </Box>
);

export default Dashboard_data;