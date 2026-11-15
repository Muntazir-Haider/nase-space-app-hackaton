import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# Initialize 16:9 widescreen presentation
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Color Palette (Deep Aerospace Dark Theme)
BG_COLOR = RGBColor(7, 10, 19)        # #070a13 Deep space dark
CARD_BG = RGBColor(15, 23, 42)        # #0f172a Slate 900
CARD_BORDER = RGBColor(30, 41, 59)    # #1e293b Slate 800
ACCENT_BLUE = RGBColor(11, 61, 145)   # #0b3d91 NASA Blue
ACCENT_CYAN = RGBColor(56, 189, 248)  # #38bdf8 NASA Cyan
ACCENT_EMERALD = RGBColor(16, 185, 129)# #10b981 Emerald
TEXT_WHITE = RGBColor(255, 255, 255)
TEXT_MUTED = RGBColor(148, 163, 184)  # Slate 400
TEXT_SUB = RGBColor(203, 213, 225)    # Slate 300

def set_slide_background(slide):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = BG_COLOR

def add_header(slide, title_text, category_text="NASA SPACE APPS CHALLENGE 2026"):
    # Category badge
    cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.5), Inches(0.35))
    tf_cat = cat_box.text_frame
    tf_cat.word_wrap = True
    p_cat = tf_cat.paragraphs[0]
    p_cat.text = category_text.upper()
    p_cat.font.size = Pt(11)
    p_cat.font.bold = True
    p_cat.font.color.rgb = ACCENT_CYAN
    p_cat.font.name = "Arial"

    # Slide Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.5), Inches(0.7))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.size = Pt(26)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_WHITE
    p_title.font.name = "Arial"

blank_layout = prs.slide_layouts[6]

# ==============================================================================
# SLIDE 1: Title & Team Introduction (Cover)
# ==============================================================================
s1 = prs.slides.add_slide(blank_layout)
set_slide_background(s1)

# Badge
badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(4.2), Inches(0.45))
badge.fill.solid()
badge.fill.fore_color.rgb = CARD_BG
badge.line.color.rgb = ACCENT_CYAN
tf_b = badge.text_frame
p_b = tf_b.paragraphs[0]
p_b.text = "NASA SPACE APPS CHALLENGE 2026"
p_b.font.size = Pt(11)
p_b.font.bold = True
p_b.font.color.rgb = ACCENT_CYAN
p_b.font.name = "Arial"
p_b.alignment = PP_ALIGN.CENTER

# Main Title
t_box = s1.shapes.add_textbox(Inches(0.8), Inches(1.4), Inches(6.5), Inches(1.8))
tf_t = t_box.text_frame
tf_t.word_wrap = True
p1 = tf_t.paragraphs[0]
p1.text = "MISSION SENTINEL"
p1.font.size = Pt(44)
p1.font.bold = True
p1.font.color.rgb = TEXT_WHITE
p1.font.name = "Arial"

p2 = tf_t.add_paragraph()
p2.text = "Autonomous Astronaut Health Intelligence & Clinical Decision Support System"
p2.font.size = Pt(18)
p2.font.bold = True
p2.font.color.rgb = ACCENT_CYAN
p2.font.name = "Arial"

# Left Card: Mission Context
info_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.4), Inches(5.8), Inches(3.4))
info_card.fill.solid()
info_card.fill.fore_color.rgb = CARD_BG
info_card.line.color.rgb = CARD_BORDER
tf_ic = info_card.text_frame
tf_ic.word_wrap = True

def add_info_row(tf, label, value, is_first=False):
    p = tf.paragraphs[0] if is_first else tf.add_paragraph()
    p.text = f"{label}: "
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.font.name = "Arial"
    run = p.add_run()
    run.text = value
    run.font.bold = False
    run.font.color.rgb = TEXT_SUB

