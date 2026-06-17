import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { runQuerySingle } from '../db/init.js';
import type { User, LoginRequest, LoginResponse } from '../../shared/types.js';

const router = Router();

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginRequest;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      });
      return;
    }

    const userRow = await runQuerySingle<{
      id: string;
      name: string;
      role: string;
      avatar: string;
      department: string;
      username: string;
      password_hash: string;
    }>(
      'SELECT id, name, role, avatar, department, username, password_hash FROM users WHERE username = ?',
      [username]
    );

    if (!userRow) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
      return;
    }

    const passwordHash = hashPassword(password);
    if (passwordHash !== userRow.password_hash) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
      return;
    }

    const user: User = {
      id: userRow.id,
      name: userRow.name,
      role: userRow.role as 'researcher' | 'admin',
      avatar: userRow.avatar,
      department: userRow.department,
      username: userRow.username,
    };

    const token = generateToken();

    const response: LoginResponse = {
      token,
      user,
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
    });
  }
});

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: '登出成功',
  });
});

export default router;
