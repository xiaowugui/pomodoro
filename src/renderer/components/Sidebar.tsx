import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Timer, CheckSquare, Calendar, BarChart3, Settings, FileText } from 'lucide-react';

const navItems = [
  { path: '/timer', labelKey: 'app.timer', icon: Timer },
  { path: '/daily', labelKey: 'app.daily', icon: Calendar },
  { path: '/tasks', labelKey: 'app.tasks', icon: CheckSquare },
  { path: '/notes', labelKey: 'app.notes', icon: FileText },
  { path: '/stats', labelKey: 'app.stats', icon: BarChart3 },
  { path: '/settings', labelKey: 'app.settings', icon: Settings },
];

export default function Sidebar() {
  const { t } = useTranslation();
  
  return (
    <aside className="w-20 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-6">
      <div className="mb-8">
        <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
          <Timer className="w-6 h-6 text-white" />
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `p-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
              title={t(item.labelKey)}
            >
              <Icon className="w-6 h-6" />
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
