import { useMemo } from 'react';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 relative">
        {/* Attendance Card */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-900/90 to-indigo-950/90 backdrop-blur-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-blue-100">Attendance</h2>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-{attendanceStatus.color}-500/20 text-{attendanceStatus.color}-400">{attendanceStatus.text}</span>
          </div>
          <div className="mt-4">
            <span className="text-sm font-medium text-blue-200">Current</span>
            <span className="text-2xl font-semibold text-blue-400">{formatNumber(attendance)}</span>
          </div>
          <div className="mt-4 h-48 sm:h-52 lg:h-56 -mx-2 sm:-mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Present', value: attendance, fill: '#60A5FA' },
                    { name: 'Expected', value: expectedAttendance, fill: '#1E40AF' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  dataKey="value"
                  nameKey="name"
                >
                  <Tooltip formatter={formatNumber} />
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-blue-200">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-slate-400 text-center">
            <span>Target: {formatNumber(expectedAttendance)}</span>
          </div>
        </div>

        {/* Concessions Card */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-900/90 to-indigo-950/90 backdrop-blur-xl">
          <h2 className="text-blue-100">Concessions Revenue</h2>
          <div className="mt-4">
            <span className="text-sm font-medium text-blue-200">Current Sales</span>
            <span className="text-purple-400">{formatCurrency(concessions.sales)}</span>
          </div>
          <div className="mt-4 h-48 sm:h-52 lg:h-56 -mx-2 sm:-mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: 'Sales',
                    Current: concessions.sales,
                    Forecast: predictions?.concessions?.data?.forecast || 0,
                  },
                ]}
                margin={{ top: 10, right: 30, left: 30, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={formatCurrency} />
                <Legend />
                <Bar dataKey="Current" fill="#9333EA" />
                <Bar dataKey="Forecast" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-slate-400 flex justify-between">
            <span>Items Sold: {Object.values(concessions.inventory).reduce((a, b) => a + b, 0)}</span>
            <span>Average per Person: {formatCurrency(concessions.sales / attendance)}</span>
          </div>
        </div>

        {/* Parking Card */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-900/90 to-indigo-950/90 backdrop-blur-xl">
          <h2 className="text-blue-100">Parking Availability</h2>
          <div className="mt-4">
            <div>
              <span className="text-sm font-medium text-blue-200">Spaces Available</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-semibold text-emerald-400">{formatNumber(parking.available)}</span>
                <span className="text-sm text-slate-400">of {formatNumber(parking.available + parking.occupied)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-green-200">Occupied</span>
              <div className="text-xl font-semibold text-green-600 mt-1">{formatNumber(parking.occupied)}</div>
            </div>
          </div>
          <div className="mt-4 h-48 sm:h-52 lg:h-56 -mx-2 sm:-mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Available', value: parking.available, fill: '#4ADE80' },
                    { name: 'Occupied', value: parking.occupied, fill: '#065F46' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  dataKey="value"
                  nameKey="name"
                  startAngle={90}
                  endAngle={450}
                >
                  <Tooltip
                    formatter={(value) => formatNumber(value as number)}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-green-200">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-sm text-green-200">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-900"></div>
                <span className="text-sm text-green-200">Occupied</span>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">Utilization: </span>
              <span className={`font-medium ${parking.occupied / (parking.available + parking.occupied) > 0.85 ? 'text-amber-400' : 'text-green-400'}`}>
                {Math.round((parking.occupied / (parking.available + parking.occupied)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Trends */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-slate-900/90 to-indigo-950/90 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row justify-between items-start mb-4 md:mb-6 space-y-2 md:space-y-0">
          <div>
            <h2 className="text-blue-100">Historical Trends</h2>
            <span className="text-blue-300">30-day performance metrics</span>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-4">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-violet-500/20 text-violet-400">Attendance</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">Good</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">Parking</span>
          </div>
        </div>
        <div className="mt-4 h-56 sm:h-64 lg:h-80 bg-gradient-to-br from-slate-900/90 to-indigo-950/90 backdrop-blur-xl rounded-lg p-4 sm:p-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={historicalData}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
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
      </div>
    </div>
  );
}
