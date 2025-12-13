# Manager Review Visibility Debug

## Issue
Manager is not seeing requests in `manager_review` status in their pending approvals.

## Expected Behavior
When a request is in `MANAGER_REVIEW` status, it should appear in the manager's (Institution Manager role) pending approvals.

## Investigation Steps

### 1. Approval Engine Verification
The approval engine should correctly identify that `INSTITUTION_MANAGER` is the required approver for `MANAGER_REVIEW` status.

**Transitions FROM MANAGER_REVIEW:**
- `MANAGER_REVIEW` → `PARALLEL_VERIFICATION` (requires `INSTITUTION_MANAGER`)
- `MANAGER_REVIEW` → `VP_APPROVAL` (requires `INSTITUTION_MANAGER`)
- `MANAGER_REVIEW` → `DEAN_REVIEW` (requires `INSTITUTION_MANAGER`)
- `MANAGER_REVIEW` → `REJECTED` (requires `INSTITUTION_MANAGER`)

### 2. Request Visibility Logic
The visibility system should:
1. Check if current status requires user's role ✓
2. If user hasn't been involved, check if request has reached their level ✓
3. Categorize as 'pending' if user needs to act ✓

### 3. Changes Made

#### Updated Request Visibility (`lib/request-visibility.ts`)
**Removed obsolete status:**
```typescript
// Before
[UserRole.INSTITUTION_MANAGER]: [
  RequestStatus.MANAGER_REVIEW,
  RequestStatus.PARALLEL_VERIFICATION,
  RequestStatus.INSTITUTION_VERIFIED  // ← Removed this
],

// After
[UserRole.INSTITUTION_MANAGER]: [
  RequestStatus.MANAGER_REVIEW,
  RequestStatus.PARALLEL_VERIFICATION
],
```

#### Added Debug Logging (`app/api/approvals/route.ts`)
Added comprehensive debugging to track:
- Total `MANAGER_REVIEW` requests in system
- Required approvers for `MANAGER_REVIEW` status
- User's role and authorization
- Visibility analysis for each `MANAGER_REVIEW` request

#### Created Debug Endpoint (`app/api/debug/visibility/route.ts`)
New endpoint to test:
- Approval engine behavior
- Request visibility analysis
- Filtering results

## Debugging Process

### Step 1: Check Approval Engine
```typescript
const requiredApprovers = approvalEngine.getRequiredApprover(RequestStatus.MANAGER_REVIEW);
// Should return: [UserRole.INSTITUTION_MANAGER]
```

### Step 2: Check Request Visibility
```typescript
const visibility = analyzeRequestVisibility(request, UserRole.INSTITUTION_MANAGER, userId);
// Should return: { canSee: true, category: 'pending', reason: 'Waiting for your approval' }
```

### Step 3: Check Filtering
```typescript
const visibleRequests = filterRequestsByVisibility(requests, UserRole.INSTITUTION_MANAGER, userId, 'pending');
// Should include MANAGER_REVIEW requests
```

## Potential Root Causes

1. **User Role Mismatch**: Manager user doesn't have `institution_manager` role
2. **Request History Issues**: Visibility logic confused by request history
3. **Status Transition Issues**: Request not properly transitioning to `MANAGER_REVIEW`
4. **Database Issues**: Requests not being saved with correct status

## Testing Steps

1. **Check User Role**: Verify manager has `institution_manager` role
2. **Check Request Status**: Verify requests are actually in `manager_review` status
3. **Test Approval Engine**: Use debug endpoint to verify approval engine behavior
4. **Test Visibility**: Use debug endpoint to verify visibility analysis
5. **Check Console Logs**: Review debug output in approvals API

## Debug Endpoints

### Check System Status
```
GET /api/debug/status
```

### Check Visibility Logic
```
GET /api/debug/visibility
```

### Check Approvals with Debug Logging
```
GET /api/approvals
```
(Check console logs for detailed debugging information)

## Expected Debug Output

When manager calls `/api/approvals`, should see:
```
[DEBUG] Total MANAGER_REVIEW requests in system: X
[DEBUG] Required approvers for MANAGER_REVIEW: ['institution_manager']
[DEBUG] User role: institution_manager
[DEBUG] Is user authorized for MANAGER_REVIEW?: true
[DEBUG] Request 123: canSee=true, category=pending, reason=Waiting for your approval
[DEBUG] Visible pending requests for user: X
```

## Status: 🔍 DEBUGGING

Added comprehensive debugging to identify why manager is not seeing `MANAGER_REVIEW` requests in pending approvals.