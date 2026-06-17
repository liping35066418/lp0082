import type { OverdueAlert } from '../../shared/types';
import { api } from './api';

export const getOverdueAlerts = async (): Promise<OverdueAlert[]> => {
  const response = await api.get<OverdueAlert[]>('/alerts/overdue');

  if (!response.success || !response.data) {
    throw new Error(response.error || '获取逾期预警失败');
  }

  return response.data;
};

export const notifyAlert = async (
  alertId: string
): Promise<{ alertId: string; notified: boolean; notifiedAt: string }> => {
  const response = await api.post<{
    alertId: string;
    notified: boolean;
    notifiedAt: string;
  }>(`/alerts/${alertId}/notify`);

  if (!response.success || !response.data) {
    throw new Error(response.error || '标记通知失败');
  }

  return response.data;
};
