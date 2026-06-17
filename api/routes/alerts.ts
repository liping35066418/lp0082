import { Router, type Request, type Response } from 'express';
import { runQuery } from '../db/init.js';
import type { OverdueAlert } from '../../shared/types.js';

const router = Router();

router.get('/overdue', async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const rows = await runQuery<{
      node_id: string;
      project_id: string;
      project_name: string;
      node_title: string;
      assignee_name: string;
      assignee_avatar: string;
      end_date: string;
    }>(
      `SELECT 
        pn.id as node_id,
        p.id as project_id,
        p.name as project_name,
        pn.title as node_title,
        u.name as assignee_name,
        u.avatar as assignee_avatar,
        pn.end_date
      FROM project_nodes pn
      JOIN projects p ON pn.project_id = p.id
      JOIN users u ON pn.assignee_id = u.id
      WHERE pn.status = 'delayed' OR pn.end_date < ?
      ORDER BY pn.end_date ASC`,
      [todayStr]
    );

    const alerts: OverdueAlert[] = rows.map((row) => {
      const dueDate = new Date(row.end_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - dueDate.getTime();
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: `alert_${row.node_id}`,
        nodeId: row.node_id,
        projectId: row.project_id,
        projectName: row.project_name,
        nodeTitle: row.node_title,
        assigneeName: row.assignee_name,
        assigneeAvatar: row.assignee_avatar,
        dueDate: row.end_date,
        overdueDays: Math.max(0, overdueDays),
        notified: false,
      };
    });

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Get overdue alerts error:', error);
    res.status(500).json({
      success: false,
      error: '获取逾期预警失败，请稍后重试',
    });
  }
});

router.post('/:alertId/notify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { alertId } = req.params;

    if (!alertId) {
      res.status(400).json({
        success: false,
        error: '预警ID不能为空',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        alertId,
        notified: true,
        notifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Notify alert error:', error);
    res.status(500).json({
      success: false,
      error: '标记通知失败，请稍后重试',
    });
  }
});

export default router;
