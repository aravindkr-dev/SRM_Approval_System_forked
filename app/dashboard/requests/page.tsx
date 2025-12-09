'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Request {
  _id: string;
  title: string;
  purpose: string;
  college: string;
  department: string;
  costEstimate: number;
  expenseCategory: string;
  status: string;
  createdAt: string;
}

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchRequests();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch user');
      const user = await response.json();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/requests', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch requests');

      const data = await response.json();
      setRequests(data.requests);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
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
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">

      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-600">View and manage your submitted requests</p>

          {currentUser && (
            <p className="text-sm text-gray-500 mt-1">
              Logged in as: <span className="font-medium">{currentUser.name || currentUser.email}</span>
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchRequests}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-sm transition"
          >
            Refresh
          </button>

          <button
            onClick={() => router.push('/dashboard/requests/create')}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md transition"
          >
            + Create Request
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* No Requests */}
      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
          <svg
            className="mx-auto h-14 w-14 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No requests found</h3>
          <p className="text-gray-500 mt-1">Start by creating a new request</p>

          <button
            onClick={() => router.push('/dashboard/requests/create')}
            className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition"
          >
            + New Request
          </button>
        </div>
      ) : (

        /* Requests List */
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
          <ul className="divide-y divide-gray-200">

            {requests.map((request) => (
              <li key={request._id}>
                <div
                  className="hover:bg-gray-50 hover:scale-[1.01] transition cursor-pointer rounded-xl p-4"
                  onClick={() => router.push(`/dashboard/requests/${request._id}`)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-blue-700">
                      {request.title}
                    </h3>

                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(request.status)}`}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Meta info */}
                  <p className="text-sm text-gray-600 mt-1">
                    {request.purpose.substring(0, 100)}
                    {request.purpose.length > 100 && '...'}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                      ₹{request.costEstimate.toLocaleString()}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                      {request.college} • {request.department}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800">
                      {request.expenseCategory}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 ml-auto">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </li>
            ))}

          </ul>
        </div>
      )}
    </div>
  );
}
