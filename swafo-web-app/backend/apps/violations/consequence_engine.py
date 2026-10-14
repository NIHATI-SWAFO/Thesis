"""
consequence_engine.py - DLSU-D Student Handbook Consequence Engine (Sections 14, 26, 27)

Centralized, deterministic institutional decision-support logic that evaluates
violation consequences across 4 key dimensions:
1. Disciplinary Action / Sanction Recommendation (Penalty Ladder & Escalation)
2. Institutional Clearance Impact (Section 14: CLEARED, CONDITIONAL, RESTRICTED, HOLD)
3. Academic Honors / Dean's List Eligibility (ELIGIBLE, UNDER_REVIEW, DISQUALIFIED, FORFEITED)
4. Certificate of Good Moral Character Status (AVAILABLE, DEFERRED, WITHHELD, DENIED)
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict

# ── Standalone Constants matching DLSU-D Handbook ─────────────────────────────

CLEARANCE_CLEARED = 'CLEARED'
CLEARANCE_CONDITIONAL = 'CONDITIONAL'
CLEARANCE_RESTRICTED = 'RESTRICTED'
CLEARANCE_HOLD = 'HOLD'

HONORS_ELIGIBLE = 'ELIGIBLE'
HONORS_UNDER_REVIEW = 'UNDER_REVIEW'
HONORS_DISQUALIFIED = 'DISQUALIFIED'
HONORS_FORFEITED = 'FORFEITED'

GMC_AVAILABLE = 'AVAILABLE'
GMC_DEFERRED = 'DEFERRED'
GMC_WITHHELD = 'WITHHELD'
GMC_DENIED = 'DENIED'


@dataclass
class ConsequenceAssessment:
    rule_code: str
    rule_description: str
    category: str
    
    # 1. Disciplinary Action
    recommendation: str
    penalty_level: str
    is_escalated: bool
    escalation_reason: Optional[str]
    requires_director_decision: bool
    requires_sdb: bool
    mandatory_formation: bool
    monetary_fine: Optional[int]
    vehicle_pass_cancelled: bool
    
    # 2. Institutional Clearance (§14)
    clearance_impact: str
    clearance_reason: str
    
    # 3. Academic Honors
    honors_eligibility: str
    honors_reason: str
    
    # 4. Good Moral Certificate (§26.4)
    gmc_status: str
    gmc_reason: str
    
    # Context counts
    instance_number: int
    total_minor_count: int
    total_major_count: int
    enters_formal_discipline_record: bool
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def is_minor_category(category: str, rule_code: str) -> bool:
    cat = (category or "").strip()
    code = (rule_code or "").strip()
    return (cat.startswith("Minor") or code.startswith("27.1")) and not cat.startswith("Traffic")


def is_major_category(category: str, rule_code: str) -> bool:
    cat = (category or "").strip()
    code = (rule_code or "").strip()
    return (cat.startswith("Major") or code.startswith("27.3")) and not cat.startswith("Traffic")


def is_traffic_minor(category: str, rule_code: str) -> bool:
    cat = (category or "").strip()
    code = (rule_code or "").strip()
    return "Traffic" in cat and ("Minor" in cat or code.startswith("27.4.2"))


def is_traffic_major(category: str, rule_code: str) -> bool:
    cat = (category or "").strip()
    code = (rule_code or "").strip()
    return "Traffic" in cat and ("Major" in cat or code.startswith("27.4.3"))


def evaluate_violation_consequence(
    rule_code: str,
    rule_category: str,
    rule_description: str,
    rule_penalties: Optional[Dict[str, Optional[str]]] = None,
    prior_violations: Optional[List[Dict[str, Any]]] = None,
) -> ConsequenceAssessment:
    """
    Evaluates a proposed violation against a student's prior violation history.
    
    prior_violations: list of dicts with keys:
      - 'rule_code' (str)
      - 'category' (str)
      - 'status' (optional str, e.g. 'OPEN', 'CLOSED', 'DISMISSED')
    """
    if rule_penalties is None:
        rule_penalties = {}
    if prior_violations is None:
        prior_violations = []

    # Filter out dismissed violations from disciplinary counting
    valid_history = [v for v in prior_violations if v.get('status') != 'DISMISSED']

    # ── 1. TRAFFIC OFFENSES (Section 27.4) ──────────────────────────────────
    if is_traffic_minor(rule_category, rule_code):
        # Stacks across all minor traffic codes
        prior_minor_traffic = [v for v in valid_history if is_traffic_minor(v.get('category', ''), v.get('rule_code', ''))]
        instance = len(prior_minor_traffic) + 1

        if instance == 1:
            return ConsequenceAssessment(
                rule_code=rule_code,
                rule_description=rule_description,
                category=rule_category,
                recommendation="Warning",
                penalty_level="1st Minor Traffic Offense",
                is_escalated=False,
                escalation_reason=None,
                requires_director_decision=False,
                requires_sdb=False,
                mandatory_formation=False,
                monetary_fine=0,
                vehicle_pass_cancelled=False,
                clearance_impact=CLEARANCE_CLEARED,
                clearance_reason="Minor traffic warning logged on GSO records only; institutional clearance remains Cleared.",
                honors_eligibility=HONORS_ELIGIBLE,
                honors_reason="First traffic warning does not affect academic honors.",
                gmc_status=GMC_AVAILABLE,
                gmc_reason="Good Moral Certificate remains available.",
                instance_number=instance,
                total_minor_count=0,
                total_major_count=0,
                enters_formal_discipline_record=False,
            )
        elif instance == 2:
            return ConsequenceAssessment(
                rule_code=rule_code,
                rule_description=rule_description,
                category=rule_category,
                recommendation="Minor Offense + Php 1,000 fine (Escalate to Section 27.1 record)",
                penalty_level="2nd Minor Traffic Offense",
                is_escalated=False,
                escalation_reason="2nd Minor Traffic infraction incurs a monetary fine and enters formal discipline record as 1st Minor Offense.",
                requires_director_decision=False,
                requires_sdb=False,
                mandatory_formation=False,
                monetary_fine=1000,
                vehicle_pass_cancelled=False,
                clearance_impact=CLEARANCE_CONDITIONAL,
                clearance_reason="Conditional clearance pending settlement of Php 1,000 traffic fine with Accounting.",
                honors_eligibility=HONORS_ELIGIBLE,
                honors_reason="Eligible for honors once fine is settled.",
                gmc_status=GMC_DEFERRED,
                gmc_reason="GMC deferred until traffic fine is settled with Accounting.",
                instance_number=instance,
                total_minor_count=1,
                total_major_count=0,
                enters_formal_discipline_record=True,
            )
        elif instance == 3:
            return ConsequenceAssessment(
                rule_code=rule_code,
                rule_description=rule_description,
                category=rule_category,
                recommendation="Commission of 2nd minor offense + Php 2,000 fine",
                penalty_level="3rd Minor Traffic Offense",
                is_escalated=False,
                escalation_reason="3rd Minor Traffic infraction incurs Php 2,000 fine and counts as 2nd Minor Offense on discipline record.",
                requires_director_decision=False,
                requires_sdb=False,
                mandatory_formation=False,
                monetary_fine=2000,
                vehicle_pass_cancelled=False,
                clearance_impact=CLEARANCE_CONDITIONAL,
                clearance_reason="Conditional clearance pending settlement of Php 2,000 fine with Accounting.",
                honors_eligibility=HONORS_UNDER_REVIEW,
                honors_reason="Honors subject to review due to multiple minor infractions.",
                gmc_status=GMC_DEFERRED,
                gmc_reason="GMC deferred pending settlement of obligations.",
                instance_number=instance,
                total_minor_count=2,
                total_major_count=0,
                enters_formal_discipline_record=True,
            )
        else: # 4th+ Minor Traffic
            return ConsequenceAssessment(
                rule_code=rule_code,
                rule_description=rule_description,
                category=rule_category,
                recommendation="Cancellation of vehicle pass + Commission of 3rd minor offense (Major Escalation §27.3.1.43)",
                penalty_level=f"{instance}th Minor Traffic Offense",
                is_escalated=True,
                escalation_reason="4th Minor Traffic infraction triggers vehicle pass cancellation and elevates to 3rd Minor Offense (Major Escalation §27.3.1.43).",
                requires_director_decision=False,
                requires_sdb=False,
                mandatory_formation=True,
                monetary_fine=0,
                vehicle_pass_cancelled=True,
                clearance_impact=CLEARANCE_RESTRICTED,
                clearance_reason="Clearance restricted; vehicle pass revoked and major disciplinary probation initiated.",
                honors_eligibility=HONORS_DISQUALIFIED,
                honors_reason="Disqualified from honors due to major escalation (§27.3.1.43).",
                gmc_status=GMC_WITHHELD,
                gmc_reason="GMC withheld until completion of SWAFO Restorative Formation Program (§26.4).",
                instance_number=instance,
                total_minor_count=3,
                total_major_count=1,
                enters_formal_discipline_record=True,
            )

    elif is_traffic_major(rule_category, rule_code):
        # Stacks across all major traffic codes
        prior_major_traffic = [v for v in valid_history if is_traffic_major(v.get('category', ''), v.get('rule_code', ''))]
        instance = len(prior_major_traffic) + 1

        if instance == 1:
            return ConsequenceAssessment(
                rule_code=rule_code,
                rule_description=rule_description,
                category=rule_category,
                recommendation="Major administrative sanction + Php 2,000 fine",
                penalty_level="1st Major Traffic Offense",
                is_escalated=False,
                escalation_reason=None,
                requires_director_decision=False,
                requires_sdb=False,
                mandatory_formation=False,
                monetary_fine=2000,
                vehicle_pass_cancelled=False,
                clearance_impact=CLEARANCE_CONDITIONAL,
                clearance_reason="Conditional clearance pending settlement of Php 2,000 traffic fine with Accounting.",
                honors_eligibility=HONORS_ELIGIBLE,
                honors_reason="First major traffic offense is an administrative traffic sanction; honors eligible once fine cleared.",
                gmc_status=GMC_DEFERRED,
                gmc_reason="GMC deferred until administrative fine is settled.",
                instance_number=instance,
                total_minor_count=0,
                total_major_count=0,
                enters_formal_discipline_record=False,
            )
        else: # 2nd+ Major Traffic
            # Formally enters discipline record as a Major Offense
            # CROSS-CHECK: Does the student have other existing disciplinary major offenses?
            std_majors = [v for v in valid_history if is_major_category(v.get('category', ''), v.get('rule_code', ''))]
            if len(std_majors) > 0:
                return ConsequenceAssessment(
                    rule_code=rule_code,
                    rule_description=rule_description,
                    category=rule_category,
                    recommendation="FOR SWAFO DIRECTOR DECISION (Section 27.3.5 - Different Nature: Major Traffic + Existing Disciplinary Major)",
                    penalty_level="Repeat Major Offense (Different Nature)",
                    is_escalated=True,
                    escalation_reason="2nd Major Traffic + existing disciplinary major offenses requires SWAFO Director determination under Section 27.3.5.",
                    requires_director_decision=True,
                    requires_sdb=True,
                    mandatory_formation=True,
                    monetary_fine=None,
                    vehicle_pass_cancelled=True,
                    clearance_impact=CLEARANCE_HOLD,
                    clearance_reason="Clearance placed on HOLD blocking enrollment and graduation pending SWAFO Director and SDB decision.",
                    honors_eligibility=HONORS_FORFEITED,
                    honors_reason="Honors forfeited due to multiple major disciplinary infractions.",
                    gmc_status=GMC_DENIED,
                    gmc_reason="Good Moral Certificate denied due to unresolved multi-major offenses.",
                    instance_number=instance,
                    total_minor_count=0,
                    total_major_count=len(std_majors) + 1,
                    enters_formal_discipline_record=True,
                )
            else:
                return ConsequenceAssessment(
                    rule_code=rule_code,
                    rule_description=rule_description,
                    category=rule_category,
                    recommendation="Major offense + Cancellation of vehicle sticker for 1 Academic Year",
                    penalty_level="2nd Major Traffic Offense",
                    is_escalated=True,
                    escalation_reason="2nd Major Traffic offense formally enters the discipline record as a Major Offense with 1 AY sticker cancellation.",
                    requires_director_decision=False,
                    requires_sdb=False,
                    mandatory_formation=True,
                    monetary_fine=None,
                    vehicle_pass_cancelled=True,
                    clearance_impact=CLEARANCE_RESTRICTED,
                    clearance_reason="Clearance restricted; vehicle sticker revoked for 1 AY and mandatory SWAFO Formation Program required.",
                    honors_eligibility=HONORS_DISQUALIFIED,
                    honors_reason="Disqualified from honors due to major disciplinary offense.",
                    gmc_status=GMC_WITHHELD,
                    gmc_reason="GMC withheld until completion of SWAFO Restorative Formation Program (§26.4).",
                    instance_number=instance,
                    total_minor_count=0,
                    total_major_count=1,
                    enters_formal_discipline_record=True,
                )

    # ── 2. MINOR OFFENSES (Section 27.1) ─────────────────────────────────────
    elif is_minor_category(rule_category, rule_code):
        same_rule_history = [v for v in valid_history if v.get('rule_code') == rule_code]
        same_rule_count = len(same_rule_history) + 1

        # Count all prior minors (standard minors + escalated traffic minors instance 2+)
        std_minors_prior = len([v for v in valid_history if is_minor_category(v.get('category', ''), v.get('rule_code', ''))])
        traffic_minors_prior = len([v for v in valid_history if is_traffic_minor(v.get('category', ''), v.get('rule_code', ''))])
        escalated_traffic_prior = max(0, traffic_minors_prior - 1)
        
        total_minor_count = std_minors_prior + escalated_traffic_prior + 1

        # Condition A: 3rd instance of the SAME minor rule -> Section 27.3.1.39 (Habitual Minor)
        if same_rule_count >= 3:
            return ConsequenceAssessment(
                rule_code=rule_code,
                rule_description=rule_description,
                category=rule_category,
                recommendation="MAJOR ESCALATION: 27.3.1.39 (Habitual Minor Offense - Sanction 2: Suspension 3–5 school days)",
                penalty_level="3rd Instance (Same Rule) - Habitual Minor",
                is_escalated=True,
                escalation_reason=f"Commission of 3 infractions of the same rule ({rule_code}) elevates to Major Offense 27.3.1.39 (Habitual Minor).",
                requires_director_decision=True,
                requires_sdb=True,
                mandatory_formation=True,
                monetary_fine=None,
                vehicle_pass_cancelled=False,
                clearance_impact=CLEARANCE_HOLD,
                clearance_reason="Clearance placed on HOLD blocking enrollment pending SWAFO Director and SDB review for habitual offenses.",
                honors_eligibility=HONORS_FORFEITED,
                honors_reason="Honors forfeited due to habitual minor offense elevation (§27.3.1.39).",
                gmc_status=GMC_DENIED,
                gmc_reason="Good Moral Certificate denied due to habitual disciplinary offenses.",
                instance_number=same_rule_count,
                total_minor_count=total_minor_count,
                total_major_count=1,
                enters_formal_discipline_record=True,
            )

        # Condition B: 4th or more TOTAL minor offenses across any rules -> Section 27.3.1.39 (Habitual Minor)
        elif total_minor_count >= 4:
            return ConsequenceAssessment(
                rule_code=rule_code,
                rule_description=rule_description,
                category=rule_category,
                recommendation="MAJOR ESCALATION: 27.3.1.39 (Habitual Minor Offense - Sanction 2: Suspension 3–5 school days)",
                penalty_level=f"4th Minor Offense (Habitual Escalation)",
                is_escalated=True,
                escalation_reason="Accumulation of 4 minor offenses escalates to Major Offense 27.3.1.39 (Habitual Minor Offense).",
                requires_director_decision=True,
                requires_sdb=True,
                mandatory_formation=True,
                monetary_fine=None,
                vehicle_pass_cancelled=False,
                clearance_impact=CLEARANCE_HOLD,
                clearance_reason="Clearance placed on HOLD; student referred to SWAFO Director and Student Discipline Board.",
                honors_eligibility=HONORS_FORFEITED,
                honors_reason="Honors forfeited due to habitual minor misconduct.",
                gmc_status=GMC_DENIED,
                gmc_reason="Good Moral Certificate denied due to habitual minor offenses.",
                instance_number=same_rule_count,
                total_minor_count=total_minor_count,
                total_major_count=1,
                enters_formal_discipline_record=True,
            )

        # Condition C: 3rd TOTAL minor offense -> Section 27.3.1.43 (Third Minor Offense - Major Escalation)
        elif total_minor_count == 3:
            return ConsequenceAssessment(
                rule_code=rule_code,
                rule_description=rule_description,
                category=rule_category,
                recommendation="MAJOR ESCALATION: 27.3.1.43 (Third Minor Offense - Sanction 1: Probation 1 Year)",
                penalty_level="3rd Minor Offense (Major Escalation)",
                is_escalated=True,
                escalation_reason="Commission of 3rd minor offense elevates to Major Offense Section 27.3.1.43 with Sanction 1 (Probation).",
                requires_director_decision=False,
                requires_sdb=False,
                mandatory_formation=True,
                monetary_fine=None,
                vehicle_pass_cancelled=False,
                clearance_impact=CLEARANCE_RESTRICTED,
                clearance_reason="Clearance restricted under Disciplinary Probation (Section 27.3.1.43); requires Formation Program.",
                honors_eligibility=HONORS_DISQUALIFIED,
                honors_reason="Disqualified from Dean's List and Latin Honors due to major offense escalation (§27.3.1.43).",
                gmc_status=GMC_WITHHELD,
                gmc_reason="GMC withheld until completion of SWAFO Restorative Formation Program (§26.4).",
                instance_number=same_rule_count,
                total_minor_count=total_minor_count,
                total_major_count=1,
                enters_formal_discipline_record=True,
            )

        # Condition D: 2nd TOTAL minor offense -> First Minor Offense (Reprimand)
        elif total_minor_count == 2:
            reprimand_sanction = rule_penalties.get('penalty_2nd') or "First minor offense (Official Reprimand + Parent Conference)"
            return ConsequenceAssessment(
                rule_code=rule_code,
                rule_description=rule_description,
                category=rule_category,
                recommendation=reprimand_sanction,
                penalty_level="2nd Minor Offense (First Formal Reprimand)",
                is_escalated=False,
                escalation_reason=None,
                requires_director_decision=False,
                requires_sdb=False,
                mandatory_formation=False,
                monetary_fine=None,
                vehicle_pass_cancelled=False,
                clearance_impact=CLEARANCE_CONDITIONAL,
                clearance_reason="Conditional clearance; formal written reprimand on file. Parent conference required.",
                honors_eligibility=HONORS_UNDER_REVIEW,
                honors_reason="Honors subject to end-of-semester conduct review.",
                gmc_status=GMC_DEFERRED,
                gmc_reason="GMC deferred pending resolution of active obligations.",
                instance_number=same_rule_count,
                total_minor_count=total_minor_count,
                total_major_count=0,
                enters_formal_discipline_record=True,
            )

        # Condition E: 1st Minor Offense -> Written Warning
        else:
            warning_sanction = rule_penalties.get('penalty_1st') or "Written warning with verbal guidance"
            return ConsequenceAssessment(
                rule_code=rule_code,
                rule_description=rule_description,
                category=rule_category,
                recommendation=warning_sanction,
                penalty_level="1st Minor Offense (Written Warning)",
                is_escalated=False,
                escalation_reason=None,
                requires_director_decision=False,
                requires_sdb=False,
                mandatory_formation=False,
                monetary_fine=None,
                vehicle_pass_cancelled=False,
                clearance_impact=CLEARANCE_CLEARED,
                clearance_reason="First minor offense warning; institutional clearance remains Cleared.",
                honors_eligibility=HONORS_ELIGIBLE,
                honors_reason="Eligible for Dean's List and Latin Honors; exemplary standing maintained.",
                gmc_status=GMC_AVAILABLE,
                gmc_reason="Good Moral Certificate available unconditionally.",
                instance_number=same_rule_count,
                total_minor_count=total_minor_count,
                total_major_count=0,
                enters_formal_discipline_record=True,
            )

    # ── 3. MAJOR OFFENSES (Section 27.3) ─────────────────────────────────────
    else:
        # Standard Major Offense
        std_majors_prior = [v for v in valid_history if is_major_category(v.get('category', ''), v.get('rule_code', ''))]
        
        # Escalated traffic majors (2nd+ major traffic)
        traffic_majors_prior = [v for v in valid_history if is_traffic_major(v.get('category', ''), v.get('rule_code', ''))]
        escalated_traffic_majors = max(0, len(traffic_majors_prior) - 1)
        
        total_major_count = len(std_majors_prior) + escalated_traffic_majors + 1
        
        same_rule_history = [v for v in valid_history if v.get('rule_code') == rule_code]
        same_rule_count = len(same_rule_history) + 1

        # Check if 1st Major ever recorded
        if total_major_count == 1:
            sanction = rule_penalties.get('penalty_1st') or "Sanction 1: Probation (1 year)"
            
            # Grave sanctions check (Sanction 4, 5, 6: Non-readmission, Exclusion, Expulsion)
            is_grave = any(s in str(sanction).lower() for s in ['non-readmission', 'exclusion', 'expulsion', 'sanction 4', 'sanction 5', 'sanction 6'])
            
            clearance_impact = CLEARANCE_HOLD if is_grave else CLEARANCE_RESTRICTED
            gmc_status = GMC_DENIED if is_grave else GMC_WITHHELD
            honors_eligibility = HONORS_FORFEITED if is_grave else HONORS_DISQUALIFIED
            
            return ConsequenceAssessment(
                rule_code=rule_code,
                rule_description=rule_description,
                category=rule_category,
                recommendation=sanction,
                penalty_level="1st Major Offense",
                is_escalated=False,
                escalation_reason=None,
                requires_director_decision=is_grave,
                requires_sdb=is_grave,
                mandatory_formation=not is_grave,
                monetary_fine=None,
                vehicle_pass_cancelled=False,
                clearance_impact=clearance_impact,
                clearance_reason="Clearance restricted/hold due to major disciplinary offense; mandatory SWAFO Formation Program required.",
                honors_eligibility=honors_eligibility,
                honors_reason="Disqualified from Dean's List and Latin Honors due to major disciplinary offense.",
                gmc_status=gmc_status,
                gmc_reason="GMC withheld until completion of SWAFO Restorative Formation Program (§26.4).",
                instance_number=same_rule_count,
                total_minor_count=0,
                total_major_count=total_major_count,
                enters_formal_discipline_record=True,
            )

        else:
            # Student has prior major offenses!
            # Section 27.3.5: Are they of DIFFERENT nature?
            only_same_rule = (len(same_rule_history) == len(std_majors_prior)) and (escalated_traffic_majors == 0)

            if not only_same_rule:
                # Multiple major offenses of DIFFERENT nature -> SWAFO DIRECTOR DECISION (Section 27.3.5)
                return ConsequenceAssessment(
                    rule_code=rule_code,
                    rule_description=rule_description,
                    category=rule_category,
                    recommendation="FOR SWAFO DIRECTOR DECISION (Section 27.3.5 - Different Nature)",
                    penalty_level=f"Multiple Major Offenses (Different Nature - #{total_major_count})",
                    is_escalated=True,
                    escalation_reason="Commission of 2nd to 4th major offenses of different nature shall be decided by the SWAFO Director (§27.3.5).",
                    requires_director_decision=True,
                    requires_sdb=True,
                    mandatory_formation=True,
                    monetary_fine=None,
                    vehicle_pass_cancelled=False,
                    clearance_impact=CLEARANCE_HOLD,
                    clearance_reason="Institutional Clearance placed on HOLD blocking enrollment and graduation. Referred to SWAFO Director and SDB.",
                    honors_eligibility=HONORS_FORFEITED,
                    honors_reason="Honors forfeited due to multiple major disciplinary violations.",
                    gmc_status=GMC_DENIED,
                    gmc_reason="Good Moral Certificate denied due to multiple major disciplinary offenses.",
                    instance_number=same_rule_count,
                    total_minor_count=0,
                    total_major_count=total_major_count,
                    enters_formal_discipline_record=True,
                )
            else:
                # Same rule repeating: follow rule's penalty ladder (penalty_2nd, 3rd, 4th, 5th)
                penalty_key = f"penalty_{same_rule_count}th" if same_rule_count in [4, 5] else f"penalty_{same_rule_count}{'nd' if same_rule_count == 2 else 'rd'}"
                sanction = rule_penalties.get(penalty_key) or rule_penalties.get('penalty_3rd') or rule_penalties.get('penalty_2nd') or "Sanction 3: Suspension (6–12 school days)"

                return ConsequenceAssessment(
                    rule_code=rule_code,
                    rule_description=rule_description,
                    category=rule_category,
                    recommendation=sanction,
                    penalty_level=f"Repeat Major Offense (Instance #{same_rule_count})",
                    is_escalated=True,
                    escalation_reason=f"Repeated commission of {rule_code} (Instance #{same_rule_count}) escalates to higher sanction ladder.",
                    requires_director_decision=True,
                    requires_sdb=True,
                    mandatory_formation=True,
                    monetary_fine=None,
                    vehicle_pass_cancelled=False,
                    clearance_impact=CLEARANCE_HOLD,
                    clearance_reason="Institutional Clearance placed on HOLD; repeat major offenses warrant Director and SDB review.",
                    honors_eligibility=HONORS_FORFEITED,
                    honors_reason="Honors forfeited due to repeat major offenses.",
                    gmc_status=GMC_DENIED,
                    gmc_reason="Good Moral Certificate denied due to repeat major offenses.",
                    instance_number=same_rule_count,
                    total_minor_count=0,
                    total_major_count=total_major_count,
                    enters_formal_discipline_record=True,
                )


def evaluate_student_aggregate_standing(
    violations: List[Dict[str, Any]],
    manual_clearance_hold: bool = False
) -> Dict[str, Any]:
    """
    Evaluates the student's overall institutional standing across their active record.
    Unifies the criteria used by the student dashboard, profile view, and directory.
    """
    valid_violations = [v for v in violations if v.get('status') != 'DISMISSED']
    has_pending = any(v.get('status') in ['OPEN', 'AWAITING_DECISION'] for v in valid_violations)
    
    # Counts
    minors_count = 0
    majors_count = 0
    unpaid_fines = 0
    has_escalated_minor = False
    has_different_majors = False
    
    # Track traffic
    traffic_minor_count = 0
    traffic_major_count = 0
    major_rule_codes = set()
    
    for v in valid_violations:
        cat = v.get('category', '')
        code = v.get('rule_code', '')
        
        if is_traffic_minor(cat, code):
            traffic_minor_count += 1
            if traffic_minor_count == 2:
                unpaid_fines += 1000
                minors_count += 1
            elif traffic_minor_count == 3:
                unpaid_fines += 2000
                minors_count += 1
            elif traffic_minor_count >= 4:
                minors_count += 1
                majors_count += 1
                has_escalated_minor = True
        elif is_traffic_major(cat, code):
            traffic_major_count += 1
            if traffic_major_count == 1:
                unpaid_fines += 2000
            else:
                majors_count += 1
                major_rule_codes.add(code)
        elif is_minor_category(cat, code):
            minors_count += 1
        elif is_major_category(cat, code):
            majors_count += 1
            major_rule_codes.add(code)

    if minors_count >= 3:
        has_escalated_minor = True
    if len(major_rule_codes) > 1:
        has_different_majors = True

    total_valid = len(valid_violations)

    # ── Tier 1: Disciplinary Probation (CRITICAL) ──
    if manual_clearance_hold or majors_count >= 2 or minors_count >= 4 or has_different_majors:
        return {
            'tier': 'CRITICAL',
            'standing': 'Disciplinary Probation',
            'clearance_impact': CLEARANCE_HOLD,
            'honors_eligibility': HONORS_FORFEITED,
            'gmc_status': GMC_DENIED,
            'handbook_citation': 'DLSU-D Student Handbook Section 27.3.5 / Section 14',
            'consequence_summary': (
                f'Institutional Clearance placed on HOLD blocking enrollment and graduation. '
                f'Honors forfeited; {total_valid} infractions on record ({majors_count} major offenses). '
                f'Referred to SWAFO Director and Student Discipline Board.'
            ),
            'color': 'rose',
            'requires_formation': True,
        }

    # ── Tier 2: Disciplinary Warning (HIGH) ──
    elif majors_count == 1 or has_escalated_minor or minors_count == 3:
        return {
            'tier': 'HIGH',
            'standing': 'Disciplinary Warning',
            'clearance_impact': CLEARANCE_RESTRICTED,
            'honors_eligibility': HONORS_DISQUALIFIED,
            'gmc_status': GMC_WITHHELD,
            'handbook_citation': 'DLSU-D Student Handbook Section 26.4 / Section 27.3.1.43',
            'consequence_summary': (
                f'Disqualified from Dean\'s List and Latin Honors ({total_valid} violations on record). '
                f'Clearance restricted; Good Moral Certificate withheld. '
                f'Mandatory attendance in SWAFO Restorative Formation Program (§26.4).'
            ),
            'color': 'orange',
            'requires_formation': True,
        }

    # ── Tier 3: Under Review (MODERATE) ──
    elif minors_count == 2 or has_pending or unpaid_fines > 0:
        fine_text = f' Unsettled traffic fines of Php {unpaid_fines:,}.' if unpaid_fines > 0 else ''
        return {
            'tier': 'MODERATE',
            'standing': 'Under Review',
            'clearance_impact': CLEARANCE_CONDITIONAL,
            'honors_eligibility': HONORS_UNDER_REVIEW,
            'gmc_status': GMC_DEFERRED,
            'handbook_citation': 'DLSU-D Student Handbook Section 27.1 / Section 14',
            'consequence_summary': (
                f'Conditional clearance. Honors subject to end-of-semester conduct review '
                f'({total_valid} violation{"s" if total_valid != 1 else ""}, {"active pending case" if has_pending else "resolved"}). '
                f'Good Moral Certificate deferred pending resolution of active obligations.{fine_text}'
            ),
            'color': 'amber',
            'requires_formation': False,
        }

    # ── Tier 4: Good Standing (LOW) ──
    else:
        return {
            'tier': 'LOW',
            'standing': 'Good Standing',
            'clearance_impact': CLEARANCE_CLEARED,
            'honors_eligibility': HONORS_ELIGIBLE,
            'gmc_status': GMC_AVAILABLE,
            'handbook_citation': 'DLSU-D Student Handbook Section 14',
            'consequence_summary': (
                'Unrestricted institutional clearance. Eligible for Dean\'s List '
                'and Latin Honors; unconditional Good Moral Certificate (GMC) issuance.'
            ),
            'color': 'emerald',
            'requires_formation': False,
        }
