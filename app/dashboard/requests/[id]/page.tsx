'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ApprovalModal from '../../../../components/ApprovalModal';
import ApprovalHistory from '../../../../components/ApprovalHistory';
import ApprovalWorkflow from '../../../../components/ApprovalWorkflow';
import { RequestStatus, ActionType, UserRole } from '../../../../lib/types';

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

interface ApprovalHistoryItem {
  _id: string;
  action: ActionType;
  actor: User;
  notes?: string;
  budgetAvailable?: boolean;
  forwardedMessage?: string;
  attachments?: string[];
  previousStatus?: RequestStatus;
  newStatus?: RequestStatus;
  timestamp: Date;
}

interface Request {
  _id: string;
  title: string;
  purpose: string;
  college: string;
  department: string;
  costEstimate: number;
  expenseCategory: string;
  sopReference?: string;
  attachments: string[];
  requester: User;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  history: ApprovalHistoryItem[];
}

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchRequest();
    fetchCurrentUser();
  }, [params.id]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/requests/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) throw new Error('Request not found');
        throw new Error('Failed to fetch request');
      }

      const data = await response.json();
      setRequest(data);

    } catch (err) {
      console.error('Error fetching request:', err);
      setError(err instanceof Error ? err.message : 'Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalData: any) => {
    try {
      const response = await fetch(`/api/requests/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData),
      });
      
      if (!response.ok) throw new Error('Failed to process approval');

      await fetchRequest();
      setIsApprovalModalOpen(false);

    } catch (err) {
      throw err;
    }
  };

  const hideWorkflowAndHistory =
    currentUser?.role === 'sop_verifier' || currentUser?.role === 'accountant';

  const handleBackToRequests = () => {
    router.push('/dashboard/pending-approvals');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || 'Request not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">

      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={handleBackToRequests}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
          </svg>
          Back to Requests
        </button>
      </div>

      {/* Request Details */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
          <p className="text-sm text-gray-500">{request.purpose}</p>
        </div>

        {/* Details */}
        <div className="px-4 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <h4 className="text-sm font-medium text-gray-500">Request Info</h4>
              <dl className="mt-2 space-y-3">
                <div className="flex justify-between"><dt>ID</dt><dd>{request._id}</dd></div>
                <div className="flex justify-between"><dt>Requester</dt><dd>{request.requester.name}</dd></div>
                <div className="flex justify-between"><dt>Email</dt><dd>{request.requester.email}</dd></div>
                <div className="flex justify-between"><dt>College</dt><dd>{request.college}</dd></div>
                <div className="flex justify-between"><dt>Department</dt><dd>{request.department}</dd></div>
              </dl>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Financial Info</h4>
              <dl className="mt-2 space-y-3">
                <div className="flex justify-between">
                  <dt>Cost Estimate</dt>
                  <dd>₹{request.costEstimate.toLocaleString()}</dd>
                </div>

                {request.sopReference && (
                  <div className="flex justify-between">
                    <dt>SOP Reference</dt>
                    <dd>{request.sopReference}</dd>
                  </div>
                )}

                <div className="flex justify-between">
                  <dt>Created</dt>
                  <dd>{new Date(request.createdAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

          </div>

          {/* Attachments */}
          {request.attachments?.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500">Attachments</h4>
              <ul className="mt-2 border rounded divide-y">
                {request.attachments.map((a, i) => (
                  <li key={i} className="p-3 flex justify-between text-sm">
                    <span>{a.split('/').pop()}</span>
                    <a href={a} target="_blank" className="text-blue-600">View</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Process Request Button */}
          {currentUser?.role !== 'requester' && (
            <div className="mt-6">
              <button
                onClick={() => setIsApprovalModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Process Request
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Workflow + History (hidden for SOP, Accountant) */}
      {!hideWorkflowAndHistory && (
        <>
          <div className="bg-white shadow rounded-lg mb-8 p-6">
            <ApprovalWorkflow currentStatus={request.status} />
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <ApprovalHistory history={request.history} currentStatus={request.status} />
          </div>
        </>
      )}

      {/* Approval Modal */}
      <ApprovalModal
        requestId={params.id}
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onApprove={handleApprove}
        currentStatus={request.status}
        userRole={currentUser?.role}
      />

    </div>
  );
}
