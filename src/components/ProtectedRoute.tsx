import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../../shared/types';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: UserRole;
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (role && user?.role !== role) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">访问被拒绝</h1>
          <p className="text-gray-600 mb-6">
            您没有权限访问此页面。请联系管理员获取相应权限。
          </p>
          <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-500">
            <p>当前角色：{user?.role === 'admin' ? '项目负责人' : '科研人员'}</p>
            <p>需要角色：{role === 'admin' ? '项目负责人' : '科研人员'}</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
