import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Request from '../../../../../models/Request';
import User from '../../../../../models/User';
import { getCurrentUser } from '../../../../../lib/auth';
import { RequestStatus, ActionType, UserRole } from '../../../../../lib/types';
import { approvalEngine } from '../../../../../lib/approval-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      action,
      notes,
      budgetAllocated,
      budgetSpent,
      budgetAvailable,
      forwardedMessage,
      attachments,
      target,
      sopReference,
    } = await request.json();

    // Validate action
    if (!['approve', 'reject', 'clarify', 'forward'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const requestRecord = await Request.findById(params.id);

    if (!requestRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Role check
    const requiredApprovers = approvalEngine.getRequiredApprover(
      requestRecord.status
    );

    if (!requiredApprovers.includes(user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Not authorized to approve this request' },
        { status: 403 }
      );
    }

    const previousStatus = requestRecord.status;

    let nextStatus = requestRecord.status;
    let actionType = ActionType.APPROVE;

    // Handle different actions
    switch (action) {

      case 'approve':
        nextStatus =
          approvalEngine.getNextStatus(
            requestRecord.status,
            ActionType.APPROVE,
            user.role as UserRole,
            { budgetAvailable }
          ) || requestRecord.status;
        actionType = ActionType.APPROVE;
        break;

      case 'reject':
        nextStatus = RequestStatus.REJECTED;
        actionType = ActionType.REJECT;
        break;

      case 'clarify':
        if (user.role === UserRole.INSTITUTION_MANAGER && target) {
          nextStatus =
            approvalEngine.getNextStatus(
              requestRecord.status,
              ActionType.CLARIFY,
              user.role as UserRole,
              { clarificationType: target }
            ) || requestRecord.status;
        } else if (user.role === UserRole.DEAN && target) {
          nextStatus =
            approvalEngine.getNextStatus(
              requestRecord.status,
              ActionType.CLARIFY,
              user.role as UserRole,
              { clarificationType: 'department' }
            ) || requestRecord.status;
        } else {
          nextStatus = RequestStatus.CLARIFICATION_REQUIRED;
        }
        actionType = ActionType.CLARIFY;
        break;

      case 'forward':
        nextStatus =
          approvalEngine.getNextStatus(
            requestRecord.status,
            ActionType.FORWARD,
            user.role as UserRole,
            {}
          ) || requestRecord.status;
        actionType = ActionType.FORWARD;
        break;
    }

    // 🔹 **SPECIAL FIX — VP → HOI**
    if (
      user.role === UserRole.VP &&
      requestRecord.status === RequestStatus.VP_APPROVAL
    ) {
      nextStatus = RequestStatus.HOI_APPROVAL;
    }

    // 🔹 SOP stores reference number
    if (user.role === UserRole.SOP_VERIFIER && sopReference) {
      requestRecord.sopReference = sopReference;
      await requestRecord.save();
    }

    // BUILD HISTORY ENTRY
    const historyEntry: any = {
      action: actionType,
      actor: user.id,
      previousStatus,
      newStatus: nextStatus,
      timestamp: new Date(),
    };

    if (action === 'forward') {
      historyEntry.forwardedMessage = forwardedMessage || notes || '';
      if (attachments?.length) historyEntry.attachments = attachments;
    } else {
      if (notes) historyEntry.notes = notes;
      if (budgetAvailable !== undefined)
        historyEntry.budgetAvailable = budgetAvailable;
    }

    // 🔹 ACCOUNTANT BUDGET VALUES
    if (user.role === UserRole.ACCOUNTANT) {
      if (typeof budgetAllocated === 'number')
        historyEntry.budgetAllocated = budgetAllocated;

      if (typeof budgetSpent === 'number')
        historyEntry.budgetSpent = budgetSpent;

      if (typeof budgetAllocated === 'number' && typeof budgetSpent === 'number')
        historyEntry.budgetBalance = budgetAllocated - budgetSpent;
    }

    // PREPARE UPDATE
    const updateData: any = {
      $push: { history: historyEntry },
    };

    if (nextStatus !== previousStatus) {
      updateData.$set = { status: nextStatus };
    }

    // Save accountant values to Request document
    if (user.role === UserRole.ACCOUNTANT) {
      if (!updateData.$set) updateData.$set = {};
      updateData.$set.budgetAllocated = budgetAllocated;
      updateData.$set.budgetSpent = budgetSpent;
      updateData.$set.budgetBalance = budgetAllocated - budgetSpent;
    }

    // Add attachments (except forward)
    if (action !== 'forward' && attachments?.length) {
      if (!updateData.$set) updateData.$set = {};
      updateData.$set.attachments = [
        ...requestRecord.attachments,
        ...attachments,
      ];
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    )
      .populate('requester', 'name email empId')
      .populate('history.actor', 'name email empId');

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Approve request error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
