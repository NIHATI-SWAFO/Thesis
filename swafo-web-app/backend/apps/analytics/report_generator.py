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
    leaderboard = []
    for s in students_qs:
        ser = StudentProfileSerializer(s)
        score = ser.data.get('risk_score', 0)
        if score > 0:
            leaderboard.append({'name': s.user.full_name, 'id': s.student_number, 'score': score})
    leaderboard = sorted(leaderboard, key=lambda x: x['score'], reverse=True)[:8]

    risk_buckets = {'LOW': 0, 'MODERATE': 0, 'HIGH': 0, 'CRITICAL': 0}
    for e in leaderboard:
        lbl, _ = _risk_label(e['score'])
        risk_buckets[lbl] += 1
    risk_total = sum(risk_buckets.values())

    # Escalation tiers
    tiers = {1: 0, 2: 0, 3: 0, 4: 0}
    for s in students_qs:
        mc = college_qs.filter(student=s, rule__category__icontains='minor').count()
        if   mc == 1: tiers[1] += 1
        elif mc == 2: tiers[2] += 1
        elif mc == 3: tiers[3] += 1
        elif mc >= 4: tiers[4] += 1

    # Recidivism
    repeaters = students_qs.annotate(vc=Count('violations')).filter(vc__gt=1)
    pmap = {}
    for s in repeaters:
        vlist = list(s.violations.select_related('rule').order_by('timestamp'))
        for i in range(len(vlist) - 1):
            key = (vlist[i].rule.description[:48], vlist[i+1].rule.description[:48])
            pmap[key] = pmap.get(key, 0) + 1
    patterns = sorted(pmap.items(), key=lambda x: x[1], reverse=True)[:3]

    # College position table
    by_college_totals = {r['student__course']: r['c']
                         for r in all_qs.values('student__course').annotate(c=Count('id'))}

    # ── Story ─────────────────────────────────────────────────────────────────
    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    hdr = Table([[
        Paragraph(f'<font color="#009b69" size="22"><b>{acronym}</b></font><br/>'
                  f'<font color="#ffffff" size="9">{college}</font>',
                  _s('Normal', textColor=WHITE, leading=28)),
        Paragraph(
            f'<font size="8" color="#9ca3af">DE LA SALLE UNIVERSITY – DASMARIÑAS<br/>'
            f'School of Welfare &amp; Formation Officers<br/>'
            f'<b>Violation Management Report</b><br/>'
            f'{today.strftime("%B %d, %Y")}</font>',
            _s('Normal', textColor=WHITE, fontSize=8, leading=13, alignment=TA_RIGHT)),
    ]], colWidths=[10*cm, 7.4*cm])
    hdr.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), DLSUD_GREEN),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0), (-1,-1), 16),
        ('BOTTOMPADDING', (0,0), (-1,-1), 16),
        ('LEFTPADDING',   (0,0), (0,-1),  18),
        ('RIGHTPADDING',  (-1,0),(-1,-1), 18),
    ]))
    story.append(hdr)
    story.append(Spacer(1, 0.4*cm))

    # ── Section helper ────────────────────────────────────────────────────────
    def section(title, subtitle=''):
        elems = [Paragraph(title, _s('Heading2', textColor=DLSUD_GREEN, fontSize=12, spaceAfter=2))]
        if subtitle:
            elems.append(Paragraph(subtitle, _s('Normal', fontSize=7, textColor=SLATE, spaceAfter=4)))
        elems.append(HRFlowable(width='100%', thickness=0.8, color=LIGHT_GREEN, spaceAfter=6))
        return KeepTogether(elems)

    def tbl_style(data, col_w, hl_last=True, hl_row=None):
        t = Table(data, colWidths=col_w)
        cmds = [
            ('BACKGROUND',    (0,0),  (-1,0),  DLSUD_GREEN),
            ('TEXTCOLOR',     (0,0),  (-1,0),  WHITE),
            ('FONTNAME',      (0,0),  (-1,0),  'Helvetica-Bold'),
            ('FONTSIZE',      (0,0),  (-1,-1), 9),
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
    story.append(section('1.  Offense Classification'))

    sem_data = [
        ['Period', 'Minor', 'Major', 'Total'],
        ['Aug – Dec 2025 (1st Sem)', str(s1_min), str(s1_maj), str(s1_min+s1_maj)],
        ['Jan 12 – Present 2026 (2nd Sem)', str(s2_min), str(s2_maj), str(s2_min+s2_maj)],
        ['TOTAL', str(s1_min+s2_min), str(s1_maj+s2_maj), str(total_college)],
    ]
    story.append(tbl_style(sem_data, [8.5*cm, 2.5*cm, 2.5*cm, 2.9*cm]))
    story.append(Spacer(1, 0.25*cm))
    story.append(_offense_bar_chart(s1_min, s1_maj, s2_min, s2_maj))
    story.append(Spacer(1, 0.4*cm))

    # ── 2. Institutional Position ─────────────────────────────────────────────
    story.append(section('2.  Institutional Position',
                         'Other colleges are confidential per SWAFO data privacy policy.'))

    coll_rows = [['College', 'Violations']]
    for c in ALL_COLLEGES:
        val = str(by_college_totals.get(c, '')) if c == college else ''
        coll_rows.append([c, val])
    coll_rows.append(['TOTAL — All Colleges', str(total_inst)])
    college_row_idx = next(i for i, r in enumerate(coll_rows) if r[0] == college)
    story.append(tbl_style(coll_rows, [13.5*cm, 3.4*cm], hl_row=college_row_idx))
    story.append(Spacer(1, 0.4*cm))

    # ── 3. Behavioral Risk Score ──────────────────────────────────────────────
    story.append(section('3.  Behavioral Risk Score',
                         'Temporal Decay Algorithm — score = severity × e^(−0.023 × days_ago) × 1.5 if unresolved'))

    # Distribution bar
    story.append(_risk_bar_chart(risk_buckets, risk_total))
    story.append(Spacer(1, 0.3*cm))

    # Top students table
    if leaderboard:
        lb_data = [['#', 'Student Name', 'Student No.', 'Score', 'Level']]
        for i, e in enumerate(leaderboard, 1):
            lbl, _ = _risk_label(e['score'])
            lb_data.append([str(i), e['name'], e['id'], str(e['score']), lbl])
        story.append(tbl_style(lb_data, [1*cm, 6*cm, 3.5*cm, 2.5*cm, 3.4*cm], hl_last=False))
    story.append(Spacer(1, 0.4*cm))

    # ── 4. Escalation Status ──────────────────────────────────────────────────
    story.append(section('4.  Disciplinary Escalation Status',
                         'Handbook §27.3 — Minor Offense Ladder'))

    esc_data = [
        ['Offense Instance', 'No. of Students', 'Disposition'],
        ['1st Minor Offense',  str(tiers[1]), 'Verbal Warning'],
        ['2nd Minor Offense',  str(tiers[2]), 'Written Reprimand'],
        ['3rd Minor Offense',  str(tiers[3]), 'Escalated — Sanction Applied (§27.3.1.43)'],
        ['4th+ Minor Offense', str(tiers[4]), 'Director Referral Required (§27.3.5)'],
    ]
    story.append(tbl_style(esc_data, [5*cm, 3.5*cm, 8.4*cm], hl_last=False))
    story.append(Spacer(1, 0.4*cm))

    # ── 5. Recidivism Patterns ────────────────────────────────────────────────
    if patterns:
        story.append(section('5.  Recidivism Pattern Detection',
                             'Apriori-Based Association Mining — most common offense progressions among repeat offenders'))
        cell_style = _s('Normal', fontSize=8, textColor=BLACK, leading=11)
        hdr_style  = _s('Normal', fontSize=9, textColor=WHITE, fontName='Helvetica-Bold')
        pat_data = [
            [Paragraph('Gateway Offense', hdr_style),
             Paragraph('Subsequent Risk', hdr_style),
             Paragraph('Count', hdr_style)],
        ]
        for (a, b), cnt in patterns:
            pat_data.append([
                Paragraph(a, cell_style),
                Paragraph(b, cell_style),
                Paragraph(str(cnt), _s('Normal', fontSize=8, alignment=TA_CENTER)),
            ])
        pat_tbl = Table(pat_data, colWidths=[7.8*cm, 7.8*cm, 1.3*cm])
        pat_tbl.setStyle(TableStyle([
            ('BACKGROUND',    (0,0),  (-1,0),  DLSUD_GREEN),
            ('FONTSIZE',      (0,0),  (-1,-1), 8),
            ('ALIGN',         (2,0),  (2,-1),  'CENTER'),
            ('ROWBACKGROUNDS',(0,1),  (-1,-1), [WHITE, SLATE_LIGHT]),
            ('GRID',          (0,0),  (-1,-1), 0.4, colors.HexColor('#e2e8f0')),
            ('TOPPADDING',    (0,0),  (-1,-1), 6),
            ('BOTTOMPADDING', (0,0),  (-1,-1), 6),
            ('LEFTPADDING',   (0,0),  (-1,-1), 8),
            ('VALIGN',        (0,0),  (-1,-1), 'TOP'),
        ]))
        story.append(pat_tbl)
        story.append(Spacer(1, 0.4*cm))


    # ── 6. Case Summary ───────────────────────────────────────────────────────
    story.append(section('6.  Case Resolution Summary'))

    res_data = [
        ['Metric', 'Value'],
        ['Total Violations', str(total_college)],
        ['Open / Pending',   str(open_cases)],
        ['Resolved / Closed', str(closed_cases)],
        ['Resolution Rate',  f'{res_rate}%'],
    ]
    story.append(tbl_style(res_data, [10*cm, 6.9*cm], hl_last=False))
    story.append(Spacer(1, 0.5*cm))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=0.5, color=SLATE, spaceAfter=4))
    story.append(Paragraph(
        f'Auto-generated by SWAFO Violation Management System · {today.strftime("%B %d, %Y")} · '
        f'Confidential — {college} only · Algorithmic outputs are CS Thesis research prototypes (DLSU-D SY 2025–2026).',
        _s('Normal', fontSize=7, textColor=SLATE, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buf.getvalue()
