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
TEXT_SUB = RGBColor(226, 232, 240)    # Slate 200 (brighter for easy reading)

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
    p_cat.font.size = Pt(12)
    p_cat.font.bold = True
    p_cat.font.color.rgb = ACCENT_CYAN
    p_cat.font.name = "Arial"

    # Slide Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.5), Inches(0.7))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.size = Pt(28)
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
badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(4.5), Inches(0.45))
badge.fill.solid()
badge.fill.fore_color.rgb = CARD_BG
badge.line.color.rgb = ACCENT_CYAN
tf_b = badge.text_frame
p_b = tf_b.paragraphs[0]
p_b.text = "NASA SPACE APPS CHALLENGE 2026"
p_b.font.size = Pt(12)
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
p1.font.size = Pt(46)
p1.font.bold = True
p1.font.color.rgb = TEXT_WHITE
p1.font.name = "Arial"

p2 = tf_t.add_paragraph()
p2.text = "Smart Health Monitor for Astronauts in Deep Space"
p2.font.size = Pt(20)
p2.font.bold = True
p2.font.color.rgb = ACCENT_CYAN
p2.font.name = "Arial"

# Left Card: Info
info_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.4), Inches(5.8), Inches(3.4))
info_card.fill.solid()
info_card.fill.fore_color.rgb = CARD_BG
info_card.line.color.rgb = CARD_BORDER
tf_ic = info_card.text_frame
tf_ic.word_wrap = True

def add_simple_row(tf, label, value, is_first=False):
    p = tf.paragraphs[0] if is_first else tf.add_paragraph()
    p.text = f"{label}: "
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.font.name = "Arial"
    run = p.add_run()
    run.text = value
    run.font.bold = False
    run.font.color.rgb = TEXT_WHITE

add_simple_row(tf_ic, "CHALLENGE", "Health Monitoring Software for Space Missions", True)
add_simple_row(tf_ic, "MISSION TARGET", "Artemis Moon Transit & Crewed Trips to Mars")
add_simple_row(tf_ic, "WHO USES IT", "Astronaut Doctor (CMO) on Board & Earth Team")
add_simple_row(tf_ic, "TEAM MEMBERS", "Mubashir Abbas, Muntazir Haider")
add_simple_row(tf_ic, "COLLEGE", "Superior University, Faisalabad")

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
p_bc1.text = "WHAT MISSION SENTINEL DOES"
p_bc1.font.size = Pt(13)
p_bc1.font.bold = True
p_bc1.font.color.rgb = ACCENT_EMERALD

simple_points = [
    "✓ Works 100% Offline (No internet or cloud needed)",
    "✓ Catches health problems days before symptoms start",
    "✓ Checks both human vitals and spacecraft life support",
    "✓ Creates 1-click doctor reports with secure digital seals"
]
for pt in simple_points:
    p = tf_bc.add_paragraph()
    p.text = pt
    p.font.size = Pt(12)
    p.font.color.rgb = TEXT_WHITE

# ==============================================================================
# SLIDE 2: The Deep-Space Challenge (The 22-Minute Latency Gap)
# ==============================================================================
s2 = prs.slides.add_slide(blank_layout)
set_slide_background(s2)
add_header(s2, "The Problem: Earth is Too Far Away to Help in Time")

card_w = Inches(3.64)
gap = Inches(0.4)
top_pos = Inches(1.6)
card_h = Inches(5.2)

# Card 1: Communication Delay
c1 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top_pos, card_w, card_h)
c1.fill.solid()
c1.fill.fore_color.rgb = CARD_BG
c1.line.color.rgb = CARD_BORDER
tf_c1 = c1.text_frame
tf_c1.word_wrap = True
p = tf_c1.paragraphs[0]
p.text = "1. THE 22-MINUTE DELAY"
p.font.size = Pt(17)
p.font.bold = True
p.font.color.rgb = RGBColor(244, 63, 94) # Rose

b1 = [
    ("No Instant Calls: ", "Radio messages to Earth take up to 22 minutes one-way (44 minutes round-trip)."),
    ("No Emergency Help: ", "Doctors on Earth cannot talk in real-time during an acute medical crisis."),
    ("Cloud Apps Break: ", "Normal apps that rely on internet or cloud servers stop working in deep space."),
    ("The Need: ", "Astronauts need software that runs completely on its own inside the spacecraft.")
]
for t, desc in b1:
    p = tf_c1.add_paragraph()
    p.text = t
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = desc
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# Card 2: Space Dangers
c2 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8) + card_w + gap, top_pos, card_w, card_h)
c2.fill.solid()
c2.fill.fore_color.rgb = CARD_BG
c2.line.color.rgb = CARD_BORDER
tf_c2 = c2.text_frame
tf_c2.word_wrap = True
p = tf_c2.paragraphs[0]
p.text = "2. DANGERS IN SPACE"
p.font.size = Pt(17)
p.font.bold = True
p.font.color.rgb = RGBColor(245, 158, 11) # Amber

