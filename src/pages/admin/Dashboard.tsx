import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  Eye,
  Filter,
  X,
} from 'lucide-react';
import { getProjects } from '../../services/projects';
import { getTeam } from '../../services/team';
import { useAppStore } from '../../store/appStore';
import { formatDate, getStatusText, getStatusColor } from '../../utils/format';
import type { Project, TeamMember } from '../../../shared/types';
import { cn } from '../../lib/utils';

const statusFilters = [
  { value: null, label: '全部' },
  { value: 'planning', label: '规划中' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'delayed', label: '已逾期' },
];

export default function AdminDashboard() {
  const { subjects, selectedSubject, selectedStatus, setSelectedSubject, setSelectedStatus, clearFilters } = useAppStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, teamData] = await Promise.all([
          getProjects(selectedSubject || undefined, selectedStatus || undefined),
          getTeam(),
        ]);
        setProjects(projectsData);
        setTeam(teamData);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedSubject, selectedStatus]);

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    delayed: projects.filter(p => p.status === 'delayed').length,
  };

  const getMemberById = (id: string) => team.find(m => m.id === id);

  const toggleExpand = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const statCards = [
    { title: '项目总数', value: stats.total, icon: LayoutDashboard, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
    { title: '进行中', value: stats.inProgress, icon: FlaskConical, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50' },
    { title: '已完成', value: stats.completed, icon: CheckCircle2, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50' },
    { title: '逾期预警', value: stats.delayed, icon: AlertTriangle, color: 'from-red-500 to-red-600', bgColor: 'bg-red-50' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">项目总览看板</h1>
          <p className="text-gray-500 mt-1">查看和管理所有科研项目</p>
        </div>
        {(selectedSubject || selectedStatus) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
            清除筛选
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{card.value}</p>
                </div>
                <div className={cn('p-3 rounded-xl bg-gradient-to-br', card.color)}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">学科筛选:</span>
          </div>
          <button
            onClick={() => setSelectedSubject(null)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              selectedSubject === null
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            全部
          </button>
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                selectedSubject === subject
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {subject}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mr-4">
            <Clock size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">状态筛选:</span>
          </div>
          {statusFilters.map((filter) => (
            <button
              key={filter.value || 'all'}
              onClick={() => setSelectedStatus(filter.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                selectedStatus === filter.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <LayoutDashboard size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无符合条件的项目</p>
          </div>
        ) : (
          projects.map((project) => {
            const leader = getMemberById(project.leaderId);
            const isExpanded = expandedProjectId === project.id;

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          {project.subject}
                        </span>
                        <span className={cn('px-3 py-1 text-xs font-medium rounded-full', getStatusColor(project.status))}>
                          {getStatusText(project.status)}
                        </span>
                      </div>

                      <div className="w-full max-w-md mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-500">项目进度</span>
                          <span className="font-medium text-gray-700">{project.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              project.status === 'delayed'
                                ? 'bg-red-500'
                                : project.status === 'completed'
                                ? 'bg-green-500'
                                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                            )}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-400" />
                          <span>负责人: {leader?.name || '未分配'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {project.memberIds.slice(0, 4).map((memberId, idx) => {
                              const member = getMemberById(memberId);
                              return member ? (
                                <img
                                  key={idx}
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                  title={member.name}
                                />
                              ) : null;
                            })}
                            {project.memberIds.length > 4 && (
                              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                                +{project.memberIds.length - 4}
                              </div>
                            )}
                          </div>
                          <span>成员 {project.memberIds.length} 人</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span>{formatDate(project.startDate)} ~ {formatDate(project.endDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => navigate(`/admin/projects/${project.id}`)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                        查看详情
                      </button>
                      <button
                        onClick={() => toggleExpand(project.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && project.nodes.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100 p-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">项目节点</h4>
                    <div className="space-y-3">
                      {project.nodes.map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <p className="font-medium text-gray-800">{node.title}</p>
                              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', getStatusColor(node.status))}>
                                {getStatusText(node.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>负责人: {getMemberById(node.assigneeId)?.name || '未分配'}</span>
                              <span>{formatDate(node.startDate)} ~ {formatDate(node.endDate)}</span>
                              <span>进度: {node.progress}%</span>
                            </div>
                          </div>
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden ml-4">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-300',
                                node.status === 'delayed'
                                  ? 'bg-red-500'
                                  : node.status === 'completed'
                                  ? 'bg-green-500'
                                  : 'bg-blue-500'
                              )}
                              style={{ width: `${node.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
