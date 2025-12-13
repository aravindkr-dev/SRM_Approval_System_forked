# Fix Parallel Verification Workflow

## Issues Fixed

### 1. Manager Having to Send Request Multiple Times
**Problem:** Manager was having to send the request to SOP and accountant multiple times instead of once.

**Root Cause:** Inconsistent workflow logic between approval engine and API route.

### 2. Missing Manager Step After Verification Completion
**Problem:** After both SOP and accountant completed their verifications, the request should return to manager's pending approvals for routing decision, but it wasn't happening correctly.

**Root Cause:** The approval engine was transitioning directly to `INSTITUTION_VERIFIED` status instead of returning to `MANAGER_REVIEW`.

## Solution

### Updated Workflow Logic

**Before (Incorrect):**
1. Manager sends to `PARALLEL_VERIFICATION`
2. SOP completes → `SOP_COMPLETED`
3. Accountant completes → `INSTITUTION_VERIFIED` (bypassing manager)
4. Manager routes from `INSTITUTION_VERIFIED` → VP/Dean

**After (Correct):**
1. Manager sends to `PARALLEL_VERIFICATION`
2. SOP completes → `SOP_COMPLETED`
3. Accountant completes → `MANAGER_REVIEW` (returns to manager)
4. Manager routes from `MANAGER_REVIEW` → VP/Dean

### Changes Made

#### 1. Updated Approval Engine Transitions (`lib/approval-engine.ts`)

**Before:**
```typescript
// When one verification is complete, waiting for the other
{ from: RequestStatus.SOP_COMPLETED, to: RequestStatus.INSTITUTION_VERIFIED, requiredRole: UserRole.ACCOUNTANT },
{ from: RequestStatus.BUDGET_COMPLETED, to: RequestStatus.INSTITUTION_VERIFIED, requiredRole: UserRole.SOP_VERIFIER },

// After institution verification - route based on budget availability
{ from: RequestStatus.INSTITUTION_VERIFIED, to: RequestStatus.VP_APPROVAL, requiredRole: UserRole.INSTITUTION_MANAGER },
{ from: RequestStatus.INSTITUTION_VERIFIED, to: RequestStatus.DEAN_REVIEW, requiredRole: UserRole.INSTITUTION_MANAGER },
```

**After:**
```typescript
// When one verification is complete, waiting for the other
{ from: RequestStatus.SOP_COMPLETED, to: RequestStatus.MANAGER_REVIEW, requiredRole: UserRole.ACCOUNTANT },
{ from: RequestStatus.BUDGET_COMPLETED, to: RequestStatus.MANAGER_REVIEW, requiredRole: UserRole.SOP_VERIFIER },

// Removed INSTITUTION_VERIFIED transitions - go directly back to manager
```

#### 2. Updated Approval Engine Logic

**SOP Verifier:**
```typescript
// Before
if (currentStatus === RequestStatus.BUDGET_COMPLETED) {
  return RequestStatus.INSTITUTION_VERIFIED;
}

// After
if (currentStatus === RequestStatus.BUDGET_COMPLETED) {
  return RequestStatus.MANAGER_REVIEW;
}
```

**Accountant:**
```typescript
// Before
if (currentStatus === RequestStatus.SOP_COMPLETED) {
  return RequestStatus.INSTITUTION_VERIFIED;
}

// After
if (currentStatus === RequestStatus.SOP_COMPLETED) {
  return RequestStatus.MANAGER_REVIEW;
}
```

#### 3. Updated API Route (`app/api/requests/[id]/approve/route.ts`)

**Before:**
```typescript
case 'budget_available':
  if (user.role === UserRole.INSTITUTION_MANAGER && 
      (requestRecord.status === RequestStatus.INSTITUTION_VERIFIED || requestRecord.status === RequestStatus.MANAGER_REVIEW)) {
```

**After:**
```typescript
case 'budget_available':
  if (user.role === UserRole.INSTITUTION_MANAGER && requestRecord.status === RequestStatus.MANAGER_REVIEW) {
```

## Workflow Flow

### Complete Parallel Verification Process:

1. **Manager Initial Send:**
   - Status: `MANAGER_REVIEW`
   - Action: `forward`
   - Result: `PARALLEL_VERIFICATION`

2. **SOP Verifier Completes:**
   - Status: `PARALLEL_VERIFICATION`
   - Action: `approve`
   - Result: `SOP_COMPLETED`

3. **Accountant Completes:**
   - Status: `SOP_COMPLETED`
   - Action: `approve`
   - Result: `MANAGER_REVIEW` (returns to manager)

4. **Manager Routes Based on Budget:**
   - Status: `MANAGER_REVIEW`
   - Action: `budget_available` → `VP_APPROVAL`
   - Action: `budget_not_available` → `DEAN_REVIEW`

### Alternative Order:

1. **Manager Initial Send:** `MANAGER_REVIEW` → `PARALLEL_VERIFICATION`
2. **Accountant Completes:** `PARALLEL_VERIFICATION` → `BUDGET_COMPLETED`
3. **SOP Verifier Completes:** `BUDGET_COMPLETED` → `MANAGER_REVIEW`
4. **Manager Routes:** `MANAGER_REVIEW` → VP/Dean

## Benefits

1. **Single Send:** Manager only needs to send once to initiate parallel verification
2. **Proper Return:** Request returns to manager after both verifications complete
3. **Clear Workflow:** Manager sees request in pending approvals for routing decision
4. **Consistent Logic:** Approval engine and API route are now aligned
5. **Better UX:** Clear separation between verification phase and routing phase

## UI Impact

### Manager Experience:
1. **First Time:** Sees "Send to SOP & Budget Verification" option
2. **After Verifications:** Sees "Verifications Complete - Route Decision" with budget routing options
3. **Clear Context:** UI shows that both verifications are complete and routing is needed

### SOP/Accountant Experience:
- No change in their workflow
- Still complete verifications as before
- Request properly returns to manager after completion

## Status: ✅ FIXED

The parallel verification workflow now correctly:
- Requires only one send from manager to initiate
- Returns to manager after both verifications complete
- Allows manager to make routing decision from pending approvals