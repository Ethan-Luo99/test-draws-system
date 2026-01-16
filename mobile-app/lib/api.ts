import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosResponse } from 'axios';
import { authHelpers } from './supabase';

// Production API URL
const API_BASE_URL = 'https://test-draws-system.vercel.app/api/v1';

// Storage keys
const TOKEN_KEY = 'custom_jwt_token';
const USER_INFO_KEY = 'user_info';
const DEFAULT_BUSINESS_KEY = 'default_business';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await clearAuthData();
      // In a real app, you might emit an event to navigate to login
    }
    return Promise.reject(error);
  }
);

// Token & User Data Management
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    return null;
  }
};

export const storeAuthData = async (data: { token: string, user: any, business?: any }) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(data.user));
    if (data.business) {
      await AsyncStorage.setItem(DEFAULT_BUSINESS_KEY, JSON.stringify(data.business));
    }
  } catch (error) {
    console.error('Error storing auth data:', error);
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_INFO_KEY, DEFAULT_BUSINESS_KEY]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

export const getStoredBusiness = async () => {
  try {
    const data = await AsyncStorage.getItem(DEFAULT_BUSINESS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// Auth Services
export const authApi = {
  // Exchange Supabase token for Backend JWT
  exchangeToken: async (): Promise<any> => {
    try {
      const session = await authHelpers.getSession();
      if (!session?.access_token) {
        throw new Error('No Supabase session found');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/exchange`, {
        supabase_token: session.access_token,
      });

      if (response.data?.custom_token) {
        await storeAuthData({
          token: response.data.custom_token,
          user: response.data.user,
          business: response.data.default_business
        });
        return response.data;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  },
};

// Draw Services
export const drawsApi = {
  // Get draws (auto-injects business_id if not provided)
  getDraws: async (businessId?: string) => {
    try {
      let targetBid = businessId;
      if (!targetBid) {
        const business = await getStoredBusiness();
        targetBid = business?.id;
      }
      
      if (!targetBid) throw new Error('No business ID found');

      const response = await api.get('/draws', { 
        params: { business_id: targetBid } 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get details
  getDrawById: async (id: string) => {
    const response = await api.get(`/draws/${id}`);
    return response.data;
  },

  // Join draw
  joinDraw: async (id: string) => {
    const response = await api.post(`/draws/${id}/participants`);
    return response.data;
  }
};

export default api;
