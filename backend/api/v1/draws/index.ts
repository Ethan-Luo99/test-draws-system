// backend/api/v1/draws/index.ts
import express from 'express';
import { authenticate } from '../../../lib/auth.js';
import { query } from '../../../lib/db.js';

const router = express.Router();

// 1. 获取抽奖列表（需鉴权）
router.get('/', authenticate, async (req, res) => {
  try {
    const { business_id, status } = req.query;
    let sql = 'SELECT * FROM draws WHERE business_id = $1';
    const params = [business_id];

    // 可选：按状态过滤
    if (status) {
      sql += ' AND status = $2';
      params.push(status);
    }

    const result = await query(sql, params);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '获取抽奖列表失败', details: err });
  }
});

// 2. 创建抽奖（需鉴权）
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, type, draw_date, winning_probability, business_id } = req.body;

    // 校验必填字段
    if (!title || !type || !business_id) {
      return res.status(400).json({ error: '标题、类型、餐厅ID为必填项' });
    }

    // 插入数据库
    const sql = `
      INSERT INTO draws (title, description, type, draw_date, winning_probability, business_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [title, description, type, draw_date, winning_probability, business_id];
    const result = await query(sql, params);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '创建抽奖失败', details: err });
  }
});

export default router;