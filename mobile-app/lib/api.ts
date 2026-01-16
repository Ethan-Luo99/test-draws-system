// mobile-app/lib/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosResponse } from 'axios';
import { authHelpers } from './supabase';

// API configuration / Configuration API
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Storage keys / Clés de stockage
const TOKEN_KEY = 'custom_jwt_token';

// Create axios instance / Créer l'instance axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token / Intercepteur de requête: Ajouter le token d'auth
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

// Response interceptor: Handle errors / Intercepteur de réponse: Gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid / Token expiré ou invalide
      await clearStoredToken();
      // You might want to trigger a re-login here / Vous pourriez vouloir déclencher une re-connexion ici
    }
    return Promise.reject(error);
  }
);

// Token management functions / Fonctions de gestion des tokens
export const getStoredToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
};

export const clearStoredToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing stored token:', error);
  }
};

// Token exchange with backend / Échange de token avec le backend
export const exchangeSupabaseTokenForCustomJWT = async (): Promise<string> => {
  try {
    // Get current Supabase session / Obtenir la session Supabase actuelle
    const session = await authHelpers.getSession();
    if (!session?.access_token) {
      throw new Error('No Supabase session found / Aucune session Supabase trouvée');
    }

    // Exchange Supabase token for custom JWT / Échanger le token Supabase pour un JWT personnalisé
    const response = await axios.post(`${API_BASE_URL}/auth/exchange`, {
      supabase_token: session.access_token,
    });

    if (response.data?.custom_token) {
      await storeToken(response.data.custom_token);
      return response.data.custom_token;
    } else {
      throw new Error('No custom token received / Aucun token personnalisé reçu');
    }
  } catch (error) {
    console.error('Token exchange failed:', error);
    throw new Error('Token exchange failed / Échec de l\'échange de token');
  }
};

// API service functions / Fonctions de service API
export const drawsApi = {
  // Get draws list / Obtenir la liste des tirages
  getDraws: async (businessId?: string, status?: string) => {
    try {
      const params: any = {};
      if (businessId) params.business_id = businessId;
      if (status) params.status = status;

      const response: AxiosResponse = await api.get('/draws', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching draws:', error);
      throw error;
    }
  },

  // Create a new draw / Créer un nouveau tirage
  createDraw: async (drawData: any) => {
    try {
      const response: AxiosResponse = await api.post('/draws', drawData);
      return response.data;
    } catch (error) {
      console.error('Error creating draw:', error);
      throw error;
    }
  },

  // Get draw details / Obtenir les détails du tirage
  getDrawById: async (id: string) => {
    try {
      const response: AxiosResponse = await api.get(`/draws/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching draw:', error);
      throw error;
    }
  },

  // Update a draw / Mettre à jour un tirage
  updateDraw: async (id: string, drawData: any) => {
    try {
      const response: AxiosResponse = await api.put(`/draws/${id}`, drawData);
      return response.data;
    } catch (error) {
      console.error('Error updating draw:', error);
      throw error;
    }
  },

  // Delete a draw / Supprimer un tirage
  deleteDraw: async (id: string) => {
    try {
      const response: AxiosResponse = await api.delete(`/draws/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting draw:', error);
      throw error;
    }
  },

  // Get participants for a draw / Obtenir les participants pour un tirage
  getDrawParticipants: async (id: string, page = 1, limit = 20) => {
    try {
      const response: AxiosResponse = await api.get(`/draws/${id}/participants`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching participants:', error);
      throw error;
    }
  },

  // Participate in a draw / Participer à un tirage
  participateInDraw: async (id: string) => {
    try {
      const response: AxiosResponse = await api.post(`/draws/${id}/participants`);
      return response.data;
    } catch (error) {
      console.error('Error participating in draw:', error);
      throw error;
    }
  },
};

// Auth service functions / Fonctions de service d'authentification
export const authApi = {
  // Check if token exchange is needed / Vérifier si l'échange de token est nécessaire
  ensureValidToken: async (): Promise<boolean> => {
    try {
      const storedToken = await getStoredToken();
      
      if (!storedToken) {
        // Need to exchange Supabase token for custom JWT / Besoin d'échanger le token Supabase pour un JWT personnalisé
        await exchangeSupabaseTokenForCustomJWT();
        return true;
      }

      // Verify token is still valid (you could add a token validation endpoint)
      // Vérifier que le token est toujours valide (vous pourriez ajouter un point de terminaison de validation de token)
      return true;
    } catch (error) {
      console.error('Error ensuring valid token:', error);
      return false;
    }
  },

  // Refresh custom JWT token / Actualiser le token JWT personnalisé
  refreshCustomToken: async (): Promise<string> => {
    await exchangeSupabaseTokenForCustomJWT();
    return getStoredToken() as Promise<string>;
  },

  // Clear all auth data / Effacer toutes les données d'authentification
  clearAuthData: async (): Promise<void> => {
    await clearStoredToken();
    // Also clear Supabase session / Également effacer la session Supabase
    await authHelpers.signOut();
  },
};

export default api;
