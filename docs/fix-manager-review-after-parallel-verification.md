# Fix Manager Review After Parallel Verification

## Issue
After parallel verification is complete and the request returns to `manager_review` status, it's not showing up in the manager's pending approvals.

## Root Cause
The visibility logic was incorrectly treating requests as "already handled" by the manager if they had any previous involvement, even when the manager needed to act again on the current status.

### Problematic Logic (Before):
```typescript
if (needsUserAction && !involvement.hasApproved) {
  return { 
    category: 'pending', 
    reason: 'Waiting for your approval',
    userAction: null
  };
}
```

**Problem:** The condition `!involvement.hasApproved` prevented requests from being categorized as 'pending' if the manager had previously approved them (e.g., when sending to parallel verification).

## Scenario
1. **Manager sends to parallel verification**: Request goes from `MANAGER_REVIEW` → `PARALLEL_VERIFICATION`
   - Manager's `involvement.hasApproved` becomes `true`
2. **SOP and Accountant complete**: Request returns to `MANAGER_REVIEW` 
3. **Manager needs to route**: Request requires manager action again
4. **Visibility issue**: Despite needing manager action, request not shown as 'pending' because `involvement.hasApproved` is `true`

## Solution
Updated the visibility logic to check if the user has acted on the **current status**, not just if they've ever been involved.

### Fixed Logic (After):
```typescript
if (needsUserAction) {
  // Check if user has already acted on the CURRENT status
  const hasActedOnCurrentStatus = involvement.hasBeenInvolved && 
    request.history?.some((h: any) => 
      (h.actor?._id?.toString() === userId || h.actor?.toString() === userId) &&
      h.newStatus === currentStatus &&
      (h.action === ActionType.APPROVE || h.action === ActionType.FORWARD)
    );

  if (!hasActedOnCurrentStatus) {
    return { 
      category: 'pending', 
      reason: 'Waiting for your approval',
      userAction: null
    };
  }
}
```

## Key Changes

### 1. Status-Specific Action Check
Instead of checking if user has ever approved, now checks if user has acted on the current status:
- Looks for history entries where the user acted AND the `newStatus` matches current status
- Considers both `APPROVE` and `FORWARD` actions as "acted"

### 2. Enhanced Debug Logging
Added specific debugging for post-parallel-verification scenarios:
- Tracks if request has parallel verification history
- Shows manager's previous actions
- Displays current status and visibility analysis

## Workflow Examples

### Example 1: Manager Routing After Parallel Verification
1. **Initial**: `MANAGER_REVIEW` (manager acts) → `PARALLEL_VERIFICATION`
2. **SOP completes**: `PARALLEL_VERIFICATION` → `SOP_COMPLETED`  
3. **Accountant completes**: `SOP_COMPLETED` → `MANAGER_REVIEW`
4. **Manager routing**: Request appears in pending approvals ✅

### Example 2: Manager Routing After Budget Verification
1. **Initial**: `MANAGER_REVIEW` (manager acts) → `PARALLEL_VERIFICATION`
2. **Accountant completes**: `PARALLEL_VERIFICATION` → `BUDGET_COMPLETED`
3. **SOP completes**: `BUDGET_COMPLETED` → `MANAGER_REVIEW`
4. **Manager routing**: Request appears in pending approvals ✅

## Benefits

1. **Correct Workflow**: Requests properly return to manager for routing decisions
2. **Multiple Actions**: Manager can act multiple times on same request at different stages
3. **Status-Aware**: Logic considers the specific status, not just overall involvement
4. **Better Debugging**: Enhanced logging to track post-verification scenarios

## Debug Information

When accessing `/api/approvals` as manager, console will show:
```
[DEBUG] Request 123:
  - canSee=true, category=pending, reason=Waiting for your approval
  - hasParallelVerificationHistory=true
  - managerPreviousActions=1
  - currentStatus=manager_review
```

## Status: ✅ FIXED

Manager will now see requests in their pending approvals when they return to `manager_review` status after parallel verification, allowing them to make the routing decision based on budget availability.