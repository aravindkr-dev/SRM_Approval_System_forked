# Fix SOP Reference Number Duplication

## Issue
The SOP verifier was seeing the SOP Reference Number input field twice when the request status was `budget_completed`. This created a confusing user interface with duplicate input fields.

## Root Cause
The ApprovalModal component had two sections that both rendered SOP reference input fields:

1. **General SOP UI** (lines ~250-280): For non-parallel verification statuses
2. **Specific SOP UI** (lines ~590-620): For `budget_completed` status

When the status was `budget_completed`, both sections were being rendered because:
- The general section condition `isSop && !isParallelVerification` was true (since `budget_completed` ≠ `parallel_verification`)
- The specific section condition `isSop && currentStatus === 'budget_completed'` was also true

## Solution
Updated the condition for the general SOP UI section to exclude the `budget_completed` status:

**Before:**
```typescript
{isSop && !isParallelVerification && (
```

**After:**
```typescript
{isSop && !isParallelVerification && currentStatus !== 'budget_completed' && (
```

## Impact

### Before Fix:
```
Process Request
Current status: budget_completed

SOP Reference Number          <- First input (general section)
[input field]
Not Available

Notes
[textarea]

Complete SOP Verification     <- Second section header
Budget verification is complete. Complete your SOP verification to finalize the process.

SOP Reference Number          <- Second input (specific section) 
[input field]
Mark as Not Available

Notes
[textarea]
```

### After Fix:
```
Process Request
Current status: budget_completed

Complete SOP Verification
Budget verification is complete. Complete your SOP verification to finalize the process.

SOP Reference Number          <- Single input field
[input field]
Mark as Not Available

Notes
[textarea]
```

## Benefits
1. **Clean UI**: No more duplicate input fields
2. **Clear Context**: Only the relevant section with proper context is shown
3. **Better UX**: SOP verifier sees clear instructions about completing verification after budget is done
4. **Consistent Behavior**: Each status shows only the appropriate UI section

## Status: ✅ FIXED

The SOP reference number duplication has been resolved. SOP verifiers now see only one input field with the appropriate context for the `budget_completed` status.