// restaurant-dashboard/services/drawsApi.ts
import axios from 'axios';
import { Alert } from 'react-native';

// 基础URL（本地开发时指向Vercel dev服务器，后续替换为线上地址）
const API_BASE_URL = 'http://localhost:3000/api/v1';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加鉴权Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token'); // 假设Token存在本地
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    Alert.alert('请求失败', error.response?.data?.error || '网络异常');
    return Promise.reject(error);
  }
);

// 抽奖相关API封装
export const drawsApi = {
  // 获取抽奖列表
  getDraws: (status?: string) => {
    return api.get('/draws', {
      params: { status }, // business_id 会由拦截器自动注入
    });
  },

  // 创建抽奖
  createDraw: (drawData: any) => {
    return api.post('/draws', drawData); // business_id 会由拦截器自动注入
  },

  // 获取抽奖详情
  getDrawById: (id: string) => {
    return api.get(`/draws/${id}`);
  },

  // 获取参与者列表
  getParticipants: (id: string) => {
    return api.get(`/draws/${id}/participants`);
  },
};