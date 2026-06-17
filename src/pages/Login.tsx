import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, FlaskConical, UserCog, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../../shared/types';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('researcher');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);

      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.role !== selectedRole) {
        setError(`该账号角色为${currentUser.role === 'admin' ? '课题负责人' : '科研人员'}，请选择正确的角色`);
        return;
      }

      if (selectedRole === 'researcher') {
        navigate('/researcher/projects');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('登录失败，请检查用户名和密码');
      }
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      role: 'researcher' as UserRole,
      label: '科研人员',
      icon: FlaskConical,
      description: '参与科研项目，管理研究节点',
    },
    {
      role: 'admin' as UserRole,
      label: '课题负责人',
      icon: UserCog,
      description: '统筹项目规划，管理团队协作',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            科研项目协同管理系统
          </h1>
          <p className="text-blue-200 text-sm">
            纯线上可视化协同管理平台
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="mb-6">
            <p className="text-white/80 text-sm mb-3 font-medium">选择登录身份</p>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedRole === option.role;
                return (
                  <button
                    key={option.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(option.role);
                      setError('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      isSelected
                        ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <div className="font-semibold text-sm">{option.label}</div>
                    <div className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-white/50'}`}>
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="请输入用户名"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="请输入密码"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          © 2024 科研项目协同管理系统 · 安全登录
        </p>
      </div>
    </div>
  );
}
