import { useState, useEffect } from 'react';
import {
  ListTodo,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Calendar,
  User,
  Flag,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { getProjects, createNode, updateNode } from '../../services/projects';
import { getTeam } from '../../services/team';
import { useAppStore } from '../../store/appStore';
import {
  formatDate,
  getStatusColor,
  getPriorityText,
  getPriorityColor,
} from '../../utils/format';
import type {
  Project,
  ProjectNode,
  TeamMember,
  CreateNodeRequest,
  UpdateNodeRequest,
  NodeStatus,
  Priority,
} from '../../../shared/types';
import { cn } from '../../lib/utils';

interface TaskModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  projectId: string;
  nodeId?: string;
  defaultValues?: Partial<ProjectNode>;
}

interface FormErrors {
  title?: string;
  startDate?: string;
  endDate?: string;
  assigneeId?: string;
  priority?: string;
}

const statusOptions: { value: NodeStatus; label: string }[] = [
  { value: 'pending', label: '待开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'delayed', label: '已逾期' },
];

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
];

const isOverdue = (endDate: string, status: string) => {
  if (status === 'completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return end < today;
};

export default function AdminTasks() {
  const { selectedSubject, selectedStatus } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [taskModal, setTaskModal] = useState<TaskModalState | null>(null);
  const [formData, setFormData] = useState<Partial<CreateNodeRequest>>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ projectId: string; nodeId: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, teamData] = await Promise.all([
          getProjects(selectedSubject || undefined, selectedStatus || undefined),
          getTeam(),
        ]);
        setProjects(projectsData);
        setTeam(teamData);
        setExpandedProjects(new Set(projectsData.filter(p => p.nodes.length > 0).map(p => p.id)));
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedSubject, selectedStatus]);

  const getMemberById = (id: string) => team.find(m => m.id === id);

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.title?.trim()) {
      errors.title = '请输入任务标题';
    }
    if (!formData.startDate) {
      errors.startDate = '请选择开始日期';
    }
    if (!formData.endDate) {
      errors.endDate = '请选择截止日期';
    }
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errors.endDate = '截止日期不能早于开始日期';
    }
    if (!formData.assigneeId) {
      errors.assigneeId = '请选择负责人';
    }
    if (!formData.priority) {
      errors.priority = '请选择优先级';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreateModal = (projectId: string) => {
    setTaskModal({
      isOpen: true,
      mode: 'create',
      projectId,
    });
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      assigneeId: '',
      priority: 'medium',
    });
    setFormErrors({});
  };

  const handleOpenEditModal = (projectId: string, node: ProjectNode) => {
    setTaskModal({
      isOpen: true,
      mode: 'edit',
      projectId,
      nodeId: node.id,
      defaultValues: node,
    });
    setFormData({
      title: node.title,
      description: node.description,
      startDate: node.startDate,
      endDate: node.endDate,
      assigneeId: node.assigneeId,
      priority: node.priority,
    });
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setTaskModal(null);
    setFormData({});
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!taskModal || !validateForm()) return;

    setSubmitting(true);
    try {
      if (taskModal.mode === 'create') {
        const newNode = await createNode(taskModal.projectId, formData as CreateNodeRequest);
        setProjects(prev => prev.map(p =>
          p.id === taskModal.projectId
            ? { ...p, nodes: [...p.nodes, newNode] }
            : p
        ));
      } else if (taskModal.mode === 'edit' && taskModal.nodeId) {
        const updateData: UpdateNodeRequest = {
          status: taskModal.defaultValues?.status,
          progress: taskModal.defaultValues?.progress,
          achievements: taskModal.defaultValues?.achievements,
          difficulties: taskModal.defaultValues?.difficulties,
        };
        const updatedNode = await updateNode(taskModal.projectId, taskModal.nodeId, updateData);
        setProjects(prev => prev.map(p =>
          p.id === taskModal.projectId
            ? {
                ...p,
                nodes: p.nodes.map(n =>
                  n.id === taskModal.nodeId
                    ? { ...n, ...formData, ...updatedNode }
                    : n
                ),
              }
            : p
        ));
      }
      handleCloseModal();
    } catch (error) {
      console.error('保存任务失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (projectId: string, nodeId: string, newStatus: NodeStatus) => {
    try {
      const updateData: UpdateNodeRequest = { status: newStatus };
      const updatedNode = await updateNode(projectId, nodeId, updateData);
      setProjects(prev => prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              nodes: p.nodes.map(n =>
                n.id === nodeId ? { ...n, ...updatedNode } : n
              ),
            }
          : p
      ));
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const handleDelete = async (projectId: string, nodeId: string) => {
    try {
      setProjects(prev => prev.map(p =>
        p.id === projectId
          ? { ...p, nodes: p.nodes.filter(n => n.id !== nodeId) }
          : p
      ));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('删除任务失败:', error);
    }
  };

  const totalTasks = projects.reduce((sum, p) => sum + p.nodes.length, 0);
  const completedTasks = projects.reduce(
    (sum, p) => sum + p.nodes.filter(n => n.status === 'completed').length,
    0
  );
  const overdueTasks = projects.reduce(
    (sum, p) => sum + p.nodes.filter(n => isOverdue(n.endDate, n.status)).length,
    0
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-72 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">实验任务管理</h1>
          <p className="text-gray-500 mt-1">按项目分组管理所有实验任务</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50">
              <ListTodo size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总任务数</p>
              <p className="text-2xl font-bold text-gray-800">{totalTasks}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-gray-800">{completedTasks}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已逾期</p>
              <p className="text-2xl font-bold text-gray-800">{overdueTasks}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <ListTodo size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无项目任务</p>
          </div>
        ) : (
          projects.map((project) => {
            const isExpanded = expandedProjects.has(project.id);
            const overdueCount = project.nodes.filter(n => isOverdue(n.endDate, n.status)).length;

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleProjectExpand(project.id)}
                >
                  <div className="flex items-center gap-4">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          {project.subject}
                        </span>
                        {overdueCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {overdueCount} 项逾期
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        共 {project.nodes.length} 个任务
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreateModal(project.id);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all"
                    >
                      <Plus size={16} />
                      新增任务
                    </button>
                  </div>
                </div>

                {isExpanded && project.nodes.length > 0 && (
                  <div className="border-t border-gray-100">
                    {project.nodes.map((node, idx) => {
                      const assignee = getMemberById(node.assigneeId);
                      const overdue = isOverdue(node.endDate, node.status);

                      return (
                        <div
                          key={node.id}
                          className={cn(
                            'flex items-center justify-between p-5 border-b border-gray-50 last:border-b-0 transition-all',
                            idx % 2 === 1 && 'bg-gray-50/50',
                            overdue && 'border-2 border-red-300 bg-red-50/30',
                            overdue && 'animate-[breathe_2s_ease-in-out_infinite]'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-800 truncate">{node.title}</h4>
                              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', getPriorityColor(node.priority))}>
                                <Flag size={10} className="inline mr-1" />
                                {getPriorityText(node.priority)}
                              </span>
                              {overdue && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                                  <AlertTriangle size={10} />
                                  已逾期
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <User size={14} className="text-gray-400" />
                                {assignee ? (
                                  <div className="flex items-center gap-1.5">
                                    <img
                                      src={assignee.avatar}
                                      alt={assignee.name}
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                    <span>{assignee.name}</span>
                                  </div>
                                ) : (
                                  <span>未分配</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-gray-400" />
                                <span>{formatDate(node.startDate)} ~ {formatDate(node.endDate)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock size={14} className="text-gray-400" />
                                <span>进度: {node.progress}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            <select
                              value={node.status}
                              onChange={(e) => handleStatusChange(project.id, node.id, e.target.value as NodeStatus)}
                              className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none',
                                getStatusColor(node.status)
                              )}
                            >
                              {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => handleOpenEditModal(project.id, node)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="编辑"
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                              onClick={() => setDeleteConfirm({ projectId: project.id, nodeId: node.id })}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isExpanded && project.nodes.length === 0 && (
                  <div className="border-t border-gray-100 p-8 text-center">
                    <ListTodo size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">暂无任务，点击上方按钮添加</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {taskModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {taskModal.mode === 'create' ? '新增任务' : '编辑任务'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, title: e.target.value }));
                    if (formErrors.title) setFormErrors(prev => ({ ...prev, title: undefined }));
                  }}
                  placeholder="请输入任务标题"
                  className={cn(
                    'w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all',
                    formErrors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                  )}
                />
                {formErrors.title && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务描述
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入任务描述（可选）"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    开始日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, startDate: e.target.value }));
                      if (formErrors.startDate) setFormErrors(prev => ({ ...prev, startDate: undefined }));
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all',
                      formErrors.startDate ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    )}
                  />
                  {formErrors.startDate && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.startDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    截止日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, endDate: e.target.value }));
                      if (formErrors.endDate) setFormErrors(prev => ({ ...prev, endDate: undefined }));
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all',
                      formErrors.endDate ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    )}
                  />
                  {formErrors.endDate && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.endDate}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  负责人 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assigneeId || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, assigneeId: e.target.value }));
                    if (formErrors.assigneeId) setFormErrors(prev => ({ ...prev, assigneeId: undefined }));
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all',
                    formErrors.assigneeId ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                  )}
                >
                  <option value="">请选择负责人</option>
                  {team.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.title}
                    </option>
                  ))}
                </select>
                {formErrors.assigneeId && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.assigneeId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {priorityOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, priority: option.value }));
                        if (formErrors.priority) setFormErrors(prev => ({ ...prev, priority: undefined }));
                      }}
                      className={cn(
                        'flex-1 px-4 py-2.5 rounded-xl border-2 font-medium transition-all',
                        formData.priority === option.value
                          ? getPriorityColor(option.value) + ' border-transparent'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      <Flag size={14} className="inline mr-1.5" />
                      {option.label}
                    </button>
                  ))}
                </div>
                {formErrors.priority && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.priority}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {taskModal.mode === 'create' ? '创建' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">确认删除</h3>
                <p className="text-sm text-gray-500">此操作不可撤销</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              确定要删除这个任务吗？删除后将无法恢复。
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.projectId, deleteConfirm.nodeId)}
                className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
