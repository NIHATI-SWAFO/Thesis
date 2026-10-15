from django.test import SimpleTestCase
from apps.violations.consequence_engine import (
    evaluate_violation_consequence,
    evaluate_student_aggregate_standing,
    CLEARANCE_CLEARED,
    CLEARANCE_CONDITIONAL,
    CLEARANCE_RESTRICTED,
    CLEARANCE_HOLD,
    HONORS_ELIGIBLE,
    HONORS_UNDER_REVIEW,
    HONORS_DISQUALIFIED,
    HONORS_FORFEITED,
    GMC_AVAILABLE,
    GMC_DEFERRED,
    GMC_WITHHELD,
    GMC_DENIED,
)


class TestMinorOffenseConsequences(SimpleTestCase):
    """Verifies Section 27.1 minor offense escalation rules and consequences."""

    def test_first_minor_offense_yields_warning(self):
        result = evaluate_violation_consequence(
            rule_code="27.1.2.1",
            rule_category="Minor — Clothing",
            rule_description="See-through clothes",
            rule_penalties={"penalty_1st": "Written warning", "penalty_2nd": "First minor offense"},
            prior_violations=[]
        )
        self.assertEqual(result.recommendation, "Written warning")
        self.assertEqual(result.clearance_impact, CLEARANCE_CLEARED)
        self.assertEqual(result.honors_eligibility, HONORS_ELIGIBLE)
        self.assertEqual(result.gmc_status, GMC_AVAILABLE)
        self.assertFalse(result.is_escalated)
        self.assertFalse(result.mandatory_formation)
        self.assertFalse(result.requires_director_decision)
        self.assertTrue(result.enters_formal_discipline_record)

    def test_second_minor_offense_yields_reprimand(self):
        prior = [{"rule_code": "27.1.2.1", "category": "Minor — Clothing", "status": "CLOSED"}]
        result = evaluate_violation_consequence(
            rule_code="27.1.1.2",
            rule_category="Minor — Behavior",
            rule_description="Loitering along hallways",
            rule_penalties={"penalty_1st": "Written warning", "penalty_2nd": "First minor offense"},
            prior_violations=prior
        )
        self.assertEqual(result.recommendation, "First minor offense")
        self.assertEqual(result.clearance_impact, CLEARANCE_CONDITIONAL)
        self.assertEqual(result.honors_eligibility, HONORS_UNDER_REVIEW)
        self.assertEqual(result.gmc_status, GMC_DEFERRED)
        self.assertFalse(result.is_escalated)
        self.assertFalse(result.mandatory_formation)

    def test_third_total_minor_escalates_to_major_section_27_3_1_43(self):
        prior = [
            {"rule_code": "27.1.2.1", "category": "Minor — Clothing", "status": "CLOSED"},
            {"rule_code": "27.1.1.2", "category": "Minor — Behavior", "status": "CLOSED"},
        ]
        result = evaluate_violation_consequence(
            rule_code="27.1.1.3",
            rule_category="Minor — Behavior",
            rule_description="Sitting on tables and railings",
            rule_penalties={"penalty_1st": "Written warning"},
            prior_violations=prior
        )
        self.assertTrue(result.is_escalated)
        self.assertIn("27.3.1.43", result.recommendation)
        self.assertEqual(result.clearance_impact, CLEARANCE_RESTRICTED)
        self.assertEqual(result.honors_eligibility, HONORS_DISQUALIFIED)
        self.assertEqual(result.gmc_status, GMC_WITHHELD)
        self.assertTrue(result.mandatory_formation)
        self.assertFalse(result.requires_director_decision)

    def test_fourth_total_minor_escalates_to_habitual_section_27_3_1_39(self):
        prior = [
            {"rule_code": "27.1.2.1", "category": "Minor — Clothing", "status": "CLOSED"},
            {"rule_code": "27.1.1.2", "category": "Minor — Behavior", "status": "CLOSED"},
            {"rule_code": "27.1.1.3", "category": "Minor — Behavior", "status": "CLOSED"},
        ]
        result = evaluate_violation_consequence(
            rule_code="27.1.4",
            rule_category="Minor — Behavior",
            rule_description="Non-wearing of school ID",
            rule_penalties={"penalty_1st": "Written warning"},
            prior_violations=prior
        )
        self.assertTrue(result.is_escalated)
        self.assertIn("27.3.1.39", result.recommendation)
        self.assertEqual(result.clearance_impact, CLEARANCE_HOLD)
        self.assertEqual(result.honors_eligibility, HONORS_FORFEITED)
        self.assertEqual(result.gmc_status, GMC_DENIED)
        self.assertTrue(result.mandatory_formation)
        self.assertTrue(result.requires_director_decision)
        self.assertTrue(result.requires_sdb)

    def test_third_instance_of_same_rule_escalates_to_habitual(self):
        prior = [
            {"rule_code": "27.1.2.1", "category": "Minor — Clothing", "status": "CLOSED"},
            {"rule_code": "27.1.2.1", "category": "Minor — Clothing", "status": "CLOSED"},
        ]
        result = evaluate_violation_consequence(
            rule_code="27.1.2.1",
            rule_category="Minor — Clothing",
            rule_description="See-through clothes",
            rule_penalties={"penalty_1st": "Written warning"},
            prior_violations=prior
        )
        self.assertTrue(result.is_escalated)
        self.assertIn("27.3.1.39", result.recommendation)
        self.assertEqual(result.clearance_impact, CLEARANCE_HOLD)
        self.assertTrue(result.requires_director_decision)

    def test_dismissed_violations_do_not_count_in_escalation(self):
        prior = [
            {"rule_code": "27.1.2.1", "category": "Minor — Clothing", "status": "DISMISSED"},
        ]
        result = evaluate_violation_consequence(
            rule_code="27.1.1.2",
            rule_category="Minor — Behavior",
            rule_description="Loitering",
            rule_penalties={"penalty_1st": "Written warning", "penalty_2nd": "First minor offense"},
            prior_violations=prior
        )
        self.assertEqual(result.recommendation, "Written warning")
        self.assertEqual(result.clearance_impact, CLEARANCE_CLEARED)


