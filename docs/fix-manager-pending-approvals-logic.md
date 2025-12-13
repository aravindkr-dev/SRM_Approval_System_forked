# Fix Manager Pending Approvals Logic

## Issue
Manager can see requests in "My Involvement" page but not in "Pending Approvals" page, even though the request is in `manager_review` status and requires manager action.

## Root Cause Analysis
The visibility logic was incorrectly checking if the manager had acted to CREATE the current status, rather than checking if they had acted AFTER the request was set to the current status.

### Problematic Logic (Before):
```typescript
const hasActedOnCurrentStatus = involvement.hasBeenInvolved && 
  request.history?.some((h: any) => 
    (h.actor?._id?.toString() === userId || h.actor?.toString() === userId) &&
    h.newStatus === currentStatus &&  // ← This was wrong
    (h.action === ActionType.APPROVE || h.action === ActionType.FORWARD)
  );
```

**Problem:** This looked for history entries where the manager was the actor AND the `newStatus` was `manager_review`. But when a request returns to `manager_review` after parallel verification, the SOP/Accountant creates that history entry, not the manager.

## Scenario Breakdown

### What Actually Happens:
1. **Manager sends to parallel verification**: 
   - Manager creates history: `{ actor: manager, newStatus: 'parallel_verification', action: 'forward' }`
2. **SOP completes verification**:
   - SOP creates history: `{ actor: sop, newStatus: 'sop_completed', action: 'approve' }`
3. **Accountant completes verification**:
   - Accountant creates history: `{ actor: accountant, newStatus: 'manager_review', action: 'approve' }`
4. **Manager needs to route**:
   - Current status: `manager_review`
   - Last history entry setting status to `manager_review` was created by accountant, not manager
   - Old logic: "Has manager created a history entry with newStatus=manager_review?" → NO
   - Result: Not categorized as pending ❌

### What Should Happen:
- Check: "Has manager acted AFTER the request was last set to manager_review status?"
- Since accountant set it to `manager_review` and manager hasn't acted since → YES, it's pending ✅

## Solution
Updated the logic to check if the user has acted AFTER the request was set to the current status.

### Fixed Logic (After):
```typescript
if (needsUserAction) {
  // Find when the request was last set to the current status
  const lastStatusChange = request.history
    ?.filter((h: any) => h.newStatus === currentStatus)
    ?.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  // Check if user has acted AFTER the request was set to current status
  const hasActedAfterStatusChange = lastStatusChange && request.history?.some((h: any) => 
    (h.actor?._id?.toString() === userId || h.actor?.toString() === userId) &&
    new Date(h.timestamp) > new Date(lastStatusChange.timestamp) &&
    (h.action === ActionType.APPROVE || h.action === ActionType.FORWARD)
  );

  if (!hasActedAfterStatusChange) {
    return { 
      category: 'pending', 
      reason: 'Waiting for your approval',
      userAction: null
    };
  }
}
```

## Key Changes

### 1. Temporal Logic
- **Before**: "Has user ever created this status?"
- **After**: "Has user acted since this status was last set?"

### 2. Timeline Awareness
- Finds the most recent time the request was set to current status
- Checks if user has acted after that timestamp
- Considers the chronological order of actions

### 3. Enhanced Debug Logging
Added detailed timeline tracking:
- When request was last set to `manager_review`
- Manager actions after that timestamp
- Chronological analysis of the workflow

## Workflow Examples

### Example: Post-Parallel Verification
```
Timeline:
1. 10:00 - Manager: newStatus=parallel_verification (manager acts)
2. 10:30 - SOP: newStatus=sop_completed (sop acts)  
3. 11:00 - Accountant: newStatus=manager_review (accountant acts) ← Last status change
4. 11:15 - Current time: manager needs to act

Analysis:
- Last manager_review status set at: 11:00 by accountant
- Manager actions after 11:00: 0
- Result: category='pending' ✅
```

## Debug Information

Console output will now show:
```
[DEBUG] Request 123:
  - canSee=true, category=pending, reason=Waiting for your approval
  - hasParallelVerificationHistory=true
  - managerPreviousActions=1
  - currentStatus=manager_review
  - lastManagerReviewChange=2024-01-15T11:00:00.000Z
  - managerActionsAfterStatusChange=0
```

## Benefits

1. **Correct Categorization**: Requests properly appear as 'pending' when user needs to act
2. **Timeline Aware**: Logic considers the chronological order of workflow actions
3. **Multiple Cycles**: Supports requests that return to same status multiple times
4. **Better Debugging**: Enhanced logging shows timeline analysis

## Status: ✅ FIXED

Manager will now see requests in "Pending Approvals" when they return to `manager_review` status after parallel verification, allowing proper workflow continuation.