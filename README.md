# Test Draws System (测试抽奖系统)

这是一个全栈测试项目，旨在演示餐厅抽奖系统的核心流程。

## 项目结构 (Project Structure)

- `backend/`: Node.js Express API + PostgreSQL
- `mobile-app/`: React Native (Expo) 用户端 App
- `restaurant-dashboard/`: React Native (Expo) 餐厅管理端 App

## 核心流程 (Core Workflow)

1.  **餐厅后台** → 创建抽奖活动 (支持固定时间开奖或满人开奖)。
2.  **用户 App** → 登录后在餐厅页面看到抽奖活动。
3.  **用户 App** → 点击“我要参与”，系统记录参与。
    *   *注：同一用户同一活动只能参与一次。*
    *   *注：如果满足开奖条件（如第 N 个参与者），系统自动开奖。*
4.  **餐厅后台** → 查看参与者列表和活动总人数。
5.  **餐厅后台** → 可修改或取消尚未开始（无参与者）的活动。

## 技术架构 (Architecture)

### 后端 (Backend)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Auth**: Supabase (客户端认证) + Custom JWT (服务端会话)

### 数据库设计 (Database)
见 [INTEGRATION.md](./INTEGRATION.md) 详细描述。

### 鉴权流程 (Authentication)

1.  **用户登录 (Mobile App)**
    *   App 使用 Supabase SDK 登录。
    *   调用 `POST /api/v1/auth/exchange` 换取后端 JWT。
    *   接口同时返回 `default_business` (默认商家信息)，方便 App 展示。

2.  **餐厅免登录 (Dashboard)**
    *   **测试模式**: 餐厅端无需登录。
    *   通过 Header `X-Business-ID: <DEMO_BUSINESS_ID>` 进行身份识别。
    *   后端自动放行带有正确 Header 的请求。

## 快速开始 (Quick Start)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Mobile App
```bash
cd mobile-app
npm install
npx expo start
```

### Restaurant Dashboard
```bash
cd restaurant-dashboard
npm install
npx expo start
```