class TestMajorOffenseConsequences(SimpleTestCase):
    """Verifies Section 27.3 major offense sanction rules and Section 27.3.5 referrals."""

    def test_first_major_offense_restricts_clearance_and_requires_formation(self):
        result = evaluate_violation_consequence(
            rule_code="27.3.1.20",
            rule_category="Major — Misconduct",
            rule_description="Acts of gross disrespect",
            rule_penalties={"penalty_1st": "Sanction 2: Suspension (3–5 school days)"},
            prior_violations=[]
        )
        self.assertEqual(result.recommendation, "Sanction 2: Suspension (3–5 school days)")
        self.assertEqual(result.clearance_impact, CLEARANCE_RESTRICTED)
        self.assertEqual(result.honors_eligibility, HONORS_DISQUALIFIED)
        self.assertEqual(result.gmc_status, GMC_WITHHELD)
        self.assertTrue(result.mandatory_formation)
        self.assertFalse(result.requires_director_decision)

    def test_repeat_major_same_rule_escalates_sanction_ladder(self):
        prior = [
            {"rule_code": "27.3.1.20", "category": "Major — Misconduct", "status": "CLOSED"}
        ]
        result = evaluate_violation_consequence(
            rule_code="27.3.1.20",
            rule_category="Major — Misconduct",
            rule_description="Acts of gross disrespect",
            rule_penalties={
                "penalty_1st": "Sanction 2: Suspension (3–5 school days)",
                "penalty_2nd": "Sanction 3: Suspension (6–12 school days)"
            },
            prior_violations=prior
        )
        self.assertEqual(result.recommendation, "Sanction 3: Suspension (6–12 school days)")
        self.assertEqual(result.clearance_impact, CLEARANCE_HOLD)
        self.assertEqual(result.honors_eligibility, HONORS_FORFEITED)
        self.assertEqual(result.gmc_status, GMC_DENIED)
        self.assertTrue(result.requires_director_decision)

    def test_different_major_triggers_section_27_3_5_director_decision(self):
        prior = [
            {"rule_code": "27.3.1.20", "category": "Major — Misconduct", "status": "CLOSED"}
        ]
        result = evaluate_violation_consequence(
            rule_code="27.3.2.7",
            rule_category="Major — Dishonesty",
            rule_description="Cheating in any form",
            rule_penalties={"penalty_1st": "Sanction 3: Suspension (6–12 school days)"},
            prior_violations=prior
        )
        self.assertIn("FOR SWAFO DIRECTOR DECISION (Section 27.3.5", result.recommendation)
        self.assertEqual(result.clearance_impact, CLEARANCE_HOLD)
        self.assertEqual(result.honors_eligibility, HONORS_FORFEITED)
        self.assertEqual(result.gmc_status, GMC_DENIED)
        self.assertTrue(result.requires_director_decision)
        self.assertTrue(result.requires_sdb)

    def test_grave_major_instantly_places_hold_and_sdb_referral(self):
        result = evaluate_violation_consequence(
            rule_code="27.3.1.17",
            rule_category="Major — Misconduct",
            rule_description="Selling of prohibited drugs",
            rule_penalties={"penalty_1st": "Sanction 5: Exclusion"},
            prior_violations=[]
        )
        self.assertEqual(result.recommendation, "Sanction 5: Exclusion")
        self.assertEqual(result.clearance_impact, CLEARANCE_HOLD)
        self.assertEqual(result.honors_eligibility, HONORS_FORFEITED)
        self.assertEqual(result.gmc_status, GMC_DENIED)
        self.assertTrue(result.requires_director_decision)
        self.assertTrue(result.requires_sdb)


