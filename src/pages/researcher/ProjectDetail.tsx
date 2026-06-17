import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  User,
  FolderKanban,
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getProjectById } from '../../services/projects';
import { getTeam } from '../../services/team';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import Timeline from '../../components/Timeline';
import { formatDate } from '../../utils/format';
import type { Project, TeamMember } from '../../../shared/types';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

const subjectColorMap: Record<string, string> = {
  '物理学': 'bg-blue-100 text-blue-700',
  '化学': 'bg-green-100 text-green-700',
  '生物学': 'bg-emerald-100 text-emerald-700',
  '计算机科学': 'bg-purple-100 text-purple-700',
  '材料科学': 'bg-orange-100 text-orange-700',
  '环境科学': 'bg-teal-100 text-teal-700',
};

export default function ResearcherProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const expandNodeId = (location.state as { expandNodeId?: string } | null)?.expandNodeId ?? null;
  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [projectData, teamData] = await Promise.all([
          getProjectById(id),
          getTeam(),
        ]);
        setProject(projectData);
        setTeam(teamData);
      } catch (error) {
        console.error('加载项目详情失败:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const getMemberById = (memberId: string) => team.find(m => m.id === memberId);

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

  const handleBack = () => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/researcher/projects');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>

        <div className="bg-white rounded-xl p-6 animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-96"></div>
          <div className="flex gap-3">
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>

        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <FolderKanban size={64} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">项目不存在</h2>
        <p className="text-gray-500 mb-6">您访问的项目可能已被删除或不存在</p>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <ArrowLeft size={18} />
          返回项目列表
        </button>
      </div>
    );
  }

  const leader = getMemberById(project.leaderId);
  const members = project.memberIds.map(id => getMemberById(id)).filter(Boolean) as TeamMember[];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">项目详情</h1>
          <p className="text-gray-500 text-sm mt-1">查看和管理项目进度</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 mb-3 truncate">{project.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={cn('px-3 py-1 text-sm font-medium rounded-full', getSubjectColor(project.subject))}>
                {project.subject}
              </span>
              <StatusBadge status={project.status} size="md" />
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-6 leading-relaxed">{project.description}</p>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">项目进度</span>
            <span className="text-sm font-semibold text-gray-800">{project.progress}%</span>
          </div>
          <ProgressBar
            progress={project.progress}
            color={getProgressColor(project.status)}
            height="lg"
            showLabel={false}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <Calendar size={16} />
              <span>项目周期</span>
            </div>
            <p className="text-gray-800 font-medium">
              {formatDate(project.startDate)} ~ {formatDate(project.endDate)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <User size={16} />
              <span>项目负责人</span>
            </div>
            {leader ? (
              <div className="flex items-center gap-3">
                <img
                  src={leader.avatar}
                  alt={leader.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
                <div>
                  <p className="text-gray-800 font-medium">{leader.name}</p>
                  <p className="text-gray-500 text-sm">{leader.title}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">未分配</p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
            <User size={16} />
            <span>项目成员 ({members.length}人)</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200"
              >
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-gray-800 text-sm font-medium">{member.name}</p>
                  <p className="text-gray-500 text-xs">{member.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">项目进度时间轴</h3>
        <Timeline
          nodes={project.nodes}
          users={team}
          editable={true}
          initialExpandedNodeId={expandNodeId}
        />
      </div>
    </div>
  );
}
