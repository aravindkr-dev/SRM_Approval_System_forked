# Approvals Page Debugging Fix

## Issue
Approvers (non-requesters) are not able to see any requests on the approvals page.

## Root Cause Analysis
The issue could be one of several factors:

1. **All users are requesters**: If all users in the system have the "requester" role, they would be redirected away from the approvals page
2. **No requests at approval stages**: If all requests are still in "submitted" status and haven't progressed through the workflow
3. **Overly restrictive filtering**: The approvals API was filtering too strictly based on exact status matches

## Solution Implemented

### 1. Simplified Approvals API Filter
**Before**: Complex role-based filtering that only showed requests at specific statuses for each role
**After**: Simplified filter that shows all non-completed requests to any non-requester role

```typescript
// Old approach - too restrictive
filter.status = RequestStatus.MANAGER_REVIEW; // Only for managers

// New approach - more inclusive
filter.status = { 
  $nin: [RequestStatus.APPROVED, RequestStatus.REJECTED] 
}; // All pending requests for any approver
```

### 2. Removed Complex Secondary Filtering
**Before**: Additional filtering based on approval engine and user involvement
**After**: Show all requests that match the basic filter

### 3. Role-Based Access Control
- **Requesters**: Automatically redirected to `/dashboard/requests`
- **All Other Roles**: Can access `/dashboard/approvals` and see pending requests

## Testing Steps

### To Test the Fix:
1. **Create a non-requester user**:
   - Use signup page or debug endpoint
   - Assign role like "institution_manager", "accountant", etc.

2. **Create some requests**:
   - Login as a requester
   - Create one or more requests
   - Submit them (they should be in "submitted" status)

3. **Test approvals access**:
   - Login as the non-requester user
   - Navigate to dashboard (should see approvals in navigation)
   - Click on approvals or stats cards
   - Should see the submitted requests

### Debug Endpoints Created:
- `GET /api/debug/requests` - Shows all requests in system with status counts
- `GET /api/debug/create-test-user` - Shows all users in system
- `POST /api/debug/create-test-user` - Creates a test manager user

## Expected Behavior After Fix

### For Institution Managers:
- Should see all submitted requests that need initial review
- Can process requests through the approval workflow

### For Other Approvers:
- Should see requests that are at their approval level
- Can see requests they've been involved with previously

### For Requesters:
- Cannot access approvals page (redirected to requests)
- Can only see their own requests

## Next Steps

1. **Test with actual users**: Create users with different roles and test the workflow
2. **Refine filtering**: Once basic functionality works, can add more specific role-based filtering
3. **Add proper status progression**: Ensure requests move through the workflow correctly
4. **Monitor performance**: With less restrictive filtering, monitor query performance

## Files Modified

1. **app/api/approvals/route.ts**
   - Simplified `getPendingApprovalsFilter()` function
   - Removed complex secondary filtering
   - Made filtering more inclusive for debugging

2. **app/api/debug/requests/route.ts** (new)
   - Debug endpoint to see all requests and their statuses

3. **app/api/debug/create-test-user/route.ts** (new)
   - Debug endpoint to create test users and view existing users

## Rollback Plan
If this causes performance issues or shows too many requests:
1. Revert to the previous filtering logic
2. Add back role-specific status filtering
3. Implement pagination and search to handle large result sets