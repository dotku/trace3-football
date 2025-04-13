import { Card, Title, Text, Metric, Flex, Badge } from '@tremor/react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAnalyticsStore } from '../../lib/store/analytics';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api/client';
import { useEffect, useState } from 'react';

export default function GameDayDashboard() {
  const { attendance, concessions, parking } = useAnalyticsStore();
  interface HistoricalDataPoint {
    date: string;
    attendance: number;
    concessions: number;
    parking: number;
  }

  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  // Fetch predictions
  const { data: predictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      const [concessions, parking, attendance] = await Promise.all([
        api.predictions.getConcessionsForecast(),
        api.predictions.getParkingForecast(),
        api.predictions.getAttendanceForecast(),
      ]);
      return { concessions, parking, attendance };
    },
  });

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      
      try {
        const response = await api.analytics.getHistoricalData(startDate, endDate);
        setHistoricalData(response.data);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchHistoricalData();
  }, []);

  const getAttendanceStatus = (current: number, expected: number): { color: string; text: string } => {
    const ratio = current / expected;
    if (ratio >= 0.95) return { color: 'emerald', text: 'Excellent' };
    if (ratio >= 0.85) return { color: 'violet', text: 'Good' };
    if (ratio >= 0.75) return { color: 'amber', text: 'Fair' };
    return { color: 'rose', text: 'Below Target' };
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-US').format(value);

  const expectedAttendance = predictions?.attendance?.data?.expected || 0;
  const attendanceStatus = getAttendanceStatus(attendance, expectedAttendance);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-8 relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-xl md:rounded-3xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-emerald-500/10 rounded-xl md:rounded-3xl backdrop-blur-xl"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 relative">
        {/* Attendance Card */}
        <Card className="ring-1 ring-indigo-500/20 border-none shadow-lg bg-gradient-to-br from-slate-900/90 to-indigo-950/90 backdrop-blur-xl p-4">
          <div className="flex justify-between items-start">
            <Title className="text-blue-100">Attendance</Title>
            <Badge color={attendanceStatus.color}>{attendanceStatus.text}</Badge>
          </div>
          <Flex className="mt-4">
            <Text className="text-blue-200">Current</Text>
            <Metric className="text-blue-400">{formatNumber(attendance)}</Metric>
          </Flex>
          <div className="mt-4 md:mt-6 h-40 md:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Present', value: attendance },
                    { name: 'Expected', value: expectedAttendance },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#3B82F6"
                  dataKey="value"
                  nameKey="name"
                >
                  <Tooltip formatter={formatNumber} />
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Flex className="mt-4 text-sm text-slate-400 justify-center">
            <Text>Target: {formatNumber(expectedAttendance)}</Text>
          </Flex>
        </Card>

        {/* Concessions Card */}
        <Card className="ring-1 ring-indigo-500/20 border-none shadow-lg bg-gradient-to-br from-slate-900/90 to-indigo-950/90 backdrop-blur-xl p-4">
          <Title className="text-blue-100">Concessions Revenue</Title>
          <Flex className="mt-4">
            <Text className="text-blue-200">Current Sales</Text>
            <Metric className="text-purple-400">{formatCurrency(concessions.sales)}</Metric>
          </Flex>
          <div className="mt-4 md:mt-6 h-40 md:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: 'Sales',
                    Current: concessions.sales,
                    Forecast: predictions?.concessions?.data?.forecast || 0,
                  },
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={formatCurrency} />
                <Legend />
                <Bar dataKey="Current" fill="#9333EA" />
                <Bar dataKey="Forecast" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Flex className="mt-4 text-sm text-slate-400 justify-between">
            <Text>Items Sold: {Object.values(concessions.inventory).reduce((a, b) => a + b, 0)}</Text>
            <Text>Average per Person: {formatCurrency(concessions.sales / attendance)}</Text>
          </Flex>
        </Card>

        {/* Parking Card */}
        <Card className="ring-1 ring-indigo-500/20 border-none shadow-lg bg-gradient-to-br from-slate-900/90 to-indigo-950/90 backdrop-blur-xl p-4">
          <Title className="text-blue-100">Parking Availability</Title>
          <Flex className="mt-4">
            <Text className="text-blue-200">Spaces Available</Text>
            <Metric className="text-emerald-400">{formatNumber(parking.available)}</Metric>
          </Flex>
          <div className="mt-4 md:mt-6 h-40 md:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Available', value: parking.available },
                    { name: 'Occupied', value: parking.occupied },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#22C55E"
                  dataKey="value"
                  nameKey="name"
                >
                  <Tooltip formatter={formatNumber} />
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Flex className="mt-4 text-sm text-slate-400 justify-between">
            <Text>Total Capacity: {formatNumber(parking.available + parking.occupied)}</Text>
            <Text>Utilization: {Math.round((parking.occupied / (parking.available + parking.occupied)) * 100)}%</Text>
          </Flex>
        </Card>
      </div>

      {/* Historical Trends */}
      <Card className="ring-1 ring-indigo-500/20 border-none shadow-lg bg-gradient-to-br from-slate-900/90 to-indigo-950/90 backdrop-blur-xl p-4">
        <div className="flex flex-col md:flex-row justify-between items-start mb-4 md:mb-6 space-y-2 md:space-y-0">
          <div>
            <Title className="text-blue-100">Historical Trends</Title>
            <Text className="text-blue-300">30-day performance metrics</Text>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-4">
            <Badge color="violet">Attendance</Badge>
            <Badge color="emerald">Revenue</Badge>
            <Badge color="amber">Parking</Badge>
          </div>
        </div>
        <div className="mt-4 h-60 md:h-80 bg-gradient-to-br from-slate-900/90 to-indigo-950/90 backdrop-blur-xl rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={historicalData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333EA" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorConcessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorParking" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#fff" />
              <YAxis stroke="#fff" />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="attendance" stroke="#9333EA" fillOpacity={1} fill="url(#colorAttendance)" />
              <Area type="monotone" dataKey="concessions" stroke="#3B82F6" fillOpacity={1} fill="url(#colorConcessions)" />
              <Area type="monotone" dataKey="parking" stroke="#22C55E" fillOpacity={1} fill="url(#colorParking)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