add_info_row(tf_ic, "SELECTED CHALLENGE", "Create Health Monitoring Software for Astronauts on Space Missions", True)
add_info_row(tf_ic, "OPERATIONAL DOMAIN", "Artemis Lunar Transit & Crewed Interplanetary Mars Missions")
add_info_row(tf_ic, "PRIMARY USERS", "Crew Medical Officer (CMO) & Mission Control Flight Surgeons")
add_info_row(tf_ic, "TEAM MEMBERS", "Mubashir Abbas, Muntazir Haider")
add_info_row(tf_ic, "AFFILIATION", "Superior University, Faisalabad / Global Judging Entry")

# Right Image: Hero Station Overview
if os.path.exists("screenshots/01_station_command_overview.png"):
    s1.shapes.add_picture("screenshots/01_station_command_overview.png", Inches(6.8), Inches(1.4), Inches(5.7), Inches(3.2))

# Sub-bar under image
bot_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(4.8), Inches(5.7), Inches(2.0))
bot_card.fill.solid()
bot_card.fill.fore_color.rgb = CARD_BG
bot_card.line.color.rgb = CARD_BORDER
tf_bc = bot_card.text_frame
tf_bc.word_wrap = True
p_bc1 = tf_bc.paragraphs[0]
p_bc1.text = "CORE SYSTEM CAPABILITIES"
p_bc1.font.size = Pt(12)
p_bc1.font.bold = True
p_bc1.font.color.rgb = ACCENT_EMERALD

for pt in [
    "• 100% Offline Edge Architecture (SQLite WAL Engine; Zero External Cloud Calls)",
    "• 3-Consecutive-Day Divergence Deterioration Early Warning Algorithm",
    "• Real 3D NASA Orion Spacecraft ECLSS Telemetry & 360° Human Anatomy Scanner",
    "• One-Click Tamper-Proof Flight Surgeon Dossier with SHA-256 Seal"
]:
    p = tf_bc.add_paragraph()
    p.text = pt
    p.font.size = Pt(10)
    p.font.color.rgb = TEXT_SUB

# ==============================================================================
# SLIDE 2: The Deep-Space Challenge (The 22-Minute Latency Gap)
# ==============================================================================
s2 = prs.slides.add_slide(blank_layout)
set_slide_background(s2)
add_header(s2, "The Deep-Space Challenge: 22-Minute Communication Latency")

# 3 Problem Pillar Cards
card_w = Inches(3.64)
gap = Inches(0.4)
top_pos = Inches(1.6)
card_h = Inches(5.2)

# Card 1: Communication Blackout
c1 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top_pos, card_w, card_h)
c1.fill.solid()
c1.fill.fore_color.rgb = CARD_BG
c1.line.color.rgb = CARD_BORDER
tf_c1 = c1.text_frame
tf_c1.word_wrap = True
p = tf_c1.paragraphs[0]
p.text = "1. THE 22-MIN LATENCY GAP"
p.font.size = Pt(15)
p.font.bold = True
p.font.color.rgb = RGBColor(244, 63, 94) # Rose

bullets1 = [
    ("The Reality: ", "Beyond Low Earth Orbit, radio signals between spacecraft and Earth take up to 22 minutes one-way (44-min round-trip)."),
    ("Telemedicine Fails: ", "Real-time consultation with Earth-based flight surgeons during acute medical emergencies is physically impossible."),
    ("Cloud Dependency Flaw: ", "Commercial cloud-based wellness software immediately disconnects in interplanetary transit."),
    ("The Mandate: ", "The spacecraft must maintain 100% edge-native clinical autonomy.")
]
for title_b, text_b in bullets1:
    p = tf_c1.add_paragraph()
    p.text = title_b
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = text_b
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# Card 2: NASA RIDGE Space Hazards
c2 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8) + card_w + gap, top_pos, card_w, card_h)
c2.fill.solid()
c2.fill.fore_color.rgb = CARD_BG
c2.line.color.rgb = CARD_BORDER
tf_c2 = c2.text_frame
tf_c2.word_wrap = True
p = tf_c2.paragraphs[0]
p.text = "2. NASA RIDGE HAZARDS"
p.font.size = Pt(15)
p.font.bold = True
p.font.color.rgb = RGBColor(245, 158, 11) # Amber