class TestTrafficOffenseConsequences(SimpleTestCase):
    """Verifies Section 27.4 minor and major traffic offense progression."""

    def test_first_minor_traffic_is_warning_only(self):
        result = evaluate_violation_consequence(
            rule_code="27.4.2.2.2",
            rule_category="Traffic — Minor",
            rule_description="Illegal parking",
            rule_penalties={},
            prior_violations=[]
        )
        self.assertEqual(result.recommendation, "Warning")
        self.assertEqual(result.monetary_fine, 0)
        self.assertFalse(result.enters_formal_discipline_record)
        self.assertEqual(result.clearance_impact, CLEARANCE_CLEARED)
        self.assertEqual(result.honors_eligibility, HONORS_ELIGIBLE)
        self.assertEqual(result.gmc_status, GMC_AVAILABLE)

    def test_second_minor_traffic_adds_fine_and_enters_minor_discipline_record(self):
        prior = [{"rule_code": "27.4.2.2.2", "category": "Traffic — Minor", "status": "CLOSED"}]
        result = evaluate_violation_consequence(
            rule_code="27.4.2.2.1",
            rule_category="Traffic — Minor",
            rule_description="Inappropriate blowing of horns",
            rule_penalties={},
            prior_violations=prior
        )
        self.assertIn("1,000 fine", result.recommendation)
        self.assertEqual(result.monetary_fine, 1000)
        self.assertTrue(result.enters_formal_discipline_record)
        self.assertEqual(result.clearance_impact, CLEARANCE_CONDITIONAL)
        self.assertEqual(result.honors_eligibility, HONORS_ELIGIBLE)
        self.assertEqual(result.gmc_status, GMC_DEFERRED)

    def test_fourth_minor_traffic_revokes_vehicle_pass_and_escalates_to_major(self):
        prior = [
            {"rule_code": "27.4.2.2.2", "category": "Traffic — Minor", "status": "CLOSED"},
            {"rule_code": "27.4.2.2.1", "category": "Traffic — Minor", "status": "CLOSED"},
            {"rule_code": "27.4.2.2.3", "category": "Traffic — Minor", "status": "CLOSED"},
        ]
        result = evaluate_violation_consequence(
            rule_code="27.4.2.2.4",
            rule_category="Traffic — Minor",
            rule_description="Vehicle with disturbing alarm",
            rule_penalties={},
            prior_violations=prior
        )
        self.assertTrue(result.vehicle_pass_cancelled)
        self.assertTrue(result.is_escalated)
        self.assertIn("27.3.1.43", result.recommendation)
        self.assertEqual(result.clearance_impact, CLEARANCE_RESTRICTED)
        self.assertEqual(result.honors_eligibility, HONORS_DISQUALIFIED)
        self.assertEqual(result.gmc_status, GMC_WITHHELD)

    def test_first_major_traffic_is_admin_fine_only(self):
        result = evaluate_violation_consequence(
            rule_code="27.4.3.2.2",
            rule_category="Traffic — Major",
            rule_description="Reckless driving",
            rule_penalties={},
            prior_violations=[]
        )
        self.assertIn("2,000 fine", result.recommendation)
        self.assertEqual(result.monetary_fine, 2000)
        self.assertFalse(result.enters_formal_discipline_record)
        self.assertEqual(result.clearance_impact, CLEARANCE_CONDITIONAL)
        self.assertEqual(result.honors_eligibility, HONORS_ELIGIBLE)
        self.assertEqual(result.gmc_status, GMC_DEFERRED)
        self.assertFalse(result.mandatory_formation)

    def test_second_major_traffic_becomes_formal_major_offense(self):
        prior = [{"rule_code": "27.4.3.2.2", "category": "Traffic — Major", "status": "CLOSED"}]
        result = evaluate_violation_consequence(
            rule_code="27.4.3.2.1",
            rule_category="Traffic — Major",
            rule_description="Driving without license",
            rule_penalties={},
            prior_violations=prior
        )
        self.assertTrue(result.vehicle_pass_cancelled)
        self.assertTrue(result.enters_formal_discipline_record)
        self.assertEqual(result.clearance_impact, CLEARANCE_RESTRICTED)
        self.assertEqual(result.honors_eligibility, HONORS_DISQUALIFIED)
        self.assertEqual(result.gmc_status, GMC_WITHHELD)
        self.assertTrue(result.mandatory_formation)

    def test_second_major_traffic_with_existing_academic_major_refers_to_director(self):
        prior = [
            {"rule_code": "27.4.3.2.2", "category": "Traffic — Major", "status": "CLOSED"},
            {"rule_code": "27.3.1.20", "category": "Major — Misconduct", "status": "CLOSED"},
        ]
        result = evaluate_violation_consequence(
            rule_code="27.4.3.2.1",
            rule_category="Traffic — Major",
            rule_description="Driving without license",
            rule_penalties={},
            prior_violations=prior
        )
        self.assertIn("FOR SWAFO DIRECTOR DECISION (Section 27.3.5", result.recommendation)
        self.assertEqual(result.clearance_impact, CLEARANCE_HOLD)
        self.assertEqual(result.honors_eligibility, HONORS_FORFEITED)
        self.assertEqual(result.gmc_status, GMC_DENIED)
        self.assertTrue(result.requires_director_decision)