b2 = [
    ("Space Radiation: ", "Invisible cosmic rays damage body cells and put extra stress on the heart."),
    ("Zero Gravity: ", "Without gravity, body fluids shift up to the chest and head, weakening circulation."),
    ("Extreme Isolation: ", "Confinement and noisy modules ruin healthy sleep and disrupt rest schedules."),
    ("Cabin Air Changes: ", "When carbon dioxide (CO2) builds up in the cabin, astronauts suffer headaches and fatigue.")
]
for t, desc in b2:
    p = tf_c2.add_paragraph()
    p.text = t
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = desc
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# Card 3: Hidden Health Decline
c3 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8) + (card_w + gap)*2, top_pos, card_w, card_h)
c3.fill.solid()
c3.fill.fore_color.rgb = CARD_BG
c3.line.color.rgb = CARD_BORDER
tf_c3 = c3.text_frame
tf_c3.word_wrap = True
p = tf_c3.paragraphs[0]
p.text = "3. SILENT HEALTH DECLINE"
p.font.size = Pt(17)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

b3 = [
    ("Old Monitors Are Slow: ", "Traditional hospital alarms only beep when vitals cross a redline. In space, that is too late."),
    ("Small Signs Add Up: ", "Resting heart rate climbs slightly, sleep drops, and heart recovery slows down days before an astronaut feels sick."),
    ("Our Solution: ", "Sentinel tracks multi-day trends and spots the danger before it becomes an emergency.")
]
for t, desc in b3:
    p = tf_c3.add_paragraph()
    p.text = t
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = desc
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# ==============================================================================
# SLIDE 3: Mission Sentinel Solution & Operational Architecture
# ==============================================================================
s3 = prs.slides.add_slide(blank_layout)
set_slide_background(s3)
add_header(s3, "The Solution: An Offline Health Station for the Crew")

# Left Column: Image of Dashboard
if os.path.exists("screenshots/01_station_command_overview.png"):
    s3.shapes.add_picture("screenshots/01_station_command_overview.png", Inches(0.8), Inches(1.6), Inches(6.8), Inches(3.8))

cap_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.6), Inches(6.8), Inches(1.4))
cap_card.fill.solid()
cap_card.fill.fore_color.rgb = CARD_BG
cap_card.line.color.rgb = CARD_BORDER
tf_cap = cap_card.text_frame
tf_cap.word_wrap = True
p = tf_cap.paragraphs[0]
p.text = "MAIN FLIGHT DASHBOARD (RUNNING LIVE ON SCREEN)"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN
p2 = tf_cap.add_paragraph()
p2.text = "Shows the whole crew at a glance, live mission clocks, DSN antenna connection, and instant health sync buttons."
p2.font.size = Pt(11)
p2.font.color.rgb = TEXT_SUB

# Right Column: Easy Points
arch_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.6), Inches(4.7), Inches(5.4))
arch_card.fill.solid()
arch_card.fill.fore_color.rgb = CARD_BG
arch_card.line.color.rgb = CARD_BORDER
tf_arch = arch_card.text_frame
tf_arch.word_wrap = True
p = tf_arch.paragraphs[0]
p.text = "HOW IT HELPS THE CREW"
p.font.size = Pt(18)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

easy_arch = [
    ("100% Offline: ", "Runs locally inside the spaceship on a fast, safe database. Never crashes if internet drops."),
    ("Simple for Astronauts: ", "Large, clear buttons designed for fast use even when wearing thick space gear."),
    ("All Crew in 1 Screen: ", "The onboard doctor sees every astronaut's heart, sleep, and fitness in less than 3 clicks."),
    ("Earth Sync Ready: ", "Saves all records safely and automatically sends data to Earth whenever the antenna links up.")
]
for t, desc in easy_arch:
    p = tf_arch.add_paragraph()
    p.text = t
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = desc
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# ==============================================================================
# SLIDE 4: Real 3D NASA Orion Spacecraft & Life Support Synergy
# ==============================================================================
s4 = prs.slides.add_slide(blank_layout)
set_slide_background(s4)
add_header(s4, "Checking the Spaceship: Real 3D Orion Telemetry")

