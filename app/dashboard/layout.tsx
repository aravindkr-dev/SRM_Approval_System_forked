'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  DocumentPlusIcon, 
  ClipboardDocumentListIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { UserRole } from '../../lib/types';
import { AuthUser } from '../../lib/auth';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon,
    roles: Object.values(UserRole)
  },
  { 
    name: 'My Requests', 
    href: '/dashboard/requests', 
    icon: ClipboardDocumentListIcon,
    roles: [UserRole.REQUESTER]
  },
  { 
    name: 'Create Request', 
    href: '/dashboard/requests/create', 
    icon: DocumentPlusIcon,
    roles: [UserRole.REQUESTER]
  },
  { 
    name: 'Pending Approvals', 
    href: '/dashboard/approvals', 
    icon: ClipboardDocumentListIcon,
    roles: [
      UserRole.INSTITUTION_MANAGER, 
      UserRole.SOP_VERIFIER,
      UserRole.ACCOUNTANT, 
      UserRole.VP, 
      UserRole.HEAD_OF_INSTITUTION,
      UserRole.DEAN,
      UserRole.MMA,
      UserRole.HR,
      UserRole.AUDIT,
      UserRole.IT,
      UserRole.CHIEF_DIRECTOR,
      UserRole.CHAIRMAN
    ]
  },
  { 
    name: 'My Involvement', 
    href: '/dashboard/in-progress', 
    icon: ClockIcon,
    roles: [
      UserRole.INSTITUTION_MANAGER, 
      UserRole.SOP_VERIFIER,
      UserRole.ACCOUNTANT, 
      UserRole.VP, 
      UserRole.HEAD_OF_INSTITUTION,
      UserRole.DEAN,
      UserRole.MMA,
      UserRole.HR,
      UserRole.AUDIT,
      UserRole.IT,
      UserRole.CHIEF_DIRECTOR,
      UserRole.CHAIRMAN
    ]
  },
  { 
    name: 'Budget Management', 
    href: '/dashboard/budget', 
    icon: ChartBarIcon,
    roles: [UserRole.ACCOUNTANT, UserRole.DEAN, UserRole.CHIEF_DIRECTOR]
  },
  { 
    name: 'User Management', 
    href: '/dashboard/users', 
    icon: UserGroupIcon,
    roles: [UserRole.CHIEF_DIRECTOR, UserRole.CHAIRMAN]
  },
  { 
    name: 'Audit Logs', 
    href: '/dashboard/audit', 
    icon: CogIcon,
    roles: [UserRole.AUDIT, UserRole.CHIEF_DIRECTOR, UserRole.CHAIRMAN]
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    });
    router.push('/');
  };

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-blue-600">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-white text-base sm:text-lg font-semibold">
                  SRM-RMP Approval
                </h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-blue-200 hover:text-white hover:bg-blue-700 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="text-blue-300 mr-3 flex-shrink-0 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-blue-600 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-white text-lg font-semibold">
              SRM-RMP Approval
            </h1>
          </div>
          <nav className="mt-8 flex-1 flex flex-col divide-y divide-blue-700 overflow-y-auto" aria-label="Sidebar">
            <div className="px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-blue-200 hover:text-white hover:bg-blue-700 group flex items-center px-2 py-2 text-sm leading-6 font-medium rounded-md"
                >
                  <item.icon className="text-blue-300 mr-4 flex-shrink-0 h-6 w-6" aria-hidden="true" />
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="relative z-10 flex-shrink-0 flex h-14 sm:h-16 bg-white border-b border-gray-200 lg:border-none">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex-1 px-2 sm:px-4 flex justify-between items-center">
            <div className="flex-1 flex lg:hidden">
              <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                SRM-RMP
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block">
                <span className="text-gray-700 text-xs sm:text-sm">
                  Welcome, <span className="font-medium">{user?.name}</span>
                </span>
                <div className="text-xs text-gray-500">({user?.role})</div>
              </div>
              <div className="sm:hidden">
                <span className="text-gray-700 text-xs font-medium">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-md transition-colors active:scale-95"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-3 sm:py-6">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}