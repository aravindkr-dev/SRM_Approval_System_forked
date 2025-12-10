import { RequestStatus, ActionType, UserRole } from "./types";

type Transition = {
  from: RequestStatus;
  to: RequestStatus;
  requiredRole: UserRole | UserRole[];
};

export const approvalEngine = {
  transitions: <Transition[]>[
    { from: RequestStatus.SUBMITTED, to: RequestStatus.MANAGER_REVIEW, requiredRole: UserRole.INSTITUTION_MANAGER },

    { from: RequestStatus.MANAGER_REVIEW, to: RequestStatus.SOP_VERIFICATION, requiredRole: UserRole.INSTITUTION_MANAGER },

    { from: RequestStatus.SOP_VERIFICATION, to: RequestStatus.BUDGET_CLARIFICATION, requiredRole: UserRole.SOP_VERIFIER },

    { from: RequestStatus.BUDGET_CLARIFICATION, to: RequestStatus.MANAGER_REVIEW, requiredRole: UserRole.ACCOUNTANT },

    { from: RequestStatus.MANAGER_REVIEW, to: RequestStatus.VP_APPROVAL, requiredRole: UserRole.INSTITUTION_MANAGER },

    { from: RequestStatus.VP_APPROVAL, to: RequestStatus.HOI_APPROVAL, requiredRole: UserRole.VP },

    { from: RequestStatus.HOI_APPROVAL, to: RequestStatus.DEAN_REVIEW, requiredRole: UserRole.HEAD_OF_INSTITUTION },

    //
    // ⭐ Dean → Request clarification to a selected department
    //
    { from: RequestStatus.DEAN_REVIEW, to: RequestStatus.DEPARTMENT_CHECKS, requiredRole: UserRole.DEAN },

    //
    // ⭐ Only the SELECTED department can respond
    //
    {
      from: RequestStatus.DEPARTMENT_CHECKS,
      to: RequestStatus.DEAN_REVIEW,
      requiredRole: [
        UserRole.MMA,
        UserRole.HR,
        UserRole.AUDIT,
        UserRole.IT
      ]
    },

    //
    // After dean verifies → forward
    //
    { from: RequestStatus.DEAN_REVIEW, to: RequestStatus.CHIEF_DIRECTOR_APPROVAL, requiredRole: UserRole.DEAN },

    { from: RequestStatus.CHIEF_DIRECTOR_APPROVAL, to: RequestStatus.CHAIRMAN_APPROVAL, requiredRole: UserRole.CHIEF_DIRECTOR },

    { from: RequestStatus.CHAIRMAN_APPROVAL, to: RequestStatus.APPROVED, requiredRole: UserRole.CHAIRMAN },
  ],

  getRequiredApprover(status: RequestStatus): UserRole[] {
    const allowed = this.transitions
      .filter(t => t.from === status)
      .flatMap(t => Array.isArray(t.requiredRole) ? t.requiredRole : [t.requiredRole]);

    return [...new Set(allowed)];
  },

  getNextStatus(
    currentStatus: RequestStatus,
    action: ActionType,
    role: UserRole,
    context?: any
  ): RequestStatus | null {
    const transitions = this.transitions.filter(t => t.from === currentStatus);

    // SOP always → Budget Check
    if (role === UserRole.SOP_VERIFIER)
      return RequestStatus.BUDGET_CLARIFICATION;

    // Accountant always → Manager Review
    if (role === UserRole.ACCOUNTANT)
      return RequestStatus.MANAGER_REVIEW;

    // ⭐ Dean requesting clarification to a specific department
    if (currentStatus === RequestStatus.DEAN_REVIEW && action === ActionType.CLARIFY) {
      if (!context?.clarificationTarget)
        return null;

      // Store selected department into context (checked later)
      return RequestStatus.DEPARTMENT_CHECKS;
    }

    // ⭐ Department responding → ONLY if they match Dean's selected department
    if (currentStatus === RequestStatus.DEPARTMENT_CHECKS) {
      if (context?.clarificationTarget !== role) {
        return null; // Block incorrect departments
      }

      return RequestStatus.DEAN_REVIEW;
    }

    // Normal transitions
    const t = transitions.find(t => {
      if (Array.isArray(t.requiredRole))
        return t.requiredRole.includes(role);

      return t.requiredRole === role;
    });

    return t?.to || null;
  }
};
