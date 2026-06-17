import type { TeamMember, UpdateAssignmentRequest } from '../../shared/types';
import { api } from './api';

export const getTeam = async (): Promise<TeamMember[]> => {
  const response = await api.get<TeamMember[]>('/team');

  if (!response.success || !response.data) {
    throw new Error(response.error || '获取团队信息失败');
  }

  return response.data;
};

export const updateMemberAssignment = async (
  memberId: string,
  data: UpdateAssignmentRequest
): Promise<TeamMember> => {
  const response = await api.put<TeamMember>(
    `/team/members/${memberId}`,
    data
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || '调整成员分工失败');
  }

  return response.data;
};