bullets2 = [
    ("R - Radiation: ", "Galactic cosmic rays and solar particle events cause acute cellular damage and cardiac strain."),
    ("I - Isolation: ", "Confinement leads to severe sleep architecture disruption and circadian misalignment."),
    ("D - Distance from Earth: ", "No evacuation capability; medical kits are strictly constrained by vehicle mass/power."),
    ("G - Gravity Fields: ", "Fluid shifts in microgravity cause cephalad redistribution, blunting baroreflexes."),
    ("E - Hostile Environments: ", "Elevated cabin CO2 from ECLSS scrubbers impairs cognitive and cardiovascular function.")
]
for title_b, text_b in bullets2:
    p = tf_c2.add_paragraph()
    p.text = title_b
    p.font.bold = True
    p.font.size = Pt(10.5)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = text_b
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# Card 3: The Danger of Silent Deterioration
c3 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8) + (card_w + gap)*2, top_pos, card_w, card_h)
c3.fill.solid()
c3.fill.fore_color.rgb = CARD_BG
c3.line.color.rgb = CARD_BORDER
tf_c3 = c3.text_frame
tf_c3.word_wrap = True
p = tf_c3.paragraphs[0]
p.text = "3. SILENT DETERIORATION"
p.font.size = Pt(15)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

bullets3 = [
    ("Static Threshold Failure: ", "Traditional medical monitors alert only when vitals cross arbitrary redlines (e.g. HR > 100). In space, that is too late."),
    ("Subtle Multi-Metric Drift: ", "Resting heart rate elevates by +6.5 bpm, sleep degrades by 2.3 hours, and cardiac recovery lags consecutive days prior to collapse."),
    ("The Mission Sentinel Solution: ", "Algorithmic multi-indicator divergence tracking against personalized rolling 14-day baseline corridors."),
    ("Targeted Intervention: ", "Flags clinical deterioration days before mission-threatening symptoms manifest.")
]
for title_b, text_b in bullets3:
    p = tf_c3.add_paragraph()
    p.text = title_b
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = text_b
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# ==============================================================================
# SLIDE 3: Mission Sentinel Solution & Operational Architecture
# ==============================================================================
s3 = prs.slides.add_slide(blank_layout)
set_slide_background(s3)
add_header(s3, "Mission Sentinel: Offline-First Health Operations Hub")

# Left Column: Image of Dashboard
if os.path.exists("screenshots/01_station_command_overview.png"):
    s3.shapes.add_picture("screenshots/01_station_command_overview.png", Inches(0.8), Inches(1.6), Inches(6.8), Inches(3.8))

# Caption Card under image
cap_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.6), Inches(6.8), Inches(1.4))
cap_card.fill.solid()
cap_card.fill.fore_color.rgb = CARD_BG
cap_card.line.color.rgb = CARD_BORDER
tf_cap = cap_card.text_frame
tf_cap.word_wrap = True
p = tf_cap.paragraphs[0]
p.text = "STATION COMMAND DOCK & FLEET OVERVIEW (1920x1080 UI)"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN
p2 = tf_cap.add_paragraph()
p2.text = "Features Artemis III mission crest, real-time UTC/MET clock, active DSN Canberra 70M carrier lock status, and single-click wearable fleet telemetry synchronization."
p2.font.size = Pt(10)
p2.font.color.rgb = TEXT_SUB

# Right Column: Architectural Highlights Card
arch_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.6), Inches(4.7), Inches(5.4))
arch_card.fill.solid()
arch_card.fill.fore_color.rgb = CARD_BG
arch_card.line.color.rgb = CARD_BORDER
tf_arch = arch_card.text_frame
tf_arch.word_wrap = True
p = tf_arch.paragraphs[0]
p.text = "EDGE ARCHITECTURAL PILLARS"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

