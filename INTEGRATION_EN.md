# Integration Guide

## 1. Database Schema

The system currently includes two core tables, designed to be simple and meet basic business requirements.

### `draws` Table (Lucky Draws)
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `business_id` | UUID | Business ID (Fixed as `DEMO_BUSINESS_ID` for testing) |
| `title` | VARCHAR | Event Title |
| `description` | TEXT | Event Description |
| `type` | VARCHAR | Type: `fixed_date` (Fixed Date) or `condition` (Condition Triggered) |
| `trigger_value` | INTEGER | Trigger Threshold (Valid only for `condition` type, e.g., 10 participants) |
| `draw_date` | TIMESTAMP | Draw Time (Valid only for `fixed_date` type) |
| `status` | VARCHAR | Status: `draft`, `active`, `closed`, `completed` |
| `winner_user_id` | UUID | Winner User ID (Filled after the draw) |
| `is_active` | BOOLEAN | Soft Delete Flag |

### `draw_participants` Table (Participation Records)
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `draw_id` | UUID | Associated Draw Event |
| `user_id` | UUID | Associated User (Supabase User ID) |
| `participated_at` | TIMESTAMP | Participation Time |
| `is_winner` | BOOLEAN | Is Winner |

---

## 2. API Overview

### A. Authentication & Authorization (Auth)
*   **Token Exchange**: `POST /api/v1/auth/exchange`
    *   **Input**: `{ supabase_token: "..." }`
    *   **Output**: `{ custom_token: "...", user: {...}, default_business: {...} }`
    *   **Logic**: Validates Supabase Token, issues backend Custom JWT, and returns user info and default business info.

### B. Restaurant Dashboard
*Auth Method: Header `X-Business-ID: <DEMO_BUSINESS_ID>`*

1.  **Get Business Info**: `GET /api/v1/restaurant/me`
    *   Returns hardcoded test business info (Name, Logo, etc.).
2.  **Create Draw**: `POST /api/v1/draws`
    *   Supports `fixed_date` (with `draw_date`) and `condition` (with `trigger_value`) types.
3.  **Get Draw List**: `GET /api/v1/draws`
    *   Returns all events for the business, including current participant count (`participant_count`).
4.  **Update Draw**: `PUT /api/v1/draws/:id`
    *   **Restriction**: Allowed only when there are no participants.
5.  **Cancel Draw**: `POST /api/v1/draws/:id/cancel`
    *   **Logic**: Soft cancel (sets status to `closed`), keeps the record.
    *   **Restriction**: Allowed only when there are no participants.
6.  **View Participants**: `GET /api/v1/draws/:id/participants`
    *   Returns a paginated list of participants.

### C. Mobile App (User)
*Auth Method: Header `Authorization: Bearer <Custom_JWT>`*

1.  **Get Draw List**: `GET /api/v1/draws?business_id=...`
    *   Requires Business ID (obtained from the `default_business` in the login response).
2.  **Join Draw**: `POST /api/v1/draws/:id/participants`
    *   **Logic**: 
        *   Checks for duplicate participation (guaranteed by database unique index).
        *   Automatically checks draw conditions (e.g., participant count reached) after joining.
        *   If conditions are met, **triggers the draw immediately** and returns the result in the response.
3.  **View Details**: `GET /api/v1/draws/:id`
    *   **Lazy Load Logic**: Every time details are requested, the system checks if the "fixed date" has passed. If passed and not drawn, it **automatically triggers the draw**.

---

## 3. Business Logic & Code

1.  **Validation Logic**:
    *   Removed some strict mathematical validation for `winning_probability` because it is no longer a core probability control field in the current business logic (current logic is "must win" or specific rules).
    *   Retained core basic validation (e.g., Title, Type are required).

2.  **Redundancy Cleanup**:
    *   Cleaned up old "instant win" code in `participants.ts` and unified it to use the `checkAndCompleteDraw` logic in `draw-service.ts`. This ensures logic centralization and avoids maintaining two sets of draw code.

3.  **Optimizations**:
    *   Introduced `X-Business-ID` mechanism, completely decoupling the restaurant dashboard's login-free test flow from the user system's JWT.
    *   Added logic for modifying and canceling draws, enforcing the "no participants" precondition.
