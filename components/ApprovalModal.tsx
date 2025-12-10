'use client';

import { useState, useRef } from 'react';

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
    budgetAllocated?: number;
    budgetSpent?: number;
    budgetAvailable?: number;
    forwardedMessage?: string;
    attachments?: string[];
    target?: string;
    sopReference?: string;
  }) => Promise<void>;
  currentStatus: string;
  userRole?: string;
}

export default function ApprovalModal({
  requestId,
  isOpen,
  onClose,
  onApprove,
  currentStatus,
  userRole
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

  const [budgetAllocated, setBudgetAllocated] = useState<number>(0);
  const [budgetSpent, setBudgetSpent] = useState<number>(0);
  const budgetAvailable = Math.max(budgetAllocated - budgetSpent, 0);

  const isSop = userRole === 'sop_verifier';
  const isAccountant = userRole === 'accountant';
  const isBudgetClarification = currentStatus === 'budget_clarification';

  const isManager = userRole === 'institution_manager';
  const isDean = userRole === 'dean';
  const canRequestClarification = isManager || isDean;

  const resetState = () => {
    setAction('approve');
    setNotes('');
    setForwardedMessage('');
    setAttachments([]);
    setUploadedFiles([]);
    setBudgetAllocated(0);
    setBudgetSpent(0);
    setSopReference('');
    setSopRefNotAvailable(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isSop && !sopReference && !sopRefNotAvailable) {
        setError("Please enter reference number or mark 'Not Available'.");
        setIsSubmitting(false);
        return;
      }

      await onApprove({
        action: isSop ? 'clarify' : action,
        notes,
        forwardedMessage: action === 'forward' ? forwardedMessage : undefined,
        budgetAllocated: isAccountant && isBudgetClarification ? budgetAllocated : undefined,
        budgetSpent: isAccountant && isBudgetClarification ? budgetSpent : undefined,
        budgetAvailable: isAccountant && isBudgetClarification ? budgetAvailable : undefined,
        target,
        attachments: [...attachments, ...uploadedFiles.map(f => f.url)],
        sopReference: isSop ? (sopRefNotAvailable ? 'Not Available' : sopReference) : undefined,
      });

      resetState();
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Process Request</h3>
          <p className="text-sm text-gray-500">Current status: {currentStatus}</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-2 rounded">
              {error}
            </div>
          )}

          {/* ===================== SOP UI ====================== */}
          {isSop && (
            <div className="space-y-4">

              <div>
                <label className="text-sm font-medium">Reference Number</label>
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

          {/* ===================== ACCOUNTANT ====================== */}
          {isAccountant && isBudgetClarification && (
            <div className="space-y-3">

              <div>
                <label className="text-sm font-medium">Budget Allocated</label>
                <input
                  type="number"
                  value={budgetAllocated}
                  onChange={(e) => setBudgetAllocated(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Budget Spent</label>
                <input
                  type="number"
                  value={budgetSpent}
                  onChange={(e) => setBudgetSpent(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Available Budget</label>
                <input
                  type="number"
                  value={budgetAvailable}
                  disabled
                  className="w-full p-2 border rounded bg-gray-100"
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

          {/* ===================== MANAGER / DEAN / OTHERS ====================== */}
          {!isSop && !(isAccountant && isBudgetClarification) && (
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
                  <option value="forward">Forward</option>
                </select>
              </div>

              {/* TARGET */}
              {action === "clarify" && canRequestClarification && (
                <div>
                  <label className="text-sm font-medium">Clarification Target</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    {userRole === "institution_manager" && (
                      <>
                        <option value="sop">SOP Verifier</option>
                        <option value="accountant">Accountant</option>
                      </>
                    )}
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
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Processing…' : 'Submit'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