arch_bullets = [
    ("100% Offline-Native: ", "FastAPI backend backed by SQLite with Write-Ahead Logging (WAL) and busy_timeout=5000ms. Survives total spacecraft reboot without data loss."),
    ("Multi-Role Clearance Access: ", "Granular access controls for Crew Medical Officer, Commander, Mission Specialist, and Earth Flight Surgeon with strict role verification."),
    ("DSN Store-and-Forward Sync: ", "Bi-directional telemetry batch buffering for high-efficiency uplink across Deep Space Network communication passes."),
    ("Apple-Grade Ergonomics: ", "High-contrast tactile interface designed specifically for high-stress aerospace environments and microgravity touch targets.")
]
for title_b, text_b in arch_bullets:
    p = tf_arch.add_paragraph()
    p.text = title_b
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = text_b
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# ==============================================================================
# SLIDE 4: Real 3D NASA Orion Spacecraft & Life Support Synergy
# ==============================================================================
s4 = prs.slides.add_slide(blank_layout)
set_slide_background(s4)
add_header(s4, "NASA Orion MPC-V 3D Systems & ECLSS Integration")

# Left Column: Image of 3D Spacecraft Viewport
if os.path.exists("screenshots/02_real_3d_orion_spacecraft.png"):
    s4.shapes.add_picture("screenshots/02_real_3d_orion_spacecraft.png", Inches(0.8), Inches(1.6), Inches(6.8), Inches(3.8))

cap_card4 = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.6), Inches(6.8), Inches(1.4))
cap_card4.fill.solid()
cap_card4.fill.fore_color.rgb = CARD_BG
cap_card4.line.color.rgb = CARD_BORDER
tf_cap4 = cap_card4.text_frame
tf_cap4.word_wrap = True
p = tf_cap4.paragraphs[0]
p.text = "360° REAL 3D ORION MPC-V TELEMETRY VIEWPORT"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN
p2 = tf_cap4.add_paragraph()
p2.text = "Tactile rotational 3D CAD stage with interactive subsystem pins: Pin 1 (ECLSS Hatch CO2), Pin 2 (ESM Radiation Shield), and Pin 3 (Cabin Atmospheric Pressure)."
p2.font.size = Pt(10)
p2.font.color.rgb = TEXT_SUB

# Right Column: Life Support Telemetry Details
orion_card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.6), Inches(4.7), Inches(5.4))
orion_card.fill.solid()
orion_card.fill.fore_color.rgb = CARD_BG
orion_card.line.color.rgb = CARD_BORDER
tf_orion = orion_card.text_frame
tf_orion.word_wrap = True
p = tf_orion.paragraphs[0]
p.text = "ENVIRONMENT & HEALTH SYNERGY"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

orion_bullets = [
    ("Cross-Correlated Diagnostics: ", "Astronaut heart rates cannot be assessed in a vacuum. Sentinel directly correlates cardiovascular drift with cabin life-support readings."),
    ("ECLSS Scrubber Advisory: ", "Continuous monitoring of cabin CO2 against NASA 2,500 ppm flight limit; triggers automated amine scrubber regeneration cycles when airlock CO2 spikes."),
    ("Cabin Atmospheric Barometry: ", "Validates normoxic cabin pressure (101.3 kPa, O2 partial pressure 21.2 kPa) to rule out hypoxia during crew fatigue events."),
    ("Radiation Dosimetry: ", "Ionizing galactic cosmic radiation rate (μSv/d) tracked in real time against NASA ALARA cumulative 30-day thresholds.")
]
for title_b, text_b in orion_bullets:
    p = tf_orion.add_paragraph()
    p.text = title_b
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = text_b
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# ==============================================================================
# SLIDE 5: 360° Real Human Anatomy & Continuous Biometrics
# ==============================================================================
s5 = prs.slides.add_slide(blank_layout)
set_slide_background(s5)
add_header(s5, "360° Real Human Anatomy Scanner & Live Biometrics")

