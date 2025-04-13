import { io } from 'socket.io-client';

// Socket.io client for real-time updates
export const socket = io('http://localhost:3001', {
  autoConnect: false,
});

// Mock API client
export const api = {
  predictions: {
    getConcessionsForecast: async () => ({
      data: {
        forecast: 300000,
      },
    }),
    getParkingForecast: async () => ({
      data: {
        forecast: 15000,
      },
    }),
    getAttendanceForecast: async () => ({
      data: {
        expected: 60725,
      },
    }),
  },
  analytics: {
    getHistoricalData: async (startDate: string, endDate: string) => {
      // Generate mock historical data
      const data = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          attendance: 45000 + Math.random() * 20000,
          concessions: 180000 + Math.random() * 100000,
          parking: 8000 + Math.random() * 4000,
        };
      });

      return { data };
    },
  },
};