if os.path.exists("screenshots/02_real_3d_orion_spacecraft.png"):
    s4.shapes.add_picture("screenshots/02_real_3d_orion_spacecraft.png", Inches(0.8), Inches(1.6), Inches(6.8), Inches(3.8))

cap_card4 = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.6), Inches(6.8), Inches(1.4))
cap_card4.fill.solid()
cap_card4.fill.fore_color.rgb = CARD_BG
cap_card4.line.color.rgb = CARD_BORDER
tf_cap4 = cap_card4.text_frame
tf_cap4.word_wrap = True
p = tf_cap4.paragraphs[0]
p.text = "360° 3D ORION SPACECRAFT VIEWER"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN
p2 = tf_cap4.add_paragraph()
p2.text = "Astronauts can spin the 3D Orion spacecraft by hand and click on air hatch, cabin, and radiation shield sensors."
p2.font.size = Pt(11)
p2.font.color.rgb = TEXT_SUB

orion_card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.6), Inches(4.7), Inches(5.4))
orion_card.fill.solid()
orion_card.fill.fore_color.rgb = CARD_BG
orion_card.line.color.rgb = CARD_BORDER
tf_orion = orion_card.text_frame
tf_orion.word_wrap = True
p = tf_orion.paragraphs[0]
p.text = "CONNECTING BODY & SHIP"
p.font.size = Pt(18)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

easy_orion = [
    ("Body + Cabin Combined: ", "If an astronaut's heart rate spikes, Sentinel checks if the cabin air or radiation caused it."),
    ("Cabin Air (CO2) Check: ", "Watches cabin carbon dioxide levels. Warns crew when air filters need to be cycled."),
    ("Air Pressure Check: ", "Monitors cabin oxygen and barometric pressure to prevent low oxygen issues (hypoxia)."),
    ("Radiation Shield Monitor: ", "Measures deep-space radiation so the crew stays well below safe NASA lifetime limits.")
]
for t, desc in easy_orion:
    p = tf_orion.add_paragraph()
    p.text = t
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = desc
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# ==============================================================================
# SLIDE 5: 360° Real Human Anatomy & Continuous Biometrics
# ==============================================================================
s5 = prs.slides.add_slide(blank_layout)
set_slide_background(s5)
add_header(s5, "Checking the Body: 3D Body Scanner & Heart Monitor")

if os.path.exists("screenshots/03_real_3d_human_anatomy.png"):
    s5.shapes.add_picture("screenshots/03_real_3d_human_anatomy.png", Inches(0.8), Inches(1.6), Inches(6.8), Inches(3.8))

cap_card5 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.6), Inches(6.8), Inches(1.4))
cap_card5.fill.solid()
cap_card5.fill.fore_color.rgb = CARD_BG
cap_card5.line.color.rgb = CARD_BORDER
tf_cap5 = cap_card5.text_frame
tf_cap5.word_wrap = True
p = tf_cap5.paragraphs[0]
p.text = "INTERACTIVE 360° HUMAN BODY SCANNER"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN
p2 = tf_cap5.add_paragraph()
p2.text = "Spin the 3D model, watch a continuous live ECG heart rhythm, and highlight heart, lungs, and brain with one tap."
p2.font.size = Pt(11)
p2.font.color.rgb = TEXT_SUB

anat_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.6), Inches(4.7), Inches(5.4))
anat_card.fill.solid()
anat_card.fill.fore_color.rgb = CARD_BG
anat_card.line.color.rgb = CARD_BORDER
tf_anat = anat_card.text_frame
tf_anat.word_wrap = True
p = tf_anat.paragraphs[0]
p.text = "EASY BODY DIAGNOSTICS"
p.font.size = Pt(18)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

easy_anat = [
    ("Spin & Check Organs: ", "Touch and spin the 3D human body to quickly inspect the heart, lungs, and brain."),
    ("Live Heart Line (ECG): ", "A smooth, live heartbeat strip catches fast, weak, or skipping heart rhythms instantly."),
    ("Finds Exact Stress: ", "Points out which organ is stressed—like chest tightness or head pressure from microgravity."),
    ("Flight Ready Check: ", "Automatically shows if an astronaut is fit and safe for high-risk spacewalks (EVAs).")
]
for t, desc in easy_anat:
    p = tf_anat.add_paragraph()
    p.text = t
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = desc
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# ==============================================================================
# SLIDE 6: NASA Open Data Integration & Anomaly Detection
# ==============================================================================
s6 = prs.slides.add_slide(blank_layout)
set_slide_background(s6)
add_header(s6, "Smart Early Warning: Powered by Real NASA Research")

