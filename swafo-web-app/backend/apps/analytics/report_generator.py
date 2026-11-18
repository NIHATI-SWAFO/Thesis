"""
SWAFO Per-College PDF Report Generator
Polished, concise, algorithmically-enriched — reportlab
"""
from io import BytesIO
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Group
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.legends import Legend
from reportlab.graphics import renderPDF
from reportlab.platypus.flowables import Flowable
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField
from django.utils import timezone

# ── Colors ────────────────────────────────────────────────────────────────────
DLSUD_GREEN  = colors.HexColor('#003624')
ACCENT_GREEN = colors.HexColor('#009b69')
LIGHT_GREEN  = colors.HexColor('#e6f4ee')
YELLOW_HL    = colors.HexColor('#fef08a')
ROSE         = colors.HexColor('#e11d48')
ORANGE       = colors.HexColor('#f97316')
AMBER        = colors.HexColor('#f59e0b')
SLATE        = colors.HexColor('#64748b')
SLATE_LIGHT  = colors.HexColor('#f8fafc')
WHITE        = colors.white
BLACK        = colors.HexColor('#0f172a')

COLLEGE_ACRONYMS = {
    "College of Business Administration and Accountancy": "CBAA",
    "College of Criminal Justice Education":             "CCJE",
    "College of Education":                              "COED",
    "College of Engineering, Architecture and Technology": "CEAT",
    "College of Information and Computer Studies":       "CICS",
    "College of Liberal Arts and Communication":         "CLAC",
    "College of Science":                                "COS",
    "College of Tourism and Hospitality Management":     "CTHM",
}
ALL_COLLEGES = list(COLLEGE_ACRONYMS.keys())

W, H = A4  # 595.27 x 841.89 pt


def _s(name, **kw):
    base = getSampleStyleSheet()[name]
    return ParagraphStyle(name + '_c', parent=base, **kw)


def _risk_label(score):
    if score > 75: return 'CRITICAL', ROSE
    if score > 50: return 'HIGH',     ORANGE
    if score > 25: return 'MODERATE', AMBER
    return 'LOW', ACCENT_GREEN


# ── Semester bar chart ─────────────────────────────────────────────────────────
def _offense_bar_chart(s1_min, s1_maj, s2_min, s2_maj):
    drawing = Drawing(480, 160)

    bc = VerticalBarChart()
    bc.x = 40
    bc.y = 30
    bc.width = 380
    bc.height = 110
    bc.data = [
        (s1_min, s2_min),   # Minor
        (s1_maj, s2_maj),   # Major
    ]
    bc.categoryAxis.categoryNames = ['Aug–Dec 2025 (1st Sem)', 'Jan–Present 2026 (2nd Sem)']
    bc.categoryAxis.labels.fontSize = 8
    bc.categoryAxis.labels.fontName = 'Helvetica'
    bc.valueAxis.labels.fontSize = 8
    bc.valueAxis.labels.fontName = 'Helvetica'
    bc.valueAxis.valueMin = 0
    bc.groupSpacing = 8
    bc.bars[0].fillColor = ACCENT_GREEN
    bc.bars[1].fillColor = ROSE
    bc.bars.strokeColor = None

    drawing.add(bc)

    # Legend
    drawing.add(Rect(430, 130, 12, 10, fillColor=ACCENT_GREEN, strokeColor=None))
    drawing.add(String(446, 131, 'Minor', fontSize=8, fontName='Helvetica'))
    drawing.add(Rect(430, 115, 12, 10, fillColor=ROSE, strokeColor=None))
    drawing.add(String(446, 116, 'Major', fontSize=8, fontName='Helvetica'))

    return drawing


# ── Risk horizontal bar chart ──────────────────────────────────────────────────
def _risk_bar_chart(buckets, total):
    """Simple horizontal bar showing risk distribution."""
    drawing = Drawing(480, 50)
    if total == 0:
        drawing.add(String(10, 20, 'No risk data available.', fontSize=8, fontName='Helvetica', fillColor=SLATE))
        return drawing

    bar_w = 380
    x = 40
    y = 18
    h = 22
    labels = [('CRITICAL', ROSE), ('HIGH', ORANGE), ('MODERATE', AMBER), ('LOW', ACCENT_GREEN)]

    for label, col in labels:
        count = buckets.get(label, 0)
        w = int((count / total) * bar_w)
        if w > 0:
            drawing.add(Rect(x, y, w, h, fillColor=col, strokeColor=None))
            if w > 24:
                drawing.add(String(x + w/2 - 6, y + 6, str(count),
                                   fontSize=7, fontName='Helvetica-Bold', fillColor=WHITE))
            x += w

    # Legend row
    lx = 40
    for label, col in labels:
        drawing.add(Rect(lx, 4, 8, 8, fillColor=col, strokeColor=None))
        drawing.add(String(lx + 10, 5, label, fontSize=7, fontName='Helvetica', fillColor=SLATE))
        lx += 70

    return drawing


