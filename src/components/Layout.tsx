import { useState, ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  AlertTriangle,
  FlaskConical,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const researcherMenu = [
  {
    path: '/researcher/projects',
    label: '我的项目',
    icon: FlaskConical,
  },
];

const adminMenu = [
  {
    path: '/admin/dashboard',
    label: '项目总览',
    icon: LayoutDashboard,
  },
  {
    path: '/admin/team',
    label: '人力分配',
    icon: Users,
  },
  {
    path: '/admin/tasks',
    label: '任务管理',
    icon: ListTodo,
  },
  {
    path: '/admin/alerts',
    label: '预警中心',
    icon: AlertTriangle,
  },
];

const breadcrumbMap: Record<string, string> = {
  '/researcher/projects': '我的项目',
  '/admin/dashboard': '项目总览',
  '/admin/team': '人力分配',
  '/admin/tasks': '任务管理',
  '/admin/alerts': '预警中心',
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const menuItems = user?.role === 'admin' ? adminMenu : researcherMenu;

  const currentBreadcrumb = breadcrumbMap[location.pathname] || '';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={cn(
          'flex flex-col bg-gradient-to-b from-primary-900 to-primary-950 text-white transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-primary-800">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              科研管理系统
            </h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-primary-800 transition-colors duration-200"
          >
            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                    sidebarCollapsed && 'justify-center',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-300 hover:bg-primary-800/50 hover:text-white'
                  )
                }
              >
                <Icon size={20} className="shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary-800">
          {user && (
            <div
              className={cn(
                'flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-primary-800/50 transition-colors',
                sidebarCollapsed && 'justify-center'
              )}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-700"
              />
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {user.role === 'admin' ? '项目负责人' : '科研人员'}
                  </p>
                </div>
              )}
              {!sidebarCollapsed && (
                <ChevronDown
                  size={16}
                  className={cn(
                    'text-gray-400 transition-transform duration-200',
                    userMenuOpen && 'rotate-180'
                  )}
                />
              )}
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-gray-400">首页</span>
            {currentBreadcrumb && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-primary-600 font-medium">{currentBreadcrumb}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    'text-gray-400 transition-transform duration-200',
                    userMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.department}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
