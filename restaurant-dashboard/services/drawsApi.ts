import axios from 'axios';
import { Alert } from 'react-native';

// Production API URL
const API_BASE_URL = 'https://test-draws-system.vercel.app/api/v1';

// Demo Business ID (Hardcoded for this test project)
export const DEMO_BUSINESS_ID = '00000000-0000-0000-0000-000000000001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Inject Business ID and Auth Token
api.interceptors.request.use(
  (config) => {
    // Always inject X-Business-ID header for restaurant dashboard
    config.headers['X-Business-ID'] = DEMO_BUSINESS_ID;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Network error occurred';
    console.error('API Error:', message);
    Alert.alert('Error', message);
    return Promise.reject(error);
  }
);

export const drawsApi = {
  // Get Restaurant Info
  getRestaurantInfo: () => {
    return api.get('/restaurant/me');
  },

  // Get draws list
  getDraws: (status?: string) => {
    return api.get('/draws', {
      params: { status }, 
    });
  },

  // Create draw
  createDraw: (drawData: any) => {
    return api.post('/draws', drawData);
  },

  // Update draw (Only if no participants)
  updateDraw: (id: string, drawData: any) => {
    return api.put(`/draws/${id}`, drawData);
  },

  // Cancel draw (Only if no participants)
  cancelDraw: (id: string) => {
    return api.post(`/draws/${id}/cancel`);
  },

  // Get draw details
  getDrawById: (id: string) => {
    return api.get(`/draws/${id}`);
  },

  // Get participants list
  getParticipants: (id: string, page = 1) => {
    return api.get(`/draws/${id}/participants`, {
      params: { page }
    });
  },
};

export default api;
