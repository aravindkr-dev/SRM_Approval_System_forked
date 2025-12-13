'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ApprovalModal from '../../../../components/ApprovalModal';
import ApprovalHistory from '../../../../components/ApprovalHistory';
import ApprovalWorkflow from '../../../../components/ApprovalWorkflow';
import { RequestStatus, ActionType, UserRole } from '../../../../lib/types';
import { approvalEngine } from '../../../../lib/approval-engine';

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
  const [showApprovalHistory, setShowApprovalHistory] = useState(false);

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
      setError(null);
      
      const response = await fetch(`/api/requests/${params.id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          throw new Error('Request not found');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this request');
        } else if (response.status === 401) {
          throw new Error('Please log in to view this request');
        }
        throw new Error(errorData.error || 'Failed to fetch request');
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
    // Try to go back in history first, fallback to appropriate page based on user role
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback based on user role
      if (currentUser?.role === UserRole.REQUESTER) {
        router.push('/dashboard/requests');
      } else {
        router.push('/dashboard/approvals');
      }
    }
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
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-base sm:text-lg font-medium text-red-800 mb-2">Error</h3>
          <p className="text-sm sm:text-base text-red-700">{error || 'Request not found'}</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleBackToRequests}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base active:scale-95"
            >
              {currentUser?.role === UserRole.REQUESTER ? 'Back to My Requests' : 'Back to Approvals'}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm sm:text-base active:scale-95"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">

      {/* Back Button */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={handleBackToRequests}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm sm:text-base active:scale-95"
        >
          <svg className="mr-1 h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
          </svg>
          <span className="hidden sm:inline">{currentUser?.role === UserRole.REQUESTER ? 'Back to My Requests' : 'Back to Approvals'}</span>
          <span className="sm:hidden">Back</span>
        </button>
      </div>

      {/* Request Details */}
      <div className="bg-white shadow rounded-lg sm:rounded-xl mb-6 sm:mb-8">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 break-words">{request.title}</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">{request.purpose}</p>
        </div>

        {/* Details */}
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">

            <div className="w-full">
              <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-3">Request Info</h4>
              <div className="space-y-3">
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 xs:gap-2">
                  <dt className="text-xs sm:text-sm font-medium text-gray-700 min-w-0 xs:min-w-[80px]">ID</dt>
                  <dd className="text-xs sm:text-sm text-gray-900 break-all font-mono flex-1">{request._id}</dd>
                </div>
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 xs:gap-2">
                  <dt className="text-xs sm:text-sm font-medium text-gray-700 min-w-0 xs:min-w-[80px]">Requester</dt>
                  <dd className="text-xs sm:text-sm text-gray-900 break-words flex-1">{request.requester.name}</dd>
                </div>
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 xs:gap-2">
                  <dt className="text-xs sm:text-sm font-medium text-gray-700 min-w-0 xs:min-w-[80px]">Email</dt>
                  <dd className="text-xs sm:text-sm text-gray-900 break-all flex-1">{request.requester.email}</dd>
                </div>
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 xs:gap-2">
                  <dt className="text-xs sm:text-sm font-medium text-gray-700 min-w-0 xs:min-w-[80px]">College</dt>
                  <dd className="text-xs sm:text-sm text-gray-900 break-words flex-1">{request.college}</dd>
                </div>
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 xs:gap-2">
                  <dt className="text-xs sm:text-sm font-medium text-gray-700 min-w-0 xs:min-w-[80px]">Department</dt>
                  <dd className="text-xs sm:text-sm text-gray-900 break-words flex-1">{request.department}</dd>
                </div>
              </div>
            </div>

            <div className="w-full">
              <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-3">Financial Info</h4>
              <div className="space-y-3">
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 xs:gap-2">
                  <dt className="text-xs sm:text-sm font-medium text-gray-700 min-w-0 xs:min-w-[100px]">Cost Estimate</dt>
                  <dd className="text-sm sm:text-base font-semibold text-green-600 flex-1">₹{request.costEstimate.toLocaleString()}</dd>
                </div>

                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 xs:gap-2">
                  <dt className="text-xs sm:text-sm font-medium text-gray-700 min-w-0 xs:min-w-[100px]">Expense Category</dt>
                  <dd className="text-xs sm:text-sm text-gray-900 break-words flex-1">{request.expenseCategory}</dd>
                </div>

                {request.sopReference && (
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 xs:gap-2">
                    <dt className="text-xs sm:text-sm font-medium text-gray-700 min-w-0 xs:min-w-[100px]">SOP Reference</dt>
                    <dd className="text-xs sm:text-sm text-gray-900 break-words font-mono flex-1">{request.sopReference}</dd>
                  </div>
                )}

                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 xs:gap-2">
                  <dt className="text-xs sm:text-sm font-medium text-gray-700 min-w-0 xs:min-w-[100px]">Status</dt>
                  <dd className="text-xs sm:text-sm flex-1">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </dd>
                </div>

                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 xs:gap-2">
                  <dt className="text-xs sm:text-sm font-medium text-gray-700 min-w-0 xs:min-w-[100px]">Created</dt>
                  <dd className="text-xs sm:text-sm text-gray-900 flex-1">{new Date(request.createdAt).toLocaleDateString()}</dd>
                </div>
              </div>
            </div>

          </div>

          {/* Attachments */}
          {request.attachments?.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Attachments</h4>
              <div className="border rounded-lg divide-y divide-gray-200">
                {request.attachments.map((a, i) => (
                  <div key={i} className="p-3 flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2">
                    <span className="text-xs sm:text-sm break-all flex-1 min-w-0">{a.split('/').pop()}</span>
                    <a 
                      href={a} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors text-xs sm:text-sm font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 self-start xs:self-auto whitespace-nowrap"
                    >
                      View File
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process Request Button */}
          {(() => {
            // Check if current user is authorized to process this request status
            if (currentUser?.role === 'requester') return null;
            
            const requiredApprovers = approvalEngine.getRequiredApprover(request.status as RequestStatus);
            const isAuthorized = requiredApprovers.includes(currentUser?.role as UserRole);
            
            return isAuthorized ? (
              <div className="mt-4 sm:mt-6 flex justify-center sm:justify-start">
                <button
                  onClick={() => setIsApprovalModalOpen(true)}
                  className="w-full sm:w-auto min-w-[200px] px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium active:scale-95 shadow-sm"
                >
                  Process Request
                </button>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Workflow + History (hidden for SOP, Accountant) */}
      {!hideWorkflowAndHistory && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white shadow rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-4">Approval Workflow</h3>
            <ApprovalWorkflow currentStatus={request.status} />
          </div>

          <div className="bg-white shadow rounded-lg sm:rounded-xl p-4 sm:p-6">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 mb-4">
              <h3 className="text-sm sm:text-base font-medium text-gray-900">Approval History</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600">
                  {showApprovalHistory ? 'Hide' : 'Show'} History
                </span>
                <button
                  onClick={() => setShowApprovalHistory(!showApprovalHistory)}
                  className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    showApprovalHistory ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={showApprovalHistory}
                  aria-label="Toggle approval history"
                >
                  <span
                    className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                      showApprovalHistory ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            {showApprovalHistory && (
              <div className="transition-all duration-300 ease-in-out">
                <ApprovalHistory history={request.history} currentStatus={request.status} />
              </div>
            )}
            
            {!showApprovalHistory && (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs sm:text-sm">Click the toggle above to view approval history</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      <ApprovalModal
        requestId={params.id}
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onApprove={handleApprove}
        currentStatus={request.status}
        userRole={currentUser?.role}
        requestData={request}
      />

    </div>
  );
}