def generate_college_report(college: str) -> bytes:
    from apps.violations.models import Violation
    from apps.users.models import StudentProfile
    from apps.violations.serializers import ViolationSerializer
    from apps.users.serializers import StudentProfileSerializer

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=1.8*cm, rightMargin=1.8*cm,
        topMargin=1.8*cm, bottomMargin=1.8*cm,
    )

    college_qs  = Violation.objects.filter(student__course__iexact=college)
    students_qs = StudentProfile.objects.filter(course__iexact=college)
    all_qs      = Violation.objects.all()
    acronym     = COLLEGE_ACRONYMS.get(college, college[:4].upper())
    today       = timezone.localtime(timezone.now()).date()

    # ── Counts ────────────────────────────────────────────────────────────────
    total_college = college_qs.count()
    total_inst    = all_qs.count()
    open_cases    = college_qs.filter(status__in=['OPEN', 'AWAITING_DECISION']).count()
    closed_cases  = college_qs.filter(status__in=['CLOSED', 'DISMISSED']).count()
    res_rate      = round((closed_cases / total_college * 100), 1) if total_college > 0 else 0

    sem1_s, sem1_e = date(2025, 8, 1),  date(2025, 12, 31)
    sem2_s, sem2_e = date(2026, 1, 12), today

    def sem_counts(qs, s, e):
        q = qs.filter(timestamp__date__gte=s, timestamp__date__lte=e)
        return (
            q.filter(rule__category__icontains='minor').count(),
            q.filter(rule__category__icontains='major').count(),
        )

    s1_min, s1_maj = sem_counts(college_qs, sem1_s, sem1_e)
    s2_min, s2_maj = sem_counts(college_qs, sem2_s, sem2_e)

    # Risk leaderboard
    # Ordered by handbook standing (tier), then active (non-dismissed) violations
    tier_rank = {'CRITICAL': 4, 'HIGH': 3, 'MODERATE': 2, 'LOW': 1}
    leaderboard = []
    for s in students_qs:
        ser = StudentProfileSerializer(s)
        active = s.violations.exclude(status='DISMISSED').count()
        standing_info = ser.data.get('risk_standing', {})
        if active > 0:
            leaderboard.append({
                'name': s.user.full_name,
                'id': s.student_number,
                'standing': standing_info.get('standing', 'Good Standing'),
                'clearance': standing_info.get('clearance_impact', 'CLEARED'),
                'tier': standing_info.get('tier', 'LOW'),
                'score': active,
            })
    leaderboard = sorted(leaderboard, key=lambda x: (tier_rank.get(x['tier'], 0), x['score']), reverse=True)[:8]

    risk_buckets = {'LOW': 0, 'MODERATE': 0, 'HIGH': 0, 'CRITICAL': 0}
    for e in leaderboard:
        risk_buckets[e['tier']] = risk_buckets.get(e['tier'], 0) + 1
    risk_total = sum(risk_buckets.values())

    # Escalation tiers
    tiers = {1: 0, 2: 0, 3: 0, 4: 0}
    for s in students_qs:
        mc = college_qs.filter(student=s, rule__category__icontains='minor').count()
        if   mc == 1: tiers[1] += 1
        elif mc == 2: tiers[2] += 1
        elif mc == 3: tiers[3] += 1
        elif mc >= 4: tiers[4] += 1

    # College position table
    by_college_totals = {r['student__course']: r['c']
                         for r in all_qs.values('student__course').annotate(c=Count('id'))}

    # ── Story ─────────────────────────────────────────────────────────────────
    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    hdr = Table([[
        Paragraph(f'<font color="#34d399" size="24"><b>{acronym}</b></font><br/>'
                  f'<font color="#ffffff" size="10"><b>{college}</b></font><br/>'
                  f'<font color="#94a3b8" size="7.5">OFFICIAL COLLEGE DISCIPLINARY ASSESSMENT</font>',
                  _s('Normal', textColor=WHITE, leading=16)),
        Paragraph(
            f'<font size="8" color="#a7f3d0"><b>DE LA SALLE UNIVERSITY – DASMARIÑAS</b></font><br/>'
            f'<font size="7.5" color="#cbd5e1">Student Welfare and Formation Office (SWAFO)<br/>'
            f'Violation Management &amp; Behavioral Report<br/>'
            f'Generated: <b>{today.strftime("%B %d, %Y")}</b></font>',
            _s('Normal', textColor=WHITE, fontSize=8, leading=13, alignment=TA_RIGHT)),
    ]], colWidths=[10.2*cm, 7.2*cm])
    hdr.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), DLSUD_GREEN),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
        ('LEFTPADDING',   (0,0), (0,-1),  16),
        ('RIGHTPADDING',  (-1,0),(-1,-1), 16),
    ]))
    story.append(hdr)
    story.append(Spacer(1, 0.3*cm))

    # ── Executive KPI Summary Row ─────────────────────────────────────────────
    kpi_card_data = [
        [
            Paragraph('<font color="#64748b" size="7">TOTAL VIOLATIONS</font><br/><font color="#003624" size="14"><b>' + str(total_college) + '</b></font>', _s('Normal', alignment=TA_CENTER, leading=14)),
            Paragraph('<font color="#64748b" size="7">OPEN / PENDING</font><br/><font color="#e11d48" size="14"><b>' + str(open_cases) + '</b></font>', _s('Normal', alignment=TA_CENTER, leading=14)),
            Paragraph('<font color="#64748b" size="7">RESOLVED / CLOSED</font><br/><font color="#009b69" size="14"><b>' + str(closed_cases) + '</b></font>', _s('Normal', alignment=TA_CENTER, leading=14)),
            Paragraph('<font color="#64748b" size="7">RESOLUTION RATE</font><br/><font color="#0f766e" size="14"><b>' + str(res_rate) + '%</b></font>', _s('Normal', alignment=TA_CENTER, leading=14)),
        ]
    ]
    kpi_tbl = Table(kpi_card_data, colWidths=[4.35*cm, 4.35*cm, 4.35*cm, 4.35*cm])
    kpi_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX',           (0,0), (-1,-1), 0.6, colors.HexColor('#e2e8f0')),
        ('INNERGRID',     (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING',    (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(kpi_tbl)
    story.append(Spacer(1, 0.4*cm))

    # ── Section helper ────────────────────────────────────────────────────────
    def section(title, subtitle=''):
        elems = [Paragraph(title, _s('Heading2', textColor=DLSUD_GREEN, fontSize=11, fontName='Helvetica-Bold', spaceAfter=2))]
        if subtitle:
            elems.append(Paragraph(subtitle, _s('Normal', fontSize=7.5, textColor=SLATE, spaceAfter=4)))
        elems.append(HRFlowable(width='100%', thickness=0.8, color=LIGHT_GREEN, spaceAfter=6))
        return KeepTogether(elems)

    def tbl_style(data, col_w, hl_last=True, hl_row=None):
        t = Table(data, colWidths=col_w)
        cmds = [
            ('BACKGROUND',    (0,0),  (-1,0),  DLSUD_GREEN),
            ('TEXTCOLOR',     (0,0),  (-1,0),  WHITE),
            ('FONTNAME',      (0,0),  (-1,0),  'Helvetica-Bold'),
            ('FONTSIZE',      (0,0),  (-1,-1), 8.5),
            ('ALIGN',         (1,0),  (-1,-1), 'CENTER'),
            ('ROWBACKGROUNDS',(0,1),  (-1,-1 if not hl_last else -2), [WHITE, SLATE_LIGHT]),
            ('GRID',          (0,0),  (-1,-1), 0.4, colors.HexColor('#e2e8f0')),
            ('TOPPADDING',    (0,0),  (-1,-1), 5),
            ('BOTTOMPADDING', (0,0),  (-1,-1), 5),
            ('LEFTPADDING',   (0,0),  (-1,-1), 8),
        ]
        if hl_last:
            cmds += [
                ('BACKGROUND', (0,-1), (-1,-1), LIGHT_GREEN),
                ('FONTNAME',   (0,-1), (-1,-1), 'Helvetica-Bold'),
                ('TEXTCOLOR',  (0,-1), (-1,-1), DLSUD_GREEN),
            ]
        if hl_row is not None:
            cmds += [
                ('BACKGROUND', (0, hl_row), (-1, hl_row), YELLOW_HL),
                ('FONTNAME',   (0, hl_row), (-1, hl_row), 'Helvetica-Bold'),
            ]
        t.setStyle(TableStyle(cmds))
        return t

    # ── 1. Offense Classification ─────────────────────────────────────────────
    story.append(section('1.  Offense Classification',
                         'Comparative semester breakdown of student disciplinary infractions.'))

    sem_data = [
        ['Academic Period', 'Minor Offenses', 'Major Offenses', 'Total Recorded'],
        ['Aug – Dec 2025 (1st Semester)', str(s1_min), str(s1_maj), str(s1_min+s1_maj)],
        ['Jan 12 – Present 2026 (2nd Semester)', str(s2_min), str(s2_maj), str(s2_min+s2_maj)],
        ['TOTAL', str(s1_min+s2_min), str(s1_maj+s2_maj), str(total_college)],
    ]
    story.append(tbl_style(sem_data, [8.4*cm, 3.0*cm, 3.0*cm, 3.0*cm]))
    story.append(Spacer(1, 0.2*cm))
    story.append(_offense_bar_chart(s1_min, s1_maj, s2_min, s2_maj))
    story.append(Spacer(1, 0.4*cm))

    # ── 2. Institutional Position ─────────────────────────────────────────────
    story.append(section('2.  Institutional Position',
                         'Comparative unit distribution. Individual peer totals are confidential per SWAFO institutional privacy policies.'))

    coll_rows = [['College / Academic Unit', 'Total Violations']]
    for c in ALL_COLLEGES:
        val = str(by_college_totals.get(c, '')) if c == college else 'Confidential'
        coll_rows.append([c, val])
    coll_rows.append(['TOTAL — All Colleges', str(total_inst)])
    college_row_idx = next(i for i, r in enumerate(coll_rows) if r[0] == college)
    story.append(tbl_style(coll_rows, [13.4*cm, 4.0*cm], hl_row=college_row_idx))
    story.append(Spacer(1, 0.4*cm))

    # ── 3. Behavioral Risk & Institutional Standing ───────────────────────────
    story.append(section('3.  Behavioral Risk & Institutional Standing',
                         'Student handbook disciplinary status and clearance integrity oversight · DLSU-D Student Handbook 2022–2027'))

    # Distribution bar
    story.append(_risk_bar_chart(risk_buckets, risk_total))
    story.append(Spacer(1, 0.25*cm))

    # Top students table (Score column removed)
    if leaderboard:
        lb_data = [['#', 'Student Name', 'Student No.', 'Handbook Standing', 'Clearance (§14)']]
        for i, e in enumerate(leaderboard, 1):
            lb_data.append([
                str(i),
                e['name'],
                e['id'],
                e['standing'],
                e['clearance']
            ])
        story.append(tbl_style(lb_data, [1.2*cm, 6.2*cm, 3.4*cm, 4.0*cm, 2.6*cm], hl_last=False))
    story.append(Spacer(1, 0.4*cm))

    # ── 4. Escalation Status ──────────────────────────────────────────────────
    story.append(section('4.  Disciplinary Escalation Status',
                         'Minor Offense Progression Tracking — DLSU-D Student Handbook §27.3 Sanction Ladder'))

    esc_data = [
        ['Offense Instance', 'No. of Students', 'Prescribed Disposition'],
        ['1st Minor Offense',  str(tiers[1]), 'Verbal Warning / Conference'],
        ['2nd Minor Offense',  str(tiers[2]), 'Written Reprimand / Notice to Parents'],
        ['3rd Minor Offense',  str(tiers[3]), 'Sanction Applied (§27.3.1.43)'],
        ['4th+ Minor Offense', str(tiers[4]), 'Director Referral / Disciplinary Board (§27.3.5)'],
    ]
    story.append(tbl_style(esc_data, [5.2*cm, 3.5*cm, 8.7*cm], hl_last=False))
    story.append(Spacer(1, 0.4*cm))

    # ── 5. Case Resolution Summary ───────────────────────────────────────────
    story.append(section('5.  Case Resolution Summary',
                         'Overall disposition tracking and institutional case resolution efficiency.'))

    res_data = [
        ['Metric Indicator', 'Institutional Value'],
        ['Total Violations Recorded', str(total_college)],
        ['Open / Pending Review Cases', str(open_cases)],
        ['Resolved / Sanctioned Cases', str(closed_cases)],
        ['Case Resolution Rate', f'{res_rate}%'],
    ]
    story.append(tbl_style(res_data, [11.4*cm, 6.0*cm], hl_last=False))
    story.append(Spacer(1, 0.5*cm))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=0.5, color=SLATE, spaceAfter=4))
    story.append(Paragraph(
        f'Auto-generated by SWAFO Violation Management System · {today.strftime("%B %d, %Y")} · '
        f'Official Document — Confidential · De La Salle University – Dasmariñas.',
        _s('Normal', fontSize=7, textColor=SLATE, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buf.getvalue()
