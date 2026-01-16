# 集成文档 (Integration Guide)

## 1. 数据库设计 (Database Schema)

目前系统包含两张核心表，设计简洁，满足基本业务需求。

### `draws` 表 (抽奖活动)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | UUID | 主键 |
| `business_id` | UUID | 商家ID (测试固定为 `DEMO_BUSINESS_ID`) |
| `title` | VARCHAR | 活动标题 |
| `description` | TEXT | 活动描述 |
| `type` | VARCHAR | 类型：`fixed_date` (固定日期) 或 `condition` (条件触发) |
| `trigger_value` | INTEGER | 触发阈值 (仅 `condition` 类型有效，如满10人) |
| `draw_date` | TIMESTAMP | 开奖时间 (仅 `fixed_date` 类型有效) |
| `status` | VARCHAR | 状态：`draft`, `active`, `closed`, `completed` |
| `winner_user_id` | UUID | 获胜者用户ID (开奖后回填) |
| `is_active` | BOOLEAN | 软删除标记 |

### `draw_participants` 表 (参与记录)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | UUID | 主键 |
| `draw_id` | UUID | 关联抽奖活动 |
| `user_id` | UUID | 关联用户 (Supabase User ID) |
| `participated_at` | TIMESTAMP | 参与时间 |
| `is_winner` | BOOLEAN | 是否中奖 |

---

## 2. API 接口概览 (API Overview)

### A. 认证与授权 (Auth)
*   **Token 交换**: `POST /api/v1/auth/exchange`
    *   **输入**: `{ supabase_token: "..." }`
    *   **输出**: `{ custom_token: "...", user: {...}, default_business: {...} }`
    *   **逻辑**: 验证 Supabase Token，签发后端 Custom JWT，同时返回用户信息和默认商家信息。

### B. 餐厅端 (Restaurant Dashboard)
*鉴权方式：Header `X-Business-ID: <DEMO_BUSINESS_ID>`*

1.  **获取商家信息**: `GET /api/v1/restaurant/me`
    *   返回写死的测试商家信息（名称、Logo等）。
2.  **创建抽奖**: `POST /api/v1/draws`
    *   支持 `fixed_date` (带 `draw_date`) 和 `condition` (带 `trigger_value`) 两种类型。
3.  **获取抽奖列表**: `GET /api/v1/draws`
    *   返回该商家的所有活动，包含当前参与人数 (`participant_count`)。
4.  **修改抽奖**: `PUT /api/v1/draws/:id`
    *   **限制**: 仅当没有用户参与时允许修改。
5.  **取消抽奖**: `POST /api/v1/draws/:id/cancel`
    *   **逻辑**: 软取消（将状态置为 `closed`），保留记录。
    *   **限制**: 仅当没有用户参与时允许取消。
6.  **查看参与者**: `GET /api/v1/draws/:id/participants`
    *   分页返回参与者列表。

### C. 用户端 (Mobile App)
*鉴权方式：Header `Authorization: Bearer <Custom_JWT>`*

1.  **获取抽奖列表**: `GET /api/v1/draws?business_id=...`
    *   需传入商家ID（从登录接口的 `default_business` 获取）。
2.  **参与抽奖**: `POST /api/v1/draws/:id/participants`
    *   **逻辑**: 
        *   检查是否重复参与（数据库唯一索引保证）。
        *   参与后自动检查开奖条件（如人数达到阈值）。
        *   如果满足条件，**立即开奖**并在响应中返回中奖信息。
3.  **查看详情**: `GET /api/v1/draws/:id`
    *   **懒加载逻辑**: 每次请求详情时，系统也会检查一次“固定日期”是否过期。如果过期且未开奖，会**自动触发开奖**。

---

## 3. 业务逻辑与代码

1.  **校验逻辑**:
    *   移除了部分针对 `winning_probability` 的严格数学校验，因为在当前业务中它不再是核心概率控制字段（当前逻辑为必中）。
    *   保留了核心的基础校验（如标题、类型必填）。

2.  **冗余清理**:
    *   已清理 `participants.ts` 中旧版的“即时中奖”代码，统一使用 `draw-service.ts` 中的 `checkAndCompleteDraw` 逻辑，确保逻辑收口，避免维护两套开奖代码。

3.  **优化**:
    *   引入了 `X-Business-ID` 机制，彻底解耦了餐厅端的免登录测试流程，使其不再依赖用户系统的 JWT。
    *   新增了修改和取消抽奖的逻辑，并强制校验“无参与者”这一前置条件。
