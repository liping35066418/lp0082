export type UserRole = 'researcher' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  department: string;
  username: string;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'delayed';
export type NodeStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';
export type Priority = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  name: string;
  subject: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number;
  leaderId: string;
  memberIds: string[];
  nodes: ProjectNode[];
}

export interface ProjectNode {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: NodeStatus;
  progress: number;
  assigneeId: string;
  achievements: string[];
  difficulties: string[];
  priority: Priority;
}

export interface MemberAssignment {
  id: string;
  memberId: string;
  projectId: string;
  projectName: string;
  nodeId: string;
  nodeName: string;
  role: string;
}

export interface TeamMember extends User {
  title: string;
  skills: string[];
  currentProjectIds: string[];
  workload: number;
  assignments: MemberAssignment[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UpdateNodeRequest {
  status?: NodeStatus;
  progress?: number;
  achievements?: string[];
  difficulties?: string[];
}

export interface CreateNodeRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  assigneeId: string;
  priority: Priority;
}

export interface UpdateAssignmentRequest {
  projectId: string;
  nodeId: string;
  role: string;
}

export interface OverdueAlert {
  id: string;
  nodeId: string;
  projectId: string;
  projectName: string;
  nodeTitle: string;
  assigneeName: string;
  assigneeAvatar: string;
  dueDate: string;
  overdueDays: number;
  notified: boolean;
}