class TestAggregateStudentStanding(SimpleTestCase):
    """Verifies that student profile standing matches institutional privileges."""

    def test_clean_student_is_good_standing(self):
        standing = evaluate_student_aggregate_standing([])
        self.assertEqual(standing['standing'], 'Good Standing')
        self.assertEqual(standing['clearance_impact'], CLEARANCE_CLEARED)
        self.assertEqual(standing['honors_eligibility'], HONORS_ELIGIBLE)
        self.assertEqual(standing['gmc_status'], GMC_AVAILABLE)

    def test_student_with_single_resolved_minor_remains_good_standing(self):
        violations = [{"rule_code": "27.1.2.1", "category": "Minor — Clothing", "status": "CLOSED"}]
        standing = evaluate_student_aggregate_standing(violations)
        self.assertEqual(standing['standing'], 'Good Standing')
        self.assertEqual(standing['clearance_impact'], CLEARANCE_CLEARED)

    def test_student_with_two_minors_is_under_review(self):
        violations = [
            {"rule_code": "27.1.2.1", "category": "Minor — Clothing", "status": "CLOSED"},
            {"rule_code": "27.1.1.2", "category": "Minor — Behavior", "status": "CLOSED"},
        ]
        standing = evaluate_student_aggregate_standing(violations)
        self.assertEqual(standing['standing'], 'Under Review')
        self.assertEqual(standing['clearance_impact'], CLEARANCE_CONDITIONAL)
        self.assertEqual(standing['honors_eligibility'], HONORS_UNDER_REVIEW)

    def test_student_with_one_major_is_disciplinary_warning(self):
        violations = [{"rule_code": "27.3.1.20", "category": "Major — Misconduct", "status": "CLOSED"}]
        standing = evaluate_student_aggregate_standing(violations)
        self.assertEqual(standing['standing'], 'Disciplinary Warning')
        self.assertEqual(standing['clearance_impact'], CLEARANCE_RESTRICTED)
        self.assertEqual(standing['honors_eligibility'], HONORS_DISQUALIFIED)
        self.assertEqual(standing['gmc_status'], GMC_WITHHELD)

    def test_student_with_multiple_majors_is_disciplinary_probation(self):
        violations = [
            {"rule_code": "27.3.1.20", "category": "Major — Misconduct", "status": "CLOSED"},
            {"rule_code": "27.3.2.7", "category": "Major — Dishonesty", "status": "CLOSED"},
        ]
        standing = evaluate_student_aggregate_standing(violations)
        self.assertEqual(standing['standing'], 'Disciplinary Probation')
        self.assertEqual(standing['clearance_impact'], CLEARANCE_HOLD)
        self.assertEqual(standing['honors_eligibility'], HONORS_FORFEITED)
        self.assertEqual(standing['gmc_status'], GMC_DENIED)