# Top Left: Astronaut Profile Detail Thumbnail
if os.path.exists("screenshots/04_astronaut_profile_dr_elena_vance.png"):
    s6.shapes.add_picture("screenshots/04_astronaut_profile_dr_elena_vance.png", Inches(0.8), Inches(1.6), Inches(4.2), Inches(2.5))

# Bottom Left: Corridor Charts Thumbnail
if os.path.exists("screenshots/05_synchronized_biometric_corridor_charts.png"):
    s6.shapes.add_picture("screenshots/05_synchronized_biometric_corridor_charts.png", Inches(0.8), Inches(4.3), Inches(4.2), Inches(2.6))

data_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.3), Inches(1.6), Inches(7.2), Inches(5.3))
data_card.fill.solid()
data_card.fill.fore_color.rgb = CARD_BG
data_card.line.color.rgb = CARD_BORDER
tf_data = data_card.text_frame
tf_data.word_wrap = True
p = tf_data.paragraphs[0]
p.text = "HOW OUR SMART WARNING ENGINE WORKS"
p.font.size = Pt(18)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

easy_data = [
    ("Built on NASA Studies: ", "Uses official NASA research on astronaut hearts, sleep loss, and exercise deconditioning."),
    ("Personal Normal for Everyone: ", "Learns what is normal for each astronaut over 14 days. No annoying false alarms."),
    ("The 3-Day Rule: ", "If resting heart rate goes up, sleep drops, and heart recovery slows for 3 days in a row, it rings the alarm."),
    ("Clear Color Warnings: ", "Graphs stay clean green when safe, and turn bright red the moment health starts slipping away.")
]
for t, desc in easy_data:
    p = tf_data.add_paragraph()
    p.text = t
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = desc
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# ==============================================================================
# SLIDE 7: Clinical Decision Support & Future Horizons (Closing)
# ==============================================================================
s7 = prs.slides.add_slide(blank_layout)
set_slide_background(s7)
add_header(s7, "Ready for the Moon, Mars & Remote Earth Care")

if os.path.exists("screenshots/06_clinical_handover_report.png"):
    s7.shapes.add_picture("screenshots/06_clinical_handover_report.png", Inches(0.8), Inches(1.6), Inches(6.8), Inches(3.8))

cap_card7 = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.6), Inches(6.8), Inches(1.4))
cap_card7.fill.solid()
cap_card7.fill.fore_color.rgb = CARD_BG
cap_card7.line.color.rgb = CARD_BORDER
tf_cap7 = cap_card7.text_frame
tf_cap7.word_wrap = True
p = tf_cap7.paragraphs[0]
p.text = "1-CLICK DOCTOR MEDICAL HANDOVER REPORT"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN
p2 = tf_cap7.add_paragraph()
p2.text = "Instantly creates a clean, printable medical report with clear treatment steps and a tamper-proof digital security seal."
p2.font.size = Pt(11)
p2.font.color.rgb = TEXT_SUB

future_card = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.6), Inches(4.7), Inches(5.4))
future_card.fill.solid()
future_card.fill.fore_color.rgb = CARD_BG
future_card.line.color.rgb = CARD_BORDER
tf_future = future_card.text_frame
tf_future.word_wrap = True
p = tf_future.paragraphs[0]
p.text = "THE FUTURE & EARTH BENEFITS"
p.font.size = Pt(18)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

easy_future = [
    ("Action Steps for the Doctor: ", "Gives immediate advice: Adjust workout time, change sleep schedule, or cycle air filters."),
    ("Secure Mission Records: ", "Every report has a digital seal (SHA-256) so medical records can never be faked or lost."),
    ("From Moon to Mars: ", "Built for upcoming Artemis Moon landings and long 3-year voyages to Mars."),
    ("Saving Lives on Earth: ", "Can be used anywhere on Earth with no doctors or Wi-Fi—like remote research bases, ships at sea, and rural clinics.")
]
for t, desc in easy_future:
    p = tf_future.add_paragraph()
    p.text = t
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_CYAN
    r = p.add_run()
    r.text = desc
    r.font.bold = False
    r.font.color.rgb = TEXT_SUB

# Output file
output_path = "Mission_Sentinel_NASA_Pitch_Deck.pptx"
prs.save(output_path)
print(f"Easy-word PowerPoint Presentation updated: {output_path}")
