'use client';

import { useState, useRef, useEffect } from 'react';

interface UploadedFile {
  url: string;
  filename: string;
  size: number;
}

interface ApprovalModalProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (data: {
    action: string;
    notes?: string;
    budgetAvailable?: boolean;
    forwardedMessage?: string;
    attachments?: string[];
    target?: string;
    sopReference?: string;
  }) => Promise<void>;
  currentStatus: string;
  userRole?: string;
  requestData?: any; // Add request data to check history
}

export default function ApprovalModal({
  requestId,
  isOpen,
  onClose,
  onApprove,
  currentStatus,
  userRole,
  requestData
}: ApprovalModalProps) {

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [action, setAction] = useState('approve');
  const [notes, setNotes] = useState('');
  const [forwardedMessage, setForwardedMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState<string>();
  const [sopReference, setSopReference] = useState('');
  const [sopRefNotAvailable, setSopRefNotAvailable] = useState(false);

  const [budgetAvailable, setBudgetAvailable] = useState<boolean>(true);

  const isSop = userRole === 'sop_verifier';
  const isAccountant = userRole === 'accountant';


  const isManager = userRole === 'institution_manager';
  const isDean = userRole === 'dean';
  const canRequestClarification = isDean; // Only Dean can request clarification now
  const isInstitutionVerified = currentStatus === 'institution_verified';
  const isParallelVerification = currentStatus === 'parallel_verification';
  
  // Check if we're back at manager review after verifications are complete
  const hasCompletedSopVerification = requestData?.history?.some((h: any) => 
    (h.newStatus === 'sop_completed' || (h.sopReference && h.sopReference !== 'Not Available')) && h.action === 'approve'
  );
  const hasCompletedBudgetVerification = requestData?.history?.some((h: any) => 
    (h.newStatus === 'budget_completed' || h.budgetAvailable !== undefined) && h.action === 'approve'
  );
  const isManagerReviewAfterVerifications = isManager && currentStatus === 'manager_review' && 
    hasCompletedSopVerification && hasCompletedBudgetVerification;
    
  // Set correct default action for manager
  useEffect(() => {
    if (isManager && currentStatus === 'manager_review') {
      if (!isManagerReviewAfterVerifications) {
        setAction('forward'); // Manager sending to parallel verification
      } else {
        setAction('budget_available'); // Manager routing after verifications
      }
    }
  }, [isManager, currentStatus, isManagerReviewAfterVerifications]);

  // Debug logging for manager
  if (isManager && currentStatus === 'manager_review') {
    console.log('Manager debug:', {
      hasCompletedSopVerification,
      hasCompletedBudgetVerification,
      isManagerReviewAfterVerifications,
      historyLength: requestData?.history?.length || 0,
      history: requestData?.history,
      currentAction: action
    });
  }

  const resetState = () => {
    setAction('approve');
    setNotes('');
    setForwardedMessage('');
    setAttachments([]);
    setUploadedFiles([]);
    setBudgetAvailable(true);
    setSopReference('');
    setSopRefNotAvailable(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate SOP reference when SOP is approving
      if (isSop && action === 'approve' && !sopReference && !sopRefNotAvailable) {
        setError("Please enter SOP reference number or mark 'Not Available'.");
        setIsSubmitting(false);
        return;
      }

      // No validation needed for simplified budget check

      // Debug logging for manager submissions
      if (isManager) {
        console.log('Manager submission data:', {
          action,
          currentStatus,
          isManagerReviewAfterVerifications,
          notes,
          forwardedMessage: action === 'forward' ? forwardedMessage : undefined
        });
      }

      // Debug logging for accountant submissions
      if (isAccountant) {
        console.log('Accountant submission data:', {
          action,
          currentStatus,
          budgetAvailable,
          isParallelVerification
        });
      }

      await onApprove({
        action: action,
        notes,
        forwardedMessage: action === 'forward' ? forwardedMessage : undefined,
        budgetAvailable: isAccountant && (isParallelVerification || currentStatus === 'sop_completed' || currentStatus === 'budget_check') ? budgetAvailable : undefined,
        target,
        attachments: [...attachments, ...uploadedFiles.map(f => f.url)],
        sopReference: isSop ? (sopRefNotAvailable ? 'Not Available' : sopReference) : undefined,
      });

      resetState();
      onClose();

    } catch (err) {
      console.error('Approval submission error:', err);
      console.error('Submission data was:', {
        action,
        notes,
        forwardedMessage: action === 'forward' ? forwardedMessage : undefined,
        budgetAvailable: isAccountant && (isParallelVerification || currentStatus === 'sop_completed' || currentStatus === 'budget_check') ? budgetAvailable : undefined,
        target,
        attachments: [...attachments, ...uploadedFiles.map(f => f.url)],
        sopReference: isSop ? (sopRefNotAvailable ? 'Not Available' : sopReference) : undefined,
      });
      
      let errorMessage = 'Failed to process request';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'error' in err) {
        errorMessage = (err as any).error;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
          <h3 className="text-base sm:text-lg font-semibold">Process Request</h3>
          <p className="text-xs sm:text-sm text-gray-500">Current status: {currentStatus}</p>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* ===================== SOP UI - PARALLEL VERIFICATION ====================== */}
          {isSop && isParallelVerification && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">SOP Verification</h4>
                <p className="text-sm text-yellow-700">
                  Complete SOP verification. Budget verification is happening in parallel.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="approve">Complete SOP Verification</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              {action === 'approve' && (
                <div>
                  <label className="text-sm font-medium">SOP Reference Number</label>
                  <input
                    type="text"
                    disabled={sopRefNotAvailable}
                    value={sopReference}
                    onChange={(e) => setSopReference(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter SOP reference number"
                  />
                  <button
                    type="button"
                    className="text-blue-600 text-sm mt-1"
                    onClick={() => {
                      setSopRefNotAvailable(!sopRefNotAvailable);
                      setSopReference('');
                    }}
                  >
                    {sopRefNotAvailable ? 'Undo' : 'Mark as Not Available'}
                  </button>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded"
                  placeholder="Add verification notes..."
                />
              </div>
            </div>
          )}

          {/* ===================== SOP UI - OTHER STATUSES ====================== */}
          {isSop && !isParallelVerification && currentStatus !== 'budget_completed' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">SOP Reference Number</label>
                <input
                  type="text"
                  disabled={sopRefNotAvailable}
                  value={sopReference}
                  onChange={(e) => setSopReference(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <button
                  type="button"
                  className="text-blue-600 text-sm mt-1"
                  onClick={() => {
                    setSopRefNotAvailable(!sopRefNotAvailable);
                    setSopReference('');
                  }}
                >
                  {sopRefNotAvailable ? 'Undo' : 'Not Available'}
                </button>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          )}

          {/* ===================== ACCOUNTANT - PARALLEL VERIFICATION ====================== */}
          {isAccountant && isParallelVerification && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Budget Verification</h4>
                <p className="text-sm text-yellow-700">
                  Check if budget is available for the requested cost estimate. SOP verification is happening in parallel.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="approve">Approve - Budget Available</option>
                  <option value="reject">Reject - Budget Not Available</option>
                </select>
              </div>

              {action === 'approve' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    ✓ Confirming that budget is available for the requested cost estimate.
                  </p>
                </div>
              )}

              {action === 'reject' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    ✗ Budget is not available for the requested cost estimate.
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded"
                  placeholder="Add budget verification notes..."
                />
              </div>
            </div>
          )}

          {/* ===================== ACCOUNTANT - BUDGET CHECK (OLD STATUS) ====================== */}
          {isAccountant && currentStatus === 'budget_check' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Budget Verification</h4>
                <p className="text-sm text-blue-700">
                  Check if budget is available for the requested cost estimate and approve or reject.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="approve">Approve - Budget Available</option>
                  <option value="reject">Reject - Budget Not Available</option>
                </select>
              </div>

              {action === 'approve' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    ✓ Confirming that budget is available for the requested cost estimate.
                  </p>
                </div>
              )}

              {action === 'reject' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    ✗ Budget is not available for the requested cost estimate.
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded"
                  placeholder="Add budget verification notes..."
                />
              </div>
            </div>
          )}



          {/* =============== UNIVERSAL DOCUMENT UPLOAD SECTION (NEW) =============== */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Document Attachments</label>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
              >
                Upload File
              </button>

              <button
                type="button"
                onClick={() => {
                  const url = prompt("Enter document URL:");
                  if (url) setAttachments([...attachments, url]);
                }}
                className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-sm"
              >
                Add URL
              </button>

              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  if (!e.target.files?.length) return;
                  const file = e.target.files[0];
                  const url = URL.createObjectURL(file);

                  setUploadedFiles([{ url, filename: file.name, size: file.size }]);
                }}
              />
            </div>
          </div>

          {/* ===================== INSTITUTION MANAGER - INSTITUTION VERIFIED ====================== */}
          {isManager && isInstitutionVerified && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Route Decision Required</h4>
                <p className="text-sm text-blue-700">
                  Both SOP and Budget verifications are complete. Choose the routing based on budget availability:
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Routing Decision</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="budget_available">Budget Available → VP Approval</option>
                  <option value="budget_not_available">Budget Not Available → Dean Review</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded"
                  placeholder="Explain the routing decision..."
                />
              </div>
            </div>
          )}

          {/* ===================== MANAGER - ROUTE AFTER VERIFICATIONS COMPLETE ====================== */}
          {isManagerReviewAfterVerifications && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Verifications Complete - Route Decision</h4>
                <p className="text-sm text-blue-700">
                  Both SOP and Budget verifications are complete. Choose the next routing based on budget availability.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Routing Decision</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="budget_available">Budget Available → Send to VP</option>
                  <option value="budget_not_available">Budget Not Available → Send to Dean</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded"
                  placeholder="Explain the routing decision..."
                />
              </div>
            </div>
          )}

          {/* ===================== MANAGER - SEND TO PARALLEL VERIFICATION ====================== */}
          {isManager && currentStatus === 'manager_review' && !isManagerReviewAfterVerifications && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Send for Parallel Verification</h4>
                <p className="text-sm text-green-700">
                  This will send the request to both SOP Verifier and Accountant simultaneously for parallel processing.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="forward">Send to SOP & Budget Verification</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded"
                  placeholder="Add any instructions for SOP and Budget verifiers..."
                />
              </div>
            </div>
          )}



          {/* ===================== SOP - COMPLETING AFTER BUDGET DONE ====================== */}
          {isSop && currentStatus === 'budget_completed' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Complete SOP Verification</h4>
                <p className="text-sm text-green-700">
                  Budget verification is complete. Complete your SOP verification to finalize the process.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">SOP Reference Number</label>
                <input
                  type="text"
                  disabled={sopRefNotAvailable}
                  value={sopReference}
                  onChange={(e) => setSopReference(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter SOP reference number"
                />
                <button
                  type="button"
                  className="text-blue-600 text-sm mt-1"
                  onClick={() => {
                    setSopRefNotAvailable(!sopRefNotAvailable);
                    setSopReference('');
                  }}
                >
                  {sopRefNotAvailable ? 'Undo' : 'Mark as Not Available'}
                </button>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded"
                  placeholder="Add verification notes..."
                />
              </div>
            </div>
          )}

          {/* ===================== ACCOUNTANT - COMPLETING AFTER SOP DONE ====================== */}
          {isAccountant && currentStatus === 'sop_completed' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Complete Budget Verification</h4>
                <p className="text-sm text-green-700">
                  SOP verification is complete. Check if budget is available for the requested cost estimate.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="approve">Approve - Budget Available</option>
                  <option value="reject">Reject - Budget Not Available</option>
                </select>
              </div>

              {action === 'approve' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    ✓ Confirming that budget is available for the requested cost estimate.
                  </p>
                </div>
              )}

              {action === 'reject' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    ✗ Budget is not available for the requested cost estimate.
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded"
                  placeholder="Add budget verification notes..."
                />
              </div>
            </div>
          )}

          {/* ===================== VP / HOI / CHIEF DIRECTOR / CHAIRMAN ====================== */}
          {(userRole === 'vp' || userRole === 'head_of_institution' || userRole === 'chief_director' || userRole === 'chairman') && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  {userRole === 'vp' && 'Vice President Approval'}
                  {userRole === 'head_of_institution' && 'Head of Institution Approval'}
                  {userRole === 'chief_director' && 'Chief Director Approval'}
                  {userRole === 'chairman' && 'Chairman Final Approval'}
                </h4>
                <p className="text-sm text-blue-700">
                  {userRole === 'vp' && 'Review and approve this request to proceed to Head of Institution.'}
                  {userRole === 'head_of_institution' && 'Review and approve this request to proceed to Dean.'}
                  {userRole === 'chief_director' && 'Review and approve this request to proceed to Chairman.'}
                  {userRole === 'chairman' && 'Final approval required to complete the request.'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                </select>
              </div>



              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded"
                  placeholder="Add approval notes..."
                />
              </div>
            </div>
          )}

          {/* ===================== DEAN - CLARIFICATION COMPLETED ====================== */}
          {userRole === 'dean' && currentStatus === 'dean_review' && (() => {
            // Check if there's a recent department response to Dean's clarification
            const latestClarification = requestData?.history?.filter((h: any) => 
              h.action === 'clarify' && h.clarificationTarget && h.actor?.role === 'dean'
            ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            
            const departmentResponse = requestData?.history?.find((h: any) => 
              h.departmentResponse && h.timestamp > (latestClarification?.timestamp || 0)
            );
            
            return latestClarification && departmentResponse ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">✓ Department Response Received</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-green-700">
                      <strong>{departmentResponse.departmentResponse.toUpperCase()}</strong> department has approved your clarification request.
                    </p>
                    <p className="text-sm text-green-600">
                      Originally sent to: <strong>{latestClarification.clarificationTarget.toUpperCase()}</strong>
                    </p>
                    <p className="text-sm text-green-600">
                      Response received: {new Date(departmentResponse.timestamp).toLocaleDateString()} at {new Date(departmentResponse.timestamp).toLocaleTimeString()}
                    </p>
                    {departmentResponse.notes && (
                      <div className="mt-3 p-3 bg-white border border-green-200 rounded">
                        <p className="text-xs font-medium text-green-800 mb-1">Department Notes:</p>
                        <p className="text-sm text-gray-700">{departmentResponse.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="forward">Approve & Send to Chief Director</option>
                    <option value="clarify">Request Additional Clarification</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>

                {action === "clarify" && (
                  <div>
                    <label className="text-sm font-medium">Request clarification from</label>
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">Select...</option>
                      <option value="mma">MMA</option>
                      <option value="hr">HR</option>
                      <option value="audit">Audit</option>
                      <option value="it">IT</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full p-2 border rounded"
                    placeholder="Add notes about the clarification response..."
                  />
                </div>
              </div>
            ) : null;
          })()}

          {/* ===================== DEAN / OTHERS ====================== */}
          {!isManager && 
           !isParallelVerification && 
           !(isSop && (isParallelVerification || currentStatus === 'budget_completed')) &&
           !(isAccountant && (isParallelVerification || currentStatus === 'sop_completed' || currentStatus === 'budget_check')) &&
           !['vp', 'head_of_institution', 'chief_director', 'chairman'].includes(userRole || '') &&
           !(userRole === 'dean' && currentStatus === 'dean_review' && (() => {
             // Hide generic UI if Dean has clarification completed UI showing
             const latestClarification = requestData?.history?.filter((h: any) => 
               h.action === 'clarify' && h.clarificationTarget && h.actor?.role === 'dean'
             ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
             
             const departmentResponse = requestData?.history?.find((h: any) => 
               h.departmentResponse && h.timestamp > (latestClarification?.timestamp || 0)
             );
             
             return latestClarification && departmentResponse;
           })()) && (
            <div className="space-y-4">

              {/* ACTION */}
              <div>
                <label className="text-sm font-medium">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="reject">Reject</option>
                  {canRequestClarification && <option value="clarify">Request Clarification</option>}
                  {['mma', 'hr', 'audit', 'it'].includes(userRole || '') && currentStatus === 'department_checks' ? (
                    <option value="forward">Approve</option>
                  ) : (
                    <option value="forward">Approve & Send to Chief Director</option>
                  )}
                </select>
              </div>

              {/* TARGET */}
              {action === "clarify" && canRequestClarification && (
                <div>
                  <label className="text-sm font-medium">Request clarification from</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select...</option>
                    {userRole === "dean" && (
                      <>
                        <option value="mma">MMA</option>
                        <option value="hr">HR</option>
                        <option value="audit">Audit</option>
                        <option value="it">IT</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* DEPARTMENT USERS RESPONDING TO CLARIFICATION */}
              {['mma', 'hr', 'audit', 'it'].includes(userRole || '') && currentStatus === 'department_checks' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-orange-800 mb-2">Department Clarification Response</h4>
                  <p className="text-sm text-orange-700">
                    The Dean has requested clarification from your department. Please provide your response.
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded"
                />
              </div>

            </div>
          )}

          {/* SUBMIT BUTTONS */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm sm:text-base transition active:scale-95 order-2 sm:order-1"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 text-sm sm:text-base transition active:scale-95 order-1 sm:order-2"
            >
              {isSubmitting ? 'Processing…' : 'Submit'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
