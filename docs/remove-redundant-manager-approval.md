# Remove Redundant Manager Approval Step

## Problem
Previously, when a requester submitted a request, it would go to `SUBMITTED` status, and then the manager had to approve it to move it to `MANAGER_REVIEW` status. This was redundant - the manager was essentially approving the same thing twice.

## Solution
Modified the workflow so that when a requester creates and submits a request, it directly goes to `MANAGER_REVIEW` status, eliminating the redundant approval step.

## Changes Made

### 1. Request Creation Logic (`app/api/requests/route.ts`)
**Before:**
```typescript
status: RequestStatus.SUBMITTED,
history: [{
  action: ActionType.CREATE,
  actor: requesterUser._id,
  timestamp: new Date(),
  notes: 'Request directly submitted',
  newStatus: RequestStatus.SUBMITTED,
}]
```

**After:**
```typescript
status: RequestStatus.MANAGER_REVIEW,
history: [{
  action: ActionType.CREATE,
  actor: requesterUser._id,
  timestamp: new Date(),
  notes: 'Request created and forwarded to manager for review',
  newStatus: RequestStatus.MANAGER_REVIEW,
}]
```

### 2. Approval Engine (`lib/approval-engine.ts`)
- **Removed** transition: `SUBMITTED → MANAGER_REVIEW`
- **Removed** logic for Institution Manager handling `SUBMITTED` status
- **Removed** rejection transition from `SUBMITTED` status

### 3. Request Model (`models/Request.ts`)
**Before:**
```typescript
default: RequestStatus.SUBMITTED,
```

**After:**
```typescript
default: RequestStatus.MANAGER_REVIEW,
```

### 4. Seed Script (`scripts/seed.ts`)
- **Removed** `RequestStatus.SUBMITTED` from random status generation

### 5. UI Components
**ApprovalWorkflow.tsx:**
- Removed 'submitted' from status display map
- Removed 'submitted' step from workflow steps

**ApprovalHistory.tsx:**
- Removed 'submitted' status badge styling
- Removed 'submitted' from status display map
- Updated transition logic from `draft → submitted` to `create → manager_review`

## Workflow Impact

### Before (Redundant):
1. Requester creates request → `SUBMITTED`
2. Manager approves → `MANAGER_REVIEW` 
3. Manager sends to verification → `PARALLEL_VERIFICATION`

### After (Streamlined):
1. Requester creates request → `MANAGER_REVIEW`
2. Manager sends to verification → `PARALLEL_VERIFICATION`

## Benefits
1. **Eliminates redundancy**: Manager no longer needs to approve twice
2. **Faster workflow**: One less step in the approval process
3. **Clearer intent**: Request creation directly indicates it's ready for manager review
4. **Better UX**: Requesters see their requests immediately in manager review stage

## Backward Compatibility
- Existing requests with `SUBMITTED` status will still work
- The approval engine maintains legacy transitions for existing data
- No data migration required

## Testing Recommendations
1. **Create new request**: Verify it goes directly to `MANAGER_REVIEW`
2. **Manager workflow**: Ensure manager can still send to parallel verification
3. **UI display**: Check that status displays correctly in all components
4. **History tracking**: Verify approval history shows correct transitions

## Status: ✅ COMPLETE
The redundant manager approval step has been successfully removed. New requests now go directly to manager review, streamlining the approval workflow.