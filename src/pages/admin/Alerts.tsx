import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Eye,
  Calendar,
  User,
  X,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOverdueAlerts, notifyAlert } from '../../services/alerts';
import { getProjects } from '../../services/projects';
import Modal from '../../components/Modal';
import { formatDate } from '../../utils/format';
import type { OverdueAlert, Project } from '../../../shared/types';
import { cn } from '../../lib/utils';

const overdueFilters = [
  { value: 0, label: '全部' },
  { value: 3, label: '大于3天' },
  { value: 7, label: '大于7天' },
  { value: 15, label: '大于15天' },
];

export default function AdminAlerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<OverdueAlert[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedOverdueDays, setSelectedOverdueDays] = useState(0);
  const [selectedAlertIds, setSelectedAlertIds] = useState<Set<string>>(new Set());
  const [notifyingIds, setNotifyingIds] = useState<Set<string>>(new Set());
  const [detailModal, setDetailModal] = useState<OverdueAlert | null>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [overdueDropdownOpen, setOverdueDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsData, projectsData] = await Promise.all([
          getOverdueAlerts(),
          getProjects(),
        ]);
        setAlerts(alertsData);
        setProjects(projectsData);
      } catch (error) {
        console.error('加载预警数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (selectedProjectId && alert.projectId !== selectedProjectId) {
        return false;
      }
      if (selectedOverdueDays > 0 && alert.overdueDays <= selectedOverdueDays) {
        return false;
      }
      return true;
    });
  }, [alerts, selectedProjectId, selectedOverdueDays]);

  const handleSelectAll = () => {
    if (selectedAlertIds.size === filteredAlerts.length) {
      setSelectedAlertIds(new Set());
    } else {
      setSelectedAlertIds(new Set(filteredAlerts.map(a => a.id)));
    }
  };

  const handleSelectAlert = (alertId: string) => {
    const newSelected = new Set(selectedAlertIds);
    if (newSelected.has(alertId)) {
      newSelected.delete(alertId);
    } else {
      newSelected.add(alertId);
    }
    setSelectedAlertIds(newSelected);
  };

  const handleNotify = async (alertId: string) => {
    if (notifyingIds.has(alertId)) return;

    setNotifyingIds(prev => new Set(prev).add(alertId));
    try {
      await notifyAlert(alertId);
      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, notified: true } : a
      ));
    } catch (error) {
      console.error('通知失败:', error);
    } finally {
      setNotifyingIds(prev => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  const handleBatchNotify = async () => {
    const idsToNotify = Array.from(selectedAlertIds).filter(
      id => !alerts.find(a => a.id === id)?.notified && !notifyingIds.has(id)
    );

    if (idsToNotify.length === 0) return;

    setNotifyingIds(prev => {
      const next = new Set(prev);
      idsToNotify.forEach(id => next.add(id));
      return next;
    });

    try {
      await Promise.all(idsToNotify.map(id => notifyAlert(id)));
      setAlerts(prev => prev.map(a =>
        selectedAlertIds.has(a.id) ? { ...a, notified: true } : a
      ));
      setSelectedAlertIds(new Set());
    } catch (error) {
      console.error('批量通知失败:', error);
    } finally {
      setNotifyingIds(prev => {
        const next = new Set(prev);
        idsToNotify.forEach(id => next.delete(id));
        return next;
      });
    }
  };

  const handleViewDetail = (alert: OverdueAlert) => {
    setDetailModal(alert);
  };

  const handleGoToProject = (projectId: string) => {
    navigate(`/admin/dashboard`);
    setDetailModal(null);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedOverdueFilter = overdueFilters.find(f => f.value === selectedOverdueDays);
  const hasSelection = selectedAlertIds.size > 0;
  const notifiableCount = Array.from(selectedAlertIds).filter(
    id => !alerts.find(a => a.id === id)?.notified
  ).length;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-800">预警中心</h1>
        <div className="relative">
          <Bell size={24} className="text-red-500" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {alerts.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <button
              onClick={() => {
                setProjectDropdownOpen(!projectDropdownOpen);
                setOverdueDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors min-w-[180px]"
            >
              <span className="text-sm text-gray-600">
                {selectedProject ? selectedProject.name : '按项目筛选'}
              </span>
              <ChevronDown size={16} className="text-gray-400 ml-auto" />
            </button>
            {projectDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedProjectId(null);
                    setProjectDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                >
                  全部项目
                </button>
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setProjectDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors',
                      selectedProjectId === project.id && 'bg-blue-50 text-blue-600'
                    )}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setOverdueDropdownOpen(!overdueDropdownOpen);
                setProjectDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors min-w-[140px]"
            >
              <span className="text-sm text-gray-600">
                {selectedOverdueFilter?.label || '逾期天数'}
              </span>
              <ChevronDown size={16} className="text-gray-400 ml-auto" />
            </button>
            {overdueDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                {overdueFilters.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setSelectedOverdueDays(filter.value);
                      setOverdueDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors',
                      selectedOverdueDays === filter.value && 'bg-blue-50 text-blue-600'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasSelection && (
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-sm text-gray-600">
                已选择 {selectedAlertIds.size} 项
              </span>
              <button
                onClick={handleBatchNotify}
                disabled={notifiableCount === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bell size={16} />
                批量通知 ({notifiableCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {filteredAlerts.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedAlertIds.size === filteredAlerts.length && filteredAlerts.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
          />
          <span className="text-sm text-gray-600">全选当前筛选结果</span>
        </div>
      )}

      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">暂无预警信息</p>
          <p className="text-gray-400 text-sm mt-1">所有项目节点进度正常</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={cn(
                'bg-red-50/50 rounded-xl p-5 border-2 border-red-200',
                'hover:shadow-lg transition-all duration-300',
                !alert.notified && 'animate-pulse'
              )}
            >
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={selectedAlertIds.has(alert.id)}
                  onChange={() => handleSelectAlert(alert.id)}
                  className="w-4 h-4 mt-1 rounded border-gray-300 text-red-500 focus:ring-red-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-800 line-clamp-1">
                      {alert.projectName}
                    </h3>
                    {alert.notified && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        <CheckCircle2 size={12} />
                        已通知
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1 mb-3">
                    {alert.nodeTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src={alert.assigneeAvatar}
                    alt={alert.assigneeName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    {alert.assigneeName}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-500">
                    {alert.overdueDays}
                  </div>
                  <div className="text-xs text-red-400">天逾期</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <Calendar size={12} />
                <span>截止日期: {formatDate(alert.dueDate)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleNotify(alert.id)}
                  disabled={alert.notified || notifyingIds.has(alert.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                    alert.notified
                      ? 'bg-green-100 text-green-600 cursor-default'
                      : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-md'
                  )}
                >
                  {notifyingIds.has(alert.id) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      通知中
                    </>
                  ) : alert.notified ? (
                    <>
                      <CheckCircle2 size={14} />
                      已通知
                    </>
                  ) : (
                    <>
                      <Bell size={14} />
                      通知责任人
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleViewDetail(alert)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye size={14} />
                  详情
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!detailModal}
        title="预警详情"
        onClose={() => setDetailModal(null)}
        showConfirm={false}
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-500" />
                  <span className="text-red-600 font-semibold">逾期预警</span>
                </div>
                <span className="text-2xl font-bold text-red-500">
                  {detailModal.overdueDays} 天
                </span>
              </div>
              <p className="text-sm text-red-600">
                该节点已逾期 {detailModal.overdueDays} 天，请尽快处理。
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">项目名称</label>
                <p className="text-gray-800 font-medium">{detailModal.projectName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">节点标题</label>
                <p className="text-gray-800 font-medium">{detailModal.nodeTitle}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">负责人</label>
                <div className="flex items-center gap-2">
                  <img
                    src={detailModal.assigneeAvatar}
                    alt={detailModal.assigneeName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-gray-800 font-medium">{detailModal.assigneeName}</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">截止日期</label>
                <p className="text-gray-800 font-medium">{formatDate(detailModal.dueDate)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">通知状态</label>
                <p className={cn(
                  'font-medium',
                  detailModal.notified ? 'text-green-600' : 'text-gray-600'
                )}>
                  {detailModal.notified ? '已通知' : '未通知'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleNotify(detailModal.id)}
                disabled={detailModal.notified || notifyingIds.has(detailModal.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
                  detailModal.notified
                    ? 'bg-green-100 text-green-600 cursor-default'
                    : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg'
                )}
              >
                {detailModal.notified ? (
                  <>
                    <CheckCircle2 size={16} />
                    已通知
                  </>
                ) : (
                  <>
                    <Bell size={16} />
                    通知责任人
                  </>
                )}
              </button>
              <button
                onClick={() => handleGoToProject(detailModal.projectId)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Eye size={16} />
                查看项目
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
