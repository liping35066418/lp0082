import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Circle,
  CircleCheck,
  CircleAlert,
  Clock,
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Edit,
  Plus,
} from 'lucide-react';
import type { ProjectNode, User, UpdateNodeRequest } from '../../shared/types';
import { updateNode } from '../services/projects';

interface TimelineProps {
  nodes: ProjectNode[];
  users: User[];
  editable?: boolean;
  initialExpandedNodeId?: string | null;
}

const statusConfig = {
  pending: {
    color: 'bg-gray-400',
    textColor: 'text-gray-500',
    label: '待开始',
    Icon: Clock,
    lineColor: 'from-gray-300 to-gray-400',
  },
  in_progress: {
    color: 'bg-warning',
    textColor: 'text-warning',
    label: '进行中',
    Icon: Circle,
    lineColor: 'from-warning to-orange-400',
  },
  completed: {
    color: 'bg-success',
    textColor: 'text-success',
    label: '已完成',
    Icon: CircleCheck,
    lineColor: 'from-success to-green-400',
  },
  delayed: {
    color: 'bg-danger',
    textColor: 'text-danger',
    label: '已逾期',
    Icon: CircleAlert,
    lineColor: 'from-danger to-red-400',
  },
};

const priorityConfig = {
  high: { color: 'bg-danger/10 text-danger border-danger/30', label: '高优先级' },
  medium: { color: 'bg-warning/10 text-warning border-warning/30', label: '中优先级' },
  low: { color: 'bg-gray-100 text-gray-600 border-gray-200', label: '低优先级' },
};

export default function Timeline({ nodes, users, editable = false, initialExpandedNodeId = null }: TimelineProps) {
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(initialExpandedNodeId);
  const [editingNode, setEditingNode] = useState<{
    node: ProjectNode;
    type: 'progress' | 'achievement' | 'difficulty';
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    if (initialExpandedNodeId) {
      setExpandedNodeId(initialExpandedNodeId);
    }
  }, [initialExpandedNodeId]);

  const getUser = (userId: string) => users.find((u) => u.id === userId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodeId(expandedNodeId === nodeId ? null : nodeId);
  };

  const openEditModal = (node: ProjectNode, type: 'progress' | 'achievement' | 'difficulty') => {
    setEditingNode({ node, type });
    if (type === 'progress') {
      setProgressValue(node.progress);
    } else {
      setEditValue('');
    }
  };

  const closeEditModal = () => {
    setEditingNode(null);
    setEditValue('');
  };

  const handleSave = async () => {
    if (!editingNode) return;

    const { node, type } = editingNode;
    let updateData: UpdateNodeRequest = {};

    if (type === 'progress') {
      let status = node.status;
      if (progressValue >= 100) {
        status = 'completed';
      } else if (progressValue > 0 && node.status === 'pending') {
        status = 'in_progress';
      }
      updateData = { progress: progressValue, status };
    } else if (type === 'achievement') {
      if (!editValue.trim()) return;
      updateData = { achievements: [...node.achievements, editValue.trim()] };
    } else if (type === 'difficulty') {
      if (!editValue.trim()) return;
      updateData = { difficulties: [...node.difficulties, editValue.trim()] };
    }

    try {
      await updateNode(node.projectId, node.id, updateData);
      closeEditModal();
    } catch (error) {
      console.error('更新节点失败:', error);
    }
  };

  const getProgressColor = (progress: number, status: ProjectNode['status']) => {
    if (status === 'delayed') return 'bg-danger';
    if (progress >= 100) return 'bg-success';
    if (progress > 50) return 'bg-warning';
    return 'bg-primary-500';
  };

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-gray-200 to-gray-100" />

      <div className="space-y-6">
        {nodes.map((node, index) => {
          const status = statusConfig[node.status];
          const priority = priorityConfig[node.priority];
          const assignee = getUser(node.assigneeId);
          const isExpanded = expandedNodeId === node.id;
          const isLast = index === nodes.length - 1;
          const StatusIcon = status.Icon;

          return (
            <div key={node.id} className="relative pl-16">
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-6 top-12 w-0.5 h-[calc(100%-3rem)] bg-gradient-to-b',
                    status.lineColor,
                    'opacity-60'
                  )}
                />
              )}

              <div
                className={cn(
                  'absolute left-4 top-2 w-5 h-5 rounded-full border-4 border-white z-10',
                  status.color,
                  node.status === 'delayed' && 'animate-pulse-slow shadow-lg shadow-danger/50'
                )}
              >
                <StatusIcon
                  className={cn(
                    'absolute -top-[3px] -left-[3px] w-[22px] h-[22px]',
                    status.textColor
                  )}
                />
              </div>

              <div
                className={cn(
                  'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
                  'shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300',
                  'overflow-hidden',
                  node.status === 'delayed' && 'border-danger/50 shadow-danger/10'
                )}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpand(node.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {node.title}
                        </h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-full border',
                            priority.color
                          )}
                        >
                          {priority.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(node.startDate)} - {formatDate(node.endDate)}
                        </span>
                        {assignee && (
                          <span className="flex items-center gap-1">
                            <img
                              src={assignee.avatar}
                              alt={assignee.name}
                              className="w-4 h-4 rounded-full"
                            />
                            {assignee.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              getProgressColor(node.progress, node.status)
                            )}
                            style={{ width: `${Math.min(node.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
                          {node.progress}%
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            status.color,
                            'text-white'
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-4">
                      {node.description}
                    </p>

                    {node.achievements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4 text-success" />
                          成果
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {node.achievements.map((achievement, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-xs bg-success/10 text-success rounded-full border border-success/20"
                            >
                              {achievement}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {node.difficulties.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-difficulty" />
                          难点
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {node.difficulties.map((difficulty, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-xs bg-difficulty/10 text-difficulty rounded-full border border-difficulty/20"
                            >
                              {difficulty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {editable && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(node, 'progress');
                          }}
                        >
                          <Edit className="w-4 h-4" />
                          更新进度
                        </button>
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-success hover:bg-success/90 text-white rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(node, 'achievement');
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          添加成果
                        </button>
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-difficulty hover:bg-difficulty/90 text-white rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(node, 'difficulty');
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          记录难点
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingNode && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeEditModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingNode.type === 'progress' && '更新进度'}
              {editingNode.type === 'achievement' && '添加成果'}
              {editingNode.type === 'difficulty' && '记录难点'}
            </h3>

            {editingNode.type === 'progress' ? (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">当前进度</span>
                  <span className="text-lg font-semibold text-primary-600">
                    {progressValue}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {editingNode.type === 'achievement' ? '成果内容' : '难点描述'}
                </label>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={
                    editingNode.type === 'achievement'
                      ? '请输入取得的成果...'
                      : '请输入遇到的难点...'
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={closeEditModal}
              >
                取消
              </button>
              <button
                className="px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                onClick={handleSave}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