# Left Column: Image of Anatomical Scanner
if os.path.exists("screenshots/03_real_3d_human_anatomy.png"):
    s5.shapes.add_picture("screenshots/03_real_3d_human_anatomy.png", Inches(0.8), Inches(1.6), Inches(6.8), Inches(3.8))

cap_card5 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.6), Inches(6.8), Inches(1.4))
cap_card5.fill.solid()
cap_card5.fill.fore_color.rgb = CARD_BG
cap_card5.line.color.rgb = CARD_BORDER
tf_cap5 = cap_card5.text_frame
tf_cap5.word_wrap = True
p = tf_cap5.paragraphs[0]
p.text = "VOLUMETRIC ROTATIONAL 3D ANATOMICAL SCANNER"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN
p2 = tf_cap5.add_paragraph()
p2.text = "Continuous 360° rotational CT/MRI reference model with vertical laser sweep, live continuous Lead-II ECG waveform strip, and multi-layer organ biomarker selection."
p2.font.size = Pt(10)
p2.font.color.rgb = TEXT_SUB

# Right Column: Clinical Capabilities
anat_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.6), Inches(4.7), Inches(5.4))
anat_card.fill.solid()
anat_card.fill.fore_color.rgb = CARD_BG
anat_card.line.color.rgb = CARD_BORDER
tf_anat = anat_card.text_frame
tf_anat.word_wrap = True
p = tf_anat.paragraphs[0]
p.text = "CLINICAL SCANNER CAPABILITIES"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

anat_bullets = [
    ("Multi-Layer System Filtering: ", "Allows the Crew Medical Officer to isolate Cardiovascular, Respiratory, Nervous, and Visceral metabolic subsystems with one touch."),
    ("Continuous ECG Lead-II Flow: ", "Live millisecond cardiac rhythm generator highlights tachyarrhythmias, premature ventricular beats, and acute cardiac recovery delay."),
    ("Organ-Level Telemetry Mapping: ", "Localizes pathological strain directly to myocardial tissue, pulmonary capillary beds, and cranial intracranial pressure pathways."),
    ("Flight Clearance Verification: ", "Automated validation against NASA-STD-3001 spaceflight standards: Full Flight Clearance vs Medical Stand-Down.")
]
for title_b, text_b in anat_bullets:
    p = tf_anat.add_paragraph()
    p.text = title_b
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = text_b
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# ==============================================================================
# SLIDE 6: NASA Open Data Integration & Anomaly Detection
# ==============================================================================
s6 = prs.slides.add_slide(blank_layout)
set_slide_background(s6)
add_header(s6, "NASA HRP Open Data Integration & Detection Engine")

# Top Left: Astronaut Profile Detail Thumbnail
if os.path.exists("screenshots/04_astronaut_profile_dr_elena_vance.png"):
    s6.shapes.add_picture("screenshots/04_astronaut_profile_dr_elena_vance.png", Inches(0.8), Inches(1.6), Inches(4.2), Inches(2.5))

# Bottom Left: Corridor Charts Thumbnail
if os.path.exists("screenshots/05_synchronized_biometric_corridor_charts.png"):
    s6.shapes.add_picture("screenshots/05_synchronized_biometric_corridor_charts.png", Inches(0.8), Inches(4.3), Inches(4.2), Inches(2.6))

# Right Column: Data Sources & Engine Details
data_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.3), Inches(1.6), Inches(7.2), Inches(5.3))
data_card.fill.solid()
data_card.fill.fore_color.rgb = CARD_BG
data_card.line.color.rgb = CARD_BORDER
tf_data = data_card.text_frame
tf_data.word_wrap = True
p = tf_data.paragraphs[0]
p.text = "OFFICIAL NASA HRP DATASETS & ALGORITHMIC CORRIDORS"
p.font.size = Pt(15)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

