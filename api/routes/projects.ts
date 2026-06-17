import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { runQuery, runQuerySingle, runExecute } from '../db/init.js';
import type { Project, ProjectNode, UpdateNodeRequest, CreateNodeRequest } from '../../shared/types.js';

const router = Router();

const generateId = (): string => {
  return crypto.randomBytes(8).toString('hex');
};

const parseJsonField = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const convertNodeRow = (row: {
  id: string;
  project_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  assignee_id: string;
  achievements: string;
  difficulties: string;
  priority: string;
}): ProjectNode => {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as ProjectNode['status'],
    progress: row.progress,
    assigneeId: row.assignee_id,
    achievements: parseJsonField(row.achievements),
    difficulties: parseJsonField(row.difficulties),
    priority: row.priority as ProjectNode['priority'],
  };
};

const convertProjectRow = (row: {
  id: string;
  name: string;
  subject: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  leader_id: string;
}, memberIds: string[], nodes: ProjectNode[] = []): Project => {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as Project['status'],
    progress: row.progress,
    leaderId: row.leader_id,
    memberIds,
    nodes,
  };
};

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, status } = req.query;

    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params: unknown[] = [];

    if (subject) {
      sql += ' AND subject = ?';
      params.push(subject);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY start_date DESC';

    const projectRows = await runQuery<{
      id: string;
      name: string;
      subject: string;
      description: string;
      start_date: string;
      end_date: string;
      status: string;
      progress: number;
      leader_id: string;
    }>(sql, params);

    const projects: Project[] = [];

    for (const projectRow of projectRows) {
      const memberRows = await runQuery<{ member_id: string }>(
        'SELECT DISTINCT member_id FROM member_assignments WHERE project_id = ?',
        [projectRow.id]
      );
      const memberIds = memberRows.map(r => r.member_id);

      const nodeRows = await runQuery<{
        id: string;
        project_id: string;
        title: string;
        description: string;
        start_date: string;
        end_date: string;
        status: string;
        progress: number;
        assignee_id: string;
        achievements: string;
        difficulties: string;
        priority: string;
      }>('SELECT * FROM project_nodes WHERE project_id = ? ORDER BY start_date', [projectRow.id]);

      const nodes = nodeRows.map(convertNodeRow);
      projects.push(convertProjectRow(projectRow, memberIds, nodes));
    }

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: '获取项目列表失败，请稍后重试',
    });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const projectRow = await runQuerySingle<{
      id: string;
      name: string;
      subject: string;
      description: string;
      start_date: string;
      end_date: string;
      status: string;
      progress: number;
      leader_id: string;
    }>('SELECT * FROM projects WHERE id = ?', [id]);

    if (!projectRow) {
      res.status(404).json({
        success: false,
        error: '项目不存在',
      });
      return;
    }

    const memberRows = await runQuery<{ member_id: string }>(
      'SELECT DISTINCT member_id FROM member_assignments WHERE project_id = ?',
      [id]
    );
    const memberIds = memberRows.map(r => r.member_id);

    const nodeRows = await runQuery<{
      id: string;
      project_id: string;
      title: string;
      description: string;
      start_date: string;
      end_date: string;
      status: string;
      progress: number;
      assignee_id: string;
      achievements: string;
      difficulties: string;
      priority: string;
    }>('SELECT * FROM project_nodes WHERE project_id = ? ORDER BY start_date', [id]);

    const nodes = nodeRows.map(convertNodeRow);
    const project = convertProjectRow(projectRow, memberIds, nodes);

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Get project detail error:', error);
    res.status(500).json({
      success: false,
      error: '获取项目详情失败，请稍后重试',
    });
  }
});

router.put('/:id/nodes/:nodeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, nodeId } = req.params;
    const { status, progress, achievements, difficulties } = req.body as UpdateNodeRequest;

    const projectRow = await runQuerySingle<{ id: string }>('SELECT id FROM projects WHERE id = ?', [id]);
    if (!projectRow) {
      res.status(404).json({
        success: false,
        error: '项目不存在',
      });
      return;
    }

    const nodeRow = await runQuerySingle<{ id: string }>(
      'SELECT id FROM project_nodes WHERE id = ? AND project_id = ?',
      [nodeId, id]
    );
    if (!nodeRow) {
      res.status(404).json({
        success: false,
        error: '节点不存在',
      });
      return;
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (progress !== undefined) {
      updates.push('progress = ?');
      params.push(progress);
    }

    if (achievements !== undefined) {
      updates.push('achievements = ?');
      params.push(JSON.stringify(achievements));
    }

    if (difficulties !== undefined) {
      updates.push('difficulties = ?');
      params.push(JSON.stringify(difficulties));
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: '没有提供更新字段',
      });
      return;
    }

    params.push(nodeId, id);

    await runExecute(
      `UPDATE project_nodes SET ${updates.join(', ')} WHERE id = ? AND project_id = ?`,
      params
    );

    const updatedNodeRow = await runQuerySingle<{
      id: string;
      project_id: string;
      title: string;
      description: string;
      start_date: string;
      end_date: string;
      status: string;
      progress: number;
      assignee_id: string;
      achievements: string;
      difficulties: string;
      priority: string;
    }>('SELECT * FROM project_nodes WHERE id = ?', [nodeId]);

    const updatedNode = updatedNodeRow ? convertNodeRow(updatedNodeRow) : null;

    res.status(200).json({
      success: true,
      data: updatedNode,
    });
  } catch (error) {
    console.error('Update node error:', error);
    res.status(500).json({
      success: false,
      error: '更新节点失败，请稍后重试',
    });
  }
});

router.post('/:id/nodes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate, assigneeId, priority } = req.body as CreateNodeRequest;

    if (!title || !startDate || !endDate || !assigneeId || !priority) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      });
      return;
    }

    const projectRow = await runQuerySingle<{ id: string }>('SELECT id FROM projects WHERE id = ?', [id]);
    if (!projectRow) {
      res.status(404).json({
        success: false,
        error: '项目不存在',
      });
      return;
    }

    const nodeId = generateId();

    await runExecute(
      'INSERT INTO project_nodes (id, project_id, title, description, start_date, end_date, status, progress, assignee_id, achievements, difficulties, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nodeId,
        id,
        title,
        description || '',
        startDate,
        endDate,
        'pending',
        0,
        assigneeId,
        JSON.stringify([]),
        JSON.stringify([]),
        priority,
      ]
    );

    await runExecute(
      'INSERT INTO member_assignments (id, member_id, project_id, node_id, role) VALUES (?, ?, ?, ?, ?)',
      [generateId(), assigneeId, id, nodeId, '执行人']
    );

    const newNodeRow = await runQuerySingle<{
      id: string;
      project_id: string;
      title: string;
      description: string;
      start_date: string;
      end_date: string;
      status: string;
      progress: number;
      assignee_id: string;
      achievements: string;
      difficulties: string;
      priority: string;
    }>('SELECT * FROM project_nodes WHERE id = ?', [nodeId]);

    const newNode = newNodeRow ? convertNodeRow(newNodeRow) : null;

    res.status(201).json({
      success: true,
      data: newNode,
    });
  } catch (error) {
    console.error('Create node error:', error);
    res.status(500).json({
      success: false,
      error: '创建节点失败，请稍后重试',
    });
  }
});

export default router;
