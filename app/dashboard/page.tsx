'use client';

import { ClipboardDocumentListIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json());

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export default function DashboardPage() {
  const { data: stats, error } = useSWR<DashboardStats>('/api/dashboard/stats', fetcher);
  const { data: recentRequests } = useSWR('/api/requests?limit=5', fetcher);

  const statsCards = [
    {
      name: 'Total Requests',
      stat: stats?.totalRequests || 0,
      icon: ClipboardDocumentListIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Pending',
      stat: stats?.pendingRequests || 0,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Approved',
      stat: stats?.approvedRequests || 0,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Rejected',
      stat: stats?.rejectedRequests || 0,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">Error loading dashboard data</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* PAGE HEADER */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-4xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-gray-500">Overview of your requests and activity</p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((item) => (
          <div
            key={item.name}
            className="group bg-white/80 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-gray-100 transition transform hover:scale-[1.02] hover:shadow-xl"
          >
            <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${item.bgColor}`}>
              <item.icon className={`w-8 h-8 ${item.color}`} />
            </div>

            <p className="mt-4 text-gray-600 font-medium">{item.name}</p>

            <p className="text-4xl font-extrabold text-gray-900 mt-2 group-hover:scale-105 transition">
              {item.stat}
            </p>
          </div>
        ))}
      </div>

      {/* RECENT REQUESTS */}
      <div className="mt-10 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Recent Requests</h3>

        {recentRequests?.requests?.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {recentRequests.requests.map((request: any) => (
              <li key={request._id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{request.title}</p>
                  <p className="text-sm text-gray-500">
                    {request.college} • {request.department}
                  </p>
                </div>

                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusClass(request.status)}`}>
                  {request.status.replace('_', ' ').toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-6">No recent requests found</p>
        )}
      </div>
    </div>
  );
}

/* STATUS COLORS */
function getStatusClass(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    case 'draft':
      return 'bg-gray-200 text-gray-700';
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
}
