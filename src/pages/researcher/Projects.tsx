import { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProjects } from '../../services/projects';
import { getTeam } from '../../services/team';
import { useAppStore } from '../../store/appStore';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import { formatDate } from '../../utils/format';
import type { Project, TeamMember } from '../../../shared/types';
import { cn } from '../../lib/utils';

const statusFilters = [
  { value: null, label: '全部' },
  { value: 'planning', label: '规划中' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'delayed', label: '已逾期' },
];

const subjectColorMap: Record<string, string> = {
  '物理学': 'bg-blue-100 text-blue-700',
  '化学': 'bg-green-100 text-green-700',
  '生物学': 'bg-emerald-100 text-emerald-700',
  '计算机科学': 'bg-purple-100 text-purple-700',
  '材料科学': 'bg-orange-100 text-orange-700',
  '环境科学': 'bg-teal-100 text-teal-700',
};

export default function ResearcherProjects() {
  const navigate = useNavigate();
  const { subjects, selectedSubject, selectedStatus, setSelectedSubject, setSelectedStatus, clearFilters } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    return projects.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      inProgress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      delayed: projects.filter(p => p.status === 'delayed').length,
    };
  }, [projects]);

  const getMemberById = (id: string) => team.find(m => m.id === id);

  const statCards = [
    { title: '项目总数', value: stats.total, icon: FolderKanban, color: 'from-blue-500 to-blue-600' },
    { title: '进行中', value: stats.inProgress, icon: FlaskConical, color: 'from-purple-500 to-purple-600' },
    { title: '已完成', value: stats.completed, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
    { title: '已逾期', value: stats.delayed, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
  ];

  const getSubjectColor = (subject: string) => {
    return subjectColorMap[subject] || 'bg-gray-100 text-gray-700';
  };

  const getProgressColor = (status: Project['status']) => {
    switch (status) {
      case 'delayed':
        return 'from-red-500 to-orange-500';
      case 'completed':
        return 'from-green-500 to-emerald-500';
      case 'in_progress':
        return 'from-blue-500 to-purple-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const handleCardClick = (projectId: string) => {
    navigate(`/researcher/projects/${projectId}`);
  };

  const hasFilters = selectedSubject || selectedStatus || searchQuery;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>

        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
                </div>
                <div className={cn('p-2.5 rounded-xl bg-gradient-to-br', card.color)}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="搜索项目名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm font-medium text-gray-600">学科:</span>
          </div>
          <button
            onClick={() => setSelectedSubject(null)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
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
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                selectedSubject === subject
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {subject}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mr-2">
            <Clock size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">状态:</span>
          </div>
          {statusFilters.map((filter) => (
            <button
              key={filter.value || 'all'}
              onClick={() => setSelectedStatus(filter.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                selectedStatus === filter.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {filter.label}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={() => {
                clearFilters();
                setSearchQuery('');
              }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} />
              清除筛选
            </button>
          )}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          {hasFilters ? (
            <>
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">没有找到符合条件的项目</p>
              <p className="text-gray-400 text-sm mt-1">请尝试调整筛选条件</p>
              <button
                onClick={() => {
                  clearFilters();
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                清除所有筛选
              </button>
            </>
          ) : (
            <>
              <FolderKanban size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">暂无项目</p>
              <p className="text-gray-400 text-sm mt-1">您还没有参与任何科研项目</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const leader = getMemberById(project.leaderId);
            const members = project.memberIds.map(id => getMemberById(id)).filter(Boolean) as TeamMember[];

            return (
              <div
                key={project.id}
                onClick={() => handleCardClick(project.id)}
                className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-800 line-clamp-1 flex-1 mr-2">
                    {project.name}
                  </h3>
                  <ChevronRight size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', getSubjectColor(project.subject))}>
                    {project.subject}
                  </span>
                  <StatusBadge status={project.status} size="sm" />
                </div>

                <div className="mb-4">
                  <ProgressBar
                    progress={project.progress}
                    color={getProgressColor(project.status)}
                    height="md"
                    showLabel={true}
                  />
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  <span>{formatDate(project.startDate)} ~ {formatDate(project.endDate)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {members.slice(0, 4).map((member, idx) => (
                        <img
                          key={member.id}
                          src={member.avatar}
                          alt={member.name}
                          className="w-7 h-7 rounded-full border-2 border-white object-cover"
                          title={member.name}
                        />
                      ))}
                      {members.length > 4 && (
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-medium">
                          +{members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                  {leader && (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={leader.avatar}
                        alt={leader.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs text-gray-600">{leader.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
