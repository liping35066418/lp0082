import { Router, type Request, type Response } from 'express';
import { runQuery, runQuerySingle, runExecute } from '../db/init.js';
import type { TeamMember, MemberAssignment, UpdateAssignmentRequest } from '../../shared/types.js';

const router = Router();

interface UserRow {
  id: string;
  name: string;
  role: string;
  avatar: string;
  department: string;
  username: string;
}

interface AssignmentRow {
  id: string;
  member_id: string;
  project_id: string;
  project_name: string;
  node_id: string;
  node_name: string;
  role: string;
}

const userProfiles: Record<string, { title: string; skills: string[] }> = {
  admin1: { title: '科研副院长', skills: ['项目管理', '资源协调', '战略规划'] },
  admin2: { title: '项目主管', skills: ['质量管理', '进度跟踪', '数据分析'] },
  res1: { title: '教授', skills: ['量子计算', '凝聚态物理', '材料表征'] },
  res2: { title: '副教授', skills: ['有机合成', '催化反应', '光谱分析'] },
  res3: { title: '研究员', skills: ['基因编辑', '细胞培养', '生物信息学'] },
  res4: { title: '教授', skills: ['人工智能', '机器学习', '数据挖掘'] },
  res5: { title: '副教授', skills: ['纳米材料', '复合材料', '材料合成'] },
  res6: { title: '研究员', skills: ['环境监测', '废水处理', '生态修复'] },
  res7: { title: '讲师', skills: ['光学工程', '激光技术', '光谱学'] },
  res8: { title: '讲师', skills: ['分析化学', '电化学', '材料表征'] },
};

const mapToMemberAssignment = (row: AssignmentRow): MemberAssignment => {
  return {
    id: row.id,
    memberId: row.member_id,
    projectId: row.project_id,
    projectName: row.project_name,
    nodeId: row.node_id,
    nodeName: row.node_name,
    role: row.role,
  };
};

const getAssignmentsByMemberId = async (memberId: string): Promise<MemberAssignment[]> => {
  const rows = await runQuery<AssignmentRow>(
    `SELECT 
      ma.id,
      ma.member_id,
      ma.project_id,
      p.name as project_name,
      ma.node_id,
      COALESCE(pn.title, '') as node_name,
      ma.role
    FROM member_assignments ma
    LEFT JOIN projects p ON ma.project_id = p.id
    LEFT JOIN project_nodes pn ON ma.node_id = pn.id
    WHERE ma.member_id = ?
    ORDER BY p.name, pn.title`,
    [memberId]
  );
  return rows.map(mapToMemberAssignment);
};

const buildTeamMember = async (userRow: UserRow): Promise<TeamMember> => {
  const assignments = await getAssignmentsByMemberId(userRow.id);
  const currentProjectIds = [...new Set(assignments.map(a => a.projectId))];
  const profile = userProfiles[userRow.id] || { title: '研究员', skills: [] };

  return {
    id: userRow.id,
    name: userRow.name,
    role: userRow.role as 'researcher' | 'admin',
    avatar: userRow.avatar,
    department: userRow.department,
    username: userRow.username,
    title: profile.title,
    skills: profile.skills,
    currentProjectIds,
    workload: assignments.length,
    assignments,
  };
};

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userRows = await runQuery<UserRow>(
      `SELECT id, name, role, avatar, department, username 
       FROM users 
       ORDER BY role, name`
    );

    const teamMembers: TeamMember[] = [];
    for (const userRow of userRows) {
      const member = await buildTeamMember(userRow);
      teamMembers.push(member);
    }

    res.status(200).json({
      success: true,
      data: teamMembers,
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      error: '获取团队信息失败，请稍后重试',
    });
  }
});

router.put('/members/:memberId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;
    const { projectId, nodeId, role } = req.body as UpdateAssignmentRequest;

    if (!projectId || !role) {
      res.status(400).json({
        success: false,
        error: '项目ID和角色不能为空',
      });
      return;
    }

    const memberExists = await runQuerySingle<UserRow>(
      'SELECT id FROM users WHERE id = ?',
      [memberId]
    );

    if (!memberExists) {
      res.status(404).json({
        success: false,
        error: '成员不存在',
      });
      return;
    }

    const projectExists = await runQuerySingle(
      'SELECT id FROM projects WHERE id = ?',
      [projectId]
    );

    if (!projectExists) {
      res.status(404).json({
        success: false,
        error: '项目不存在',
      });
      return;
    }

    if (nodeId) {
      const nodeExists = await runQuerySingle(
        'SELECT id FROM project_nodes WHERE id = ? AND project_id = ?',
        [nodeId, projectId]
      );

      if (!nodeExists) {
        res.status(404).json({
          success: false,
          error: '节点不存在或不属于该项目',
        });
        return;
      }
    }

    let existingAssignment = await runQuerySingle<{ id: string }>(
      `SELECT id FROM member_assignments 
       WHERE member_id = ? AND project_id = ? AND node_id = ?`,
      [memberId, projectId, nodeId || '']
    );

    if (existingAssignment) {
      await runExecute(
        'UPDATE member_assignments SET role = ? WHERE id = ?',
        [role, existingAssignment.id]
      );
    } else {
      const newId = `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await runExecute(
        'INSERT INTO member_assignments (id, member_id, project_id, node_id, role) VALUES (?, ?, ?, ?, ?)',
        [newId, memberId, projectId, nodeId || '', role]
      );
    }

    const updatedMember = await buildTeamMember(memberExists as UserRow);

    res.status(200).json({
      success: true,
      data: updatedMember,
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      error: '调整成员分工失败，请稍后重试',
    });
  }
});

export default router;