data_bullets = [
    ("HRR-CV-01 (Cardiovascular): ", "Incorporates NASA Human Research Program evidence on microgravity orthostatic intolerance and autonomic cardiac deconditioning."),
    ("HRR-SLEEP-02 (Circadian / Sleep): ", "Models spaceflight cumulative sleep debt and performance degradation metrics from ISS crew actigraphy studies."),
    ("HRR-EXERCISE-03 (Aerobic Fitness): ", "Leverages CEVIS cycle ergometer and T2 treadmill protocols to quantify 1-min heart rate recovery (HRR) post-exertion."),
    ("Rolling 14-Day Baseline Corridors: ", "Calibrates dynamic physiological confidence bands (Mean ± 2 SD) customized to each astronaut's individual baseline, eliminating false alarms."),
    ("3-Consecutive-Day Divergence Trigger: ", "Requires 3 consecutive days of concurrent deviation across RHR (+6.5 bpm), Sleep (-2.3 hrs), and HRR (-9.5 bpm) to declare clinical alert.")
]
for title_b, text_b in data_bullets:
    p = tf_data.add_paragraph()
    p.text = title_b
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = text_b
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# ==============================================================================
# SLIDE 7: Clinical Decision Support & Future Horizons (Closing)
# ==============================================================================
s7 = prs.slides.add_slide(blank_layout)
set_slide_background(s7)
add_header(s7, "Clinical Decision Support, Future Horizons & Earth Benefits")

# Left Column: Image of Handover Report
if os.path.exists("screenshots/06_clinical_handover_report.png"):
    s7.shapes.add_picture("screenshots/06_clinical_handover_report.png", Inches(0.8), Inches(1.6), Inches(6.8), Inches(3.8))

cap_card7 = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.6), Inches(6.8), Inches(1.4))
cap_card7.fill.solid()
cap_card7.fill.fore_color.rgb = CARD_BG
cap_card7.line.color.rgb = CARD_BORDER
tf_cap7 = cap_card7.text_frame
tf_cap7.word_wrap = True
p = tf_cap7.paragraphs[0]
p.text = "OFFICIAL FLIGHT SURGEON CLINICAL HANDOVER DOSSIER"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN
p2 = tf_cap7.add_paragraph()
p2.text = "One-click export of clinical evidence, multi-indicator trajectory analysis, SHA-256 cryptographic seal, and actionable clinical countermeasure prescriptions."
p2.font.size = Pt(10)
p2.font.color.rgb = TEXT_SUB

# Right Column: Horizons and Terrestrial Benefits
future_card = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.6), Inches(4.7), Inches(5.4))
future_card.fill.solid()
future_card.fill.fore_color.rgb = CARD_BG
future_card.line.color.rgb = CARD_BORDER
tf_future = future_card.text_frame
tf_future.word_wrap = True
p = tf_future.paragraphs[0]
p.text = "FUTURE HORIZONS & EARTH CARE"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

future_bullets = [
    ("Cryptographic Clinical Integrity: ", "Every clinical handover report is sealed with SHA-256 tamper-evident digital verification for permanent NASA mission archives."),
    ("Targeted Countermeasures: ", "Automated prescriptions: 45-min interval aerobic protocol on Orion ergometer, melatonin scheduling, and ECLSS scrubber cycling."),
    ("Artemis to Mars Roadmap: ", "Engineered for Lunar Gateway orbit, Artemis surface expeditions, and 3-year crewed Mars transit."),
    ("Life-Saving Terrestrial Benefits: ", "Autonomous clinical decision support deployed to Antarctic research outposts, commercial maritime ships, remote military squads, and rural telemedicine deserts.")
]
for title_b, text_b in future_bullets:
    p = tf_future.add_paragraph()
    p.text = title_b
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = text_b
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# Output file
output_path = "Mission_Sentinel_NASA_Pitch_Deck.pptx"
prs.save(output_path)
print(f"PowerPoint Presentation generated successfully: {output_path}")
