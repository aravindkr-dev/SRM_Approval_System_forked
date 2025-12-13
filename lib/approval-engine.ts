import { RequestStatus, ActionType, UserRole } from "./types";

type Transition = {
  from: RequestStatus;
  to: RequestStatus;
  requiredRole: UserRole | UserRole[];
};

export const approvalEngine = {
  transitions: <Transition[]>[
    // Institution Manager sends to parallel verification
    { from: RequestStatus.MANAGER_REVIEW, to: RequestStatus.PARALLEL_VERIFICATION, requiredRole: UserRole.INSTITUTION_MANAGER },

    // Parallel verification - both SOP and Accountant can work simultaneously
    { from: RequestStatus.PARALLEL_VERIFICATION, to: RequestStatus.SOP_COMPLETED, requiredRole: UserRole.SOP_VERIFIER },
    { from: RequestStatus.PARALLEL_VERIFICATION, to: RequestStatus.BUDGET_COMPLETED, requiredRole: UserRole.ACCOUNTANT },

    // When one verification is complete, waiting for the other
    { from: RequestStatus.SOP_COMPLETED, to: RequestStatus.MANAGER_REVIEW, requiredRole: UserRole.ACCOUNTANT },
    { from: RequestStatus.BUDGET_COMPLETED, to: RequestStatus.MANAGER_REVIEW, requiredRole: UserRole.SOP_VERIFIER },




    
    // Manager routing after verifications complete (back at manager_review)
    { from: RequestStatus.MANAGER_REVIEW, to: RequestStatus.VP_APPROVAL, requiredRole: UserRole.INSTITUTION_MANAGER },
    { from: RequestStatus.MANAGER_REVIEW, to: RequestStatus.DEAN_REVIEW, requiredRole: UserRole.INSTITUTION_MANAGER },

    // VP flow (when budget available)
    { from: RequestStatus.VP_APPROVAL, to: RequestStatus.HOI_APPROVAL, requiredRole: UserRole.VP },

    // HOI flow
    { from: RequestStatus.HOI_APPROVAL, to: RequestStatus.DEAN_REVIEW, requiredRole: UserRole.HEAD_OF_INSTITUTION },

    // Dean can send to departments or approve directly to chief director
    { from: RequestStatus.DEAN_REVIEW, to: RequestStatus.DEPARTMENT_CHECKS, requiredRole: UserRole.DEAN },
    { from: RequestStatus.DEAN_REVIEW, to: RequestStatus.CHIEF_DIRECTOR_APPROVAL, requiredRole: UserRole.DEAN },

    // Department responses back to dean
    {
      from: RequestStatus.DEPARTMENT_CHECKS,
      to: RequestStatus.DEAN_REVIEW,
      requiredRole: [UserRole.MMA, UserRole.HR, UserRole.AUDIT, UserRole.IT]
    },

    // After dean verification
    { from: RequestStatus.DEAN_VERIFICATION, to: RequestStatus.CHIEF_DIRECTOR_APPROVAL, requiredRole: UserRole.DEAN },

    // Final approvals
    { from: RequestStatus.CHIEF_DIRECTOR_APPROVAL, to: RequestStatus.CHAIRMAN_APPROVAL, requiredRole: UserRole.CHIEF_DIRECTOR },
    { from: RequestStatus.CHAIRMAN_APPROVAL, to: RequestStatus.APPROVED, requiredRole: UserRole.CHAIRMAN },

    // Legacy workflow transitions (for backward compatibility)
    { from: RequestStatus.SOP_VERIFICATION, to: RequestStatus.BUDGET_CHECK, requiredRole: UserRole.SOP_VERIFIER },
    { from: RequestStatus.BUDGET_CHECK, to: RequestStatus.VP_APPROVAL, requiredRole: UserRole.ACCOUNTANT },
    { from: RequestStatus.BUDGET_CHECK, to: RequestStatus.DEAN_REVIEW, requiredRole: UserRole.ACCOUNTANT },

    


    // Rejection from any stage
    { from: RequestStatus.MANAGER_REVIEW, to: RequestStatus.REJECTED, requiredRole: UserRole.INSTITUTION_MANAGER },
    { from: RequestStatus.PARALLEL_VERIFICATION, to: RequestStatus.REJECTED, requiredRole: [UserRole.SOP_VERIFIER, UserRole.ACCOUNTANT] },
    { from: RequestStatus.SOP_COMPLETED, to: RequestStatus.REJECTED, requiredRole: UserRole.ACCOUNTANT },
    { from: RequestStatus.BUDGET_COMPLETED, to: RequestStatus.REJECTED, requiredRole: UserRole.SOP_VERIFIER },
    { from: RequestStatus.VP_APPROVAL, to: RequestStatus.REJECTED, requiredRole: UserRole.VP },
    { from: RequestStatus.HOI_APPROVAL, to: RequestStatus.REJECTED, requiredRole: UserRole.HEAD_OF_INSTITUTION },
    { from: RequestStatus.DEAN_REVIEW, to: RequestStatus.REJECTED, requiredRole: UserRole.DEAN },
    { from: RequestStatus.DEAN_VERIFICATION, to: RequestStatus.REJECTED, requiredRole: UserRole.DEAN },
    { from: RequestStatus.CHIEF_DIRECTOR_APPROVAL, to: RequestStatus.REJECTED, requiredRole: UserRole.CHIEF_DIRECTOR },
    { from: RequestStatus.CHAIRMAN_APPROVAL, to: RequestStatus.REJECTED, requiredRole: UserRole.CHAIRMAN },
    
    // Legacy workflow rejections
    { from: RequestStatus.SOP_VERIFICATION, to: RequestStatus.REJECTED, requiredRole: UserRole.SOP_VERIFIER },
    { from: RequestStatus.BUDGET_CHECK, to: RequestStatus.REJECTED, requiredRole: UserRole.ACCOUNTANT },
  ],

  getRequiredApprover(status: RequestStatus): UserRole[] {
    const allowed = this.transitions
      .filter(t => t.from === status)
      .flatMap(t => Array.isArray(t.requiredRole) ? t.requiredRole : [t.requiredRole]);

    return Array.from(new Set(allowed));
  },

  getNextStatus(
    currentStatus: RequestStatus,
    action: ActionType,
    role: UserRole,
    context?: any
  ): RequestStatus | null {
    // Handle rejection
    if (action === ActionType.REJECT) {
      return RequestStatus.REJECTED;
    }

    // Handle specific role-based logic
    switch (role) {
      case UserRole.INSTITUTION_MANAGER:
        if (currentStatus === RequestStatus.MANAGER_REVIEW) {
          // Manager sends to parallel verification (both SOP and Accountant)
          if (action === ActionType.FORWARD) {
            return RequestStatus.PARALLEL_VERIFICATION;
          }
        }

        break;

      case UserRole.SOP_VERIFIER:
        if (currentStatus === RequestStatus.PARALLEL_VERIFICATION) {
          return RequestStatus.SOP_COMPLETED; // SOP verification complete
        }
        if (currentStatus === RequestStatus.BUDGET_COMPLETED) {
          // Budget is done, SOP completes the verification - return to manager
          return RequestStatus.MANAGER_REVIEW;
        }
        break;

      case UserRole.ACCOUNTANT:
        if (currentStatus === RequestStatus.PARALLEL_VERIFICATION) {
          return RequestStatus.BUDGET_COMPLETED; // Budget verification complete
        }
        if (currentStatus === RequestStatus.SOP_COMPLETED) {
          // SOP is done, Accountant completes the verification - return to manager
          return RequestStatus.MANAGER_REVIEW;
        }
        // Legacy workflow - budget_check status
        if (currentStatus === RequestStatus.BUDGET_CHECK) {
          // Route based on budget availability (handled in API route)
          return RequestStatus.MANAGER_REVIEW; // Return to manager for routing decision
        }
        break;

      case UserRole.VP:
        if (currentStatus === RequestStatus.VP_APPROVAL) {
          return RequestStatus.HOI_APPROVAL;
        }
        break;

      case UserRole.HEAD_OF_INSTITUTION:
        if (currentStatus === RequestStatus.HOI_APPROVAL) {
          return RequestStatus.DEAN_REVIEW;
        }
        break;

      case UserRole.DEAN:
        if (currentStatus === RequestStatus.DEAN_REVIEW) {
          if (action === ActionType.CLARIFY && context?.clarificationType === 'department') {
            return RequestStatus.DEPARTMENT_CHECKS;
          }
          if (action === ActionType.FORWARD || action === ActionType.APPROVE) {
            return RequestStatus.CHIEF_DIRECTOR_APPROVAL; // Skip dean_verification, go directly to chief director
          }
        }
        if (currentStatus === RequestStatus.DEAN_VERIFICATION) {
          return RequestStatus.CHIEF_DIRECTOR_APPROVAL; // Keep this for backward compatibility
        }
        break;

      case UserRole.MMA:
      case UserRole.HR:
      case UserRole.AUDIT:
      case UserRole.IT:
        if (currentStatus === RequestStatus.DEPARTMENT_CHECKS) {
          // Department can only respond if they were the target
          // Convert role to lowercase to match the stored clarification target
          const roleKey = role.toLowerCase();
          console.log('[DEBUG] Department authorization check:', {
            role,
            roleKey,
            clarificationTarget: context?.clarificationTarget,
            isMatch: context?.clarificationTarget === roleKey
          });
          if (context?.clarificationTarget === roleKey) {
            return RequestStatus.DEAN_REVIEW;
          }
        }
        break;

      case UserRole.CHIEF_DIRECTOR:
        if (currentStatus === RequestStatus.CHIEF_DIRECTOR_APPROVAL) {
          return RequestStatus.CHAIRMAN_APPROVAL;
        }
        break;

      case UserRole.CHAIRMAN:
        if (currentStatus === RequestStatus.CHAIRMAN_APPROVAL) {
          return RequestStatus.APPROVED;
        }
        break;
    }

    return null;
  },

  // Helper method to check if both verifications are complete
  checkParallelVerificationComplete(request: any): { sopComplete: boolean; budgetComplete: boolean; bothComplete: boolean } {
    const sopComplete = request.history.some((h: any) => 
      h.newStatus === RequestStatus.SOP_COMPLETED && h.action === ActionType.APPROVE
    );
    const budgetComplete = request.history.some((h: any) => 
      h.newStatus === RequestStatus.BUDGET_COMPLETED && h.action === ActionType.APPROVE
    );
    
    return {
      sopComplete,
      budgetComplete,
      bothComplete: sopComplete && budgetComplete
    };
  }
};
