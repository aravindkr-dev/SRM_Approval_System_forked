# Process Button Authorization Fix

## Issue
SOP verifiers (and other users) were seeing the "Process Request" button for requests they weren't authorized to process, leading to "Failed to process approval" errors when they tried to submit.

## Root Cause
The "Process Request" button was shown for any user who wasn't a requester:
```typescript
{currentUser?.role !== 'requester' && (
```

This meant SOP verifiers could see the button for `manager_review` status requests, even though only institution managers are authorized to process those requests.

## Solution
Added proper authorization check using the approval engine to only show the "Process Request" button when the user is actually authorized to process the request at its current status:

```typescript
{(() => {
  // Check if current user is authorized to process this request status
  if (currentUser?.role === 'requester') return null;
  
  const requiredApprovers = approvalEngine.getRequiredApprover(request.status as RequestStatus);
  const isAuthorized = requiredApprovers.includes(currentUser?.role as UserRole);
  
  return isAuthorized ? (
    <div className="mt-6">
      <button
        onClick={() => setIsApprovalModalOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Process Request
      </button>
    </div>
  ) : null;
})()}
```

## How It Works
1. **Check User Role**: Skip if user is a requester
2. **Get Required Approvers**: Use approval engine to get who can approve the current status
3. **Authorization Check**: Only show button if current user's role is in the required approvers list
4. **Dynamic Display**: Button appears/disappears based on user authorization for specific request status

## Benefits
1. **Prevents Confusion**: Users only see process button when they can actually process the request
2. **Better UX**: No more "Failed to process approval" errors from unauthorized attempts
3. **Clear Workflow**: Users understand when they can and cannot act on requests
4. **Security**: Frontend authorization matches backend authorization

## Status-Role Mapping Examples
- `manager_review` → Only `institution_manager` sees button
- `parallel_verification` → Only `sop_verifier` and `accountant` see button
- `vp_approval` → Only `vp` sees button
- `sop_verification` → Only `sop_verifier` sees button

## Files Modified
- `app/dashboard/requests/[id]/page.tsx` - Added authorization check for Process Request button

## Testing
1. SOP verifier should NOT see "Process Request" button for `manager_review` status
2. Institution manager SHOULD see "Process Request" button for `manager_review` status
3. Each role should only see the button when authorized for the current request status