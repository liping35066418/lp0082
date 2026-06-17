import type {
  Project,
  ProjectNode,
  UpdateNodeRequest,
  CreateNodeRequest,
} from '../../shared/types';
import { api } from './api';

export const getProjects = async (subject?: string, status?: string): Promise<Project[]> => {
  const params: Record<string, unknown> = {};
  if (subject) params.subject = subject;
  if (status) params.status = status;

  const response = await api.get<Project[]>('/projects', { params });

  if (!response.success || !response.data) {
    throw new Error(response.error || '获取项目列表失败');
  }

  return response.data;
};

export const getProjectById = async (id: string): Promise<Project> => {
  const response = await api.get<Project>(`/projects/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error || '获取项目详情失败');
  }

  return response.data;
};

export const updateNode = async (
  projectId: string,
  nodeId: string,
  data: UpdateNodeRequest
): Promise<ProjectNode> => {
  const response = await api.put<ProjectNode>(
    `/projects/${projectId}/nodes/${nodeId}`,
    data
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || '更新节点失败');
  }

  return response.data;
};

export const createNode = async (
  projectId: string,
  data: CreateNodeRequest
): Promise<ProjectNode> => {
  const response = await api.post<ProjectNode>(`/projects/${projectId}/nodes`, data);

  if (!response.success || !response.data) {
    throw new Error(response.error || '创建节点失败');
  }

  return response.data;
};
