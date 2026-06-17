import { useState, useEffect } from 'react';
import {
  Users,
  Edit2,
  X,
  Save,
  Briefcase,
  GraduationCap,
  Loader2,
  GripVertical,
} from 'lucide-react';
import { getProjects } from '../../services/projects';
import { getTeam, updateMemberAssignment } from '../../services/team';
import { formatDate } from '../../utils/format';
import type { Project, TeamMember, UpdateAssignmentRequest } from '../../../shared/types';
import { cn } from '../../lib/utils';

interface EditModalState {
  isOpen: boolean;
  memberId: string;
  memberName: string;
  projectId: string;
  projectName: string;
  currentRole: string;
}

const getWorkloadColor = (workload: number) => {
  if (workload < 30) return 'bg-green-500';
  if (workload < 70) return 'bg-blue-500';
  if (workload <= 100) return 'bg-orange-500';
  return 'bg-red-500';
};

const getWorkloadBgColor = (workload: number) => {
  if (workload < 30) return 'bg-green-50 text-green-700';
  if (workload < 70) return 'bg-blue-50 text-blue-700';
  if (workload <= 100) return 'bg-orange-50 text-orange-700';
  return 'bg-red-50 text-red-700';
};

const roleOptions = [
  { value: '负责人', label: '负责人' },
  { value: '核心研究员', label: '核心研究员' },
  { value: '研究员', label: '研究员' },
  { value: '助理研究员', label: '助理研究员' },
  { value: '实验员', label: '实验员' },
  { value: '数据分析师', label: '数据分析师' },
];

export default function AdminTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editNodeId, setEditNodeId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamData, projectsData] = await Promise.all([
          getTeam(),
          getProjects(),
        ]);
        setTeam(teamData);
        setProjects(projectsData);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getMemberRoleInProject = (member: TeamMember, projectId: string) => {
    const assignment = member.assignments.find(a => a.projectId === projectId);
    return assignment?.role || null;
  };

  const getMemberAssignmentInProject = (member: TeamMember, projectId: string) => {
    return member.assignments.find(a => a.projectId === projectId);
  };

  const handleEditClick = (member: TeamMember, project: Project) => {
    const assignment = getMemberAssignmentInProject(member, project.id);
    setEditModal({
      isOpen: true,
      memberId: member.id,
      memberName: member.name,
      projectId: project.id,
      projectName: project.name,
      currentRole: assignment?.role || '',
    });
    setEditRole(assignment?.role || '');
    setEditNodeId(assignment?.nodeId || project.nodes[0]?.id || '');
  };

  const handleSaveAssignment = async () => {
    if (!editModal || !editRole) return;

    setSaving(true);
    try {
      const updateData: UpdateAssignmentRequest = {
        projectId: editModal.projectId,
        nodeId: editNodeId,
        role: editRole,
      };

      const updatedMember = await updateMemberAssignment(editModal.memberId, updateData);
      setTeam(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      setEditModal(null);
    } catch (error) {
      console.error('保存分工失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setEditModal(null);
    setEditRole('');
    setEditNodeId('');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-72 animate-pulse"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </th>
                  {[1, 2, 3, 4, 5].map(i => (
                    <th key={i} className="px-4 py-4 text-center min-w-[160px]">
                      <div className="h-5 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5].map(j => (
                      <td key={j} className="px-4 py-4 text-center">
                        <div className="h-8 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">人力分配管理</h1>
          <p className="text-gray-500 mt-1">矩阵式查看和调整各课题组人力分配</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">&lt;30%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">30-70%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">70-100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">&gt;100%</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left sticky left-0 bg-gray-50 z-10 min-w-[280px]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Users size={18} className="text-gray-400" />
                    团队成员
                  </div>
                </th>
                {projects.map((project) => (
                  <th
                    key={project.id}
                    className="px-4 py-4 text-center min-w-[180px] border-l border-gray-100"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-semibold text-gray-700 truncate max-w-[160px]" title={project.name}>
                        {project.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(project.startDate)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.map((member, idx) => (
                <tr
                  key={member.id}
                  className={cn(
                    'border-b border-gray-50 hover:bg-gray-50 transition-colors',
                    idx % 2 === 0 && 'bg-white',
                    idx % 2 === 1 && 'bg-gray-50/30'
                  )}
                >
                  <td className="px-6 py-4 sticky left-0 z-10 bg-inherit">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                        <div
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white',
                            getWorkloadColor(member.workload)
                          )}
                        >
                          {member.workload >= 100 ? '!' : member.workload}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800">{member.name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <GraduationCap size={12} className="text-gray-400" />
                          <span>{member.title}</span>
                          <span className="text-gray-300">|</span>
                          <Briefcase size={12} className="text-gray-400" />
                          <span>{member.department}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {member.skills.slice(0, 3).map((skill, skillIdx) => (
                            <span
                              key={skillIdx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {member.skills.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">
                              +{member.skills.length - 3}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">工作量</span>
                            <span className={cn('font-medium', getWorkloadBgColor(member.workload).split(' ')[1])}>
                              {member.workload}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-500', getWorkloadColor(member.workload))}
                              style={{ width: `${Math.min(member.workload, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  {projects.map((project) => {
                    const role = getMemberRoleInProject(member, project.id);
                    return (
                      <td
                        key={project.id}
                        className="px-4 py-4 text-center border-l border-gray-100"
                      >
                        {role ? (
                          <div className="flex flex-col items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 text-xs font-medium rounded-lg">
                              <GripVertical size={12} className="text-blue-400" />
                              {role}
                            </span>
                            <button
                              onClick={() => handleEditClick(member, project)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="调整分工"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-xs text-gray-300">未分配</span>
                            <button
                              onClick={() => handleEditClick(member, project)}
                              className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="分配任务"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">调整分工</h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    <img
                      src={team.find(m => m.id === editModal.memberId)?.avatar}
                      alt={editModal.memberName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{editModal.memberName}</p>
                    <p className="text-sm text-gray-500">{team.find(m => m.id === editModal.memberId)?.title}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  项目: <span className="font-medium text-gray-800">{editModal.projectName}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目角色
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">请选择角色</option>
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  负责节点
                </label>
                <select
                  value={editNodeId}
                  onChange={(e) => setEditNodeId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  {projects.find(p => p.id === editModal.projectId)?.nodes.map(node => (
                    <option key={node.id} value={node.id}>
                      {node.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveAssignment}
                disabled={!editRole || saving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
