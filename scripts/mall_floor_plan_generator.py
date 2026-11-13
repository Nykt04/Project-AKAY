"""
Complete Mall Floor Plan Generator - Batas Pambansa Blg. 344 (BP 344) Compliant
Renders 3 full floors + 1 master 3-floor architectural blueprint sheet at 300 DPI.
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

COLOR_BG = '#FBFBF9'
COLOR_WALL = '#0F172A'
COLOR_WALL_FILL = '#1E293B'
COLOR_PARTITION = '#475569'
COLOR_COLUMN = '#090D16'
COLOR_GRID_LINE = '#CBD5E1'
COLOR_GRID_TEXT = '#475569'

FILL_RETAIL = '#FEF3C7'       # Amber
STROKE_RETAIL = '#B45309'
FILL_ANCHOR = '#FDE68A'       # Rich Gold
STROKE_ANCHOR = '#92400E'
FILL_FOOD = '#FFEDD5'         # Orange
STROKE_FOOD = '#C2410C'
FILL_TECH = '#E0F2FE'         # Light Sky Blue
STROKE_TECH = '#0369A1'
FILL_CINEMA = '#EDE9FE'       # Violet
STROKE_CINEMA = '#6D28D9'
FILL_ENTERTAIN = '#FCE7F3'    # Pink
STROKE_ENTERTAIN = '#BE185D'
FILL_ADMIN = '#F1F5F9'        # Slate
STROKE_ADMIN = '#475569'
FILL_RESTROOM = '#CCFBF1'     # Teal
STROKE_RESTROOM = '#0F766E'
FILL_PWD = '#DBEAFE'          # Royal Blue
STROKE_PWD = '#1D4ED8'
FILL_ATRIUM_VOID = '#F8FAFC'  # Void
STROKE_ATRIUM = '#94A3B8'
FILL_RAMP = '#EFF6FF'         # Soft Blue

DIM_COLOR = '#047857'         # Forest Emerald for measurements
BP344_COLOR = '#1D4ED8'       # Accessible Blue

BUILDING_W = 72.0
BUILDING_H = 48.0

GRID_X = [0, 8, 16, 24, 32, 40, 48, 56, 64, 72]
GRID_Y = [0, 8, 16, 24, 32, 40, 48]
GRID_X_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
GRID_Y_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

def setup_ax(ax, title, subtitle):
    ax.set_facecolor(COLOR_BG)
    ax.set_xlim(-6.0, BUILDING_W + 6.0)
    ax.set_ylim(-6.0, BUILDING_H + 7.5)
    ax.set_aspect('equal')
    ax.axis('off')

    # Draw Title Box inside plan area
    title_box = patches.FancyBboxPatch((-3.0, BUILDING_H + 3.2), 48.0, 3.2,
                                       boxstyle="round,pad=0.2", facecolor='#FFFFFF', edgecolor='#0F172A', lw=1.2, zorder=30)
    ax.add_patch(title_box)
    ax.text(-2.0, BUILDING_H + 5.5, title, fontsize=12, fontweight='bold', color='#0F172A', va='center', zorder=31)
    ax.text(-2.0, BUILDING_H + 4.0, subtitle, fontsize=8.0, color='#334155', va='center', zorder=31)

def draw_grid_and_columns(ax):
    # Structural grid lines
    for x in GRID_X:
        ax.plot([x, x], [-2.0, BUILDING_H + 2.0], color=COLOR_GRID_LINE, linestyle='-.', linewidth=0.7, zorder=2)
        for y_pos in [-2.5, BUILDING_H + 2.5]:
            circle = plt.Circle((x, y_pos), 0.9, color='white', ec=COLOR_GRID_TEXT, lw=0.8, zorder=5)
            ax.add_patch(circle)
            ax.text(x, y_pos, GRID_X_LABELS[GRID_X.index(x)], ha='center', va='center', fontsize=6.5, fontweight='bold', color=COLOR_GRID_TEXT, zorder=6)

    for y in GRID_Y:
        ax.plot([-2.0, BUILDING_W + 2.0], [y, y], color=COLOR_GRID_LINE, linestyle='-.', linewidth=0.7, zorder=2)
        for x_pos in [-2.5, BUILDING_W + 2.5]:
            circle = plt.Circle((x_pos, y), 0.9, color='white', ec=COLOR_GRID_TEXT, lw=0.8, zorder=5)
            ax.add_patch(circle)
            ax.text(x_pos, y, GRID_Y_LABELS[GRID_Y.index(y)], ha='center', va='center', fontsize=6.5, fontweight='bold', color=COLOR_GRID_TEXT, zorder=6)

def draw_external_walls(ax, floor=1):
    # Outer boundary wall 0.4m thick
    outer_wall = patches.Rectangle((0, 0), BUILDING_W, BUILDING_H, facecolor='none', edgecolor=COLOR_WALL, lw=2.5, zorder=15)
    ax.add_patch(outer_wall)

def draw_room(ax, x, y, w, h, name, subtitle='', category='retail', room_no='', door=None):
    fills = {
        'retail': (FILL_RETAIL, STROKE_RETAIL),
        'anchor': (FILL_ANCHOR, STROKE_ANCHOR),
        'food': (FILL_FOOD, STROKE_FOOD),
        'tech': (FILL_TECH, STROKE_TECH),
        'cinema': (FILL_CINEMA, STROKE_CINEMA),
        'entertain': (FILL_ENTERTAIN, STROKE_ENTERTAIN),
        'admin': (FILL_ADMIN, STROKE_ADMIN),
        'restroom': (FILL_RESTROOM, STROKE_RESTROOM),
        'pwd': (FILL_PWD, STROKE_PWD),
        'void': (FILL_ATRIUM_VOID, STROKE_ATRIUM),
    }
    fc, ec = fills.get(category, (FILL_RETAIL, STROKE_RETAIL))

    rect = patches.Rectangle((x, y), w, h, facecolor=fc, edgecolor=ec, lw=1.2, zorder=4)
    ax.add_patch(rect)

    area = w * h
    label_text = f"{name}"
    if room_no:
        label_text = f"[{room_no}] {name}"
    sub_text = f"{w:.1f}m x {h:.1f}m ({area:.0f} m²)"
    if subtitle:
        sub_text += f"\n{subtitle}"

    ax.text(x + w/2, y + h/2 + (0.5 if sub_text else 0), label_text, ha='center', va='center',
            fontsize=6.5 if w > 5 else 5.2, fontweight='bold', color='#0F172A', zorder=10)
    if sub_text:
        ax.text(x + w/2, y + h/2 - (0.7 if '\n' in sub_text else 0.5), sub_text, ha='center', va='center',
                fontsize=5.2 if w > 5 else 4.5, color='#334155', zorder=10)

    if door:
        dx, dy, dw, dwall, *extra = door
        dlabel = extra[0] if extra else None
        draw_single_or_double_door(ax, dx, dy, dw, wall=dwall, label=dlabel)

def draw_single_or_double_door(ax, x, y, width, wall='S', label=None):
    if width >= 1.5:
        w_half = width / 2.0
        if wall in ['S', 'N']:
            ax.add_patch(patches.Rectangle((x - width/2, y - 0.25), width, 0.5, facecolor=COLOR_BG, edgecolor='none', zorder=16))
            ax.plot([x - width/2, x - width/2], [y, y + (w_half if wall == 'S' else -w_half)], color='#92400E', lw=1.4, zorder=17)
            arc1 = patches.Arc((x - width/2, y), w_half*2, w_half*2, angle=0, theta1=0 if wall == 'S' else 270, theta2=90 if wall == 'S' else 360, color='#B45309', ls='--', lw=0.8, zorder=17)
            ax.add_patch(arc1)
            ax.plot([x + width/2, x + width/2], [y, y + (w_half if wall == 'S' else -w_half)], color='#92400E', lw=1.4, zorder=17)
            arc2 = patches.Arc((x + width/2, y), w_half*2, w_half*2, angle=0, theta1=90 if wall == 'S' else 180, theta2=180 if wall == 'S' else 270, color='#B45309', ls='--', lw=0.8, zorder=17)
            ax.add_patch(arc2)
        else: # E or W
            ax.add_patch(patches.Rectangle((x - 0.25, y - width/2), 0.5, width, facecolor=COLOR_BG, edgecolor='none', zorder=16))
            ax.plot([x, x + (w_half if wall == 'W' else -w_half)], [y - width/2, y - width/2], color='#92400E', lw=1.4, zorder=17)
            arc1 = patches.Arc((x, y - width/2), w_half*2, w_half*2, angle=0, theta1=0 if wall == 'W' else 90, theta2=90 if wall == 'W' else 180, color='#B45309', ls='--', lw=0.8, zorder=17)
            ax.add_patch(arc1)
            ax.plot([x, x + (w_half if wall == 'W' else -w_half)], [y + width/2, y + width/2], color='#92400E', lw=1.4, zorder=17)
            arc2 = patches.Arc((x, y + width/2), w_half*2, w_half*2, angle=0, theta1=270 if wall == 'W' else 180, theta2=360 if wall == 'W' else 270, color='#B45309', ls='--', lw=0.8, zorder=17)
            ax.add_patch(arc2)
    else:
        if wall in ['S', 'N']:
            ax.add_patch(patches.Rectangle((x - width/2, y - 0.25), width, 0.5, facecolor=COLOR_BG, edgecolor='none', zorder=16))
            ax.plot([x - width/2, x - width/2], [y, y + (width if wall == 'S' else -width)], color='#92400E', lw=1.4, zorder=17)
            arc = patches.Arc((x - width/2, y), width*2, width*2, angle=0, theta1=0 if wall == 'S' else 270, theta2=90 if wall == 'S' else 360, color='#B45309', ls='--', lw=0.8, zorder=17)
            ax.add_patch(arc)
        else:
            ax.add_patch(patches.Rectangle((x - 0.25, y - width/2), 0.5, width, facecolor=COLOR_BG, edgecolor='none', zorder=16))
            ax.plot([x, x + (width if wall == 'W' else -width)], [y - width/2, y - width/2], color='#92400E', lw=1.4, zorder=17)
            arc = patches.Arc((x, y - width/2), width*2, width*2, angle=0, theta1=0 if wall == 'W' else 90, theta2=90 if wall == 'W' else 180, color='#B45309', ls='--', lw=0.8, zorder=17)
            ax.add_patch(arc)

    if label:
        ax.text(x, y - (0.5 if wall in ['S', 'N'] else 0), label, fontsize=5.0, ha='center', va='center', fontweight='bold', color='#92400E', zorder=18,
                bbox=dict(boxstyle='square,pad=0.1', facecolor='#FEF3C7', edgecolor='#D97706', lw=0.4))

def draw_stairs(ax, x, y, w, h, direction='UP', label='STAIRS'):
    rect = patches.Rectangle((x, y), w, h, facecolor='#F8FAFC', edgecolor=COLOR_WALL, lw=1.3, zorder=6)
    ax.add_patch(rect)
    if h > w:
        treads = int(h / 0.30)
        step_h = h / max(treads, 8)
        for i in range(1, int(treads)):
            yy = y + i * step_h
            ax.plot([x, x + w], [yy, yy], color='#64748B', lw=0.7, zorder=7)
        ax.annotate('', xy=(x + w/2, y + h - 0.5 if direction == 'UP' else y + 0.5),
                    xytext=(x + w/2, y + 0.5 if direction == 'UP' else y + h - 0.5),
                    arrowprops=dict(arrowstyle='->', color='#0F172A', lw=1.3), zorder=8)
        ax.add_patch(patches.Rectangle((x, y), w, 0.35, facecolor='#FDE047', edgecolor='#CA8A04', hatch='...', lw=0.5, zorder=8))
        ax.add_patch(patches.Rectangle((x, y + h - 0.35), w, 0.35, facecolor='#FDE047', edgecolor='#CA8A04', hatch='...', lw=0.5, zorder=8))
    else:
        treads = int(w / 0.30)
        step_w = w / max(treads, 8)
        for i in range(1, int(treads)):
            xx = x + i * step_w
            ax.plot([xx, xx], [y, y + h], color='#64748B', lw=0.7, zorder=7)
        ax.annotate('', xy=(x + w - 0.5 if direction == 'UP' else x + 0.5, y + h/2),
                    xytext=(x + 0.5 if direction == 'UP' else x + w - 0.5, y + h/2),
                    arrowprops=dict(arrowstyle='->', color='#0F172A', lw=1.3), zorder=8)
        ax.add_patch(patches.Rectangle((x, y), 0.35, h, facecolor='#FDE047', edgecolor='#CA8A04', hatch='...', lw=0.5, zorder=8))
        ax.add_patch(patches.Rectangle((x + w - 0.35, y), 0.35, h, facecolor='#FDE047', edgecolor='#CA8A04', hatch='...', lw=0.5, zorder=8))

    ax.text(x + w/2, y + h/2, f'{label}\n{direction}\nTread:300 Riser:150', ha='center', va='center', fontsize=5.5, fontweight='bold', color='#0F172A', zorder=9,
            bbox=dict(boxstyle='round,pad=0.15', facecolor='#FFFFFF', edgecolor='#94A3B8', lw=0.5))

def draw_ramp(ax, x, y, w, h, slope='1:12', direction='UP', label='BP 344 RAMP'):
    rect = patches.Rectangle((x, y), w, h, facecolor='#EFF6FF', edgecolor='#2563EB', lw=1.3, zorder=6)
    ax.add_patch(rect)
    if h > w:
        chevrons = int(h / 1.6)
        for i in range(1, chevrons):
            cy = y + i * 1.6
            ax.plot([x + 0.2, x + w/2, x + w - 0.2], [cy - 0.3, cy, cy - 0.3] if direction == 'UP' else [cy + 0.3, cy, cy + 0.3], color='#3B82F6', lw=1.1, zorder=7)
        ax.plot([x + 0.1, x + 0.1], [y, y + h], color='#1D4ED8', lw=1.6, zorder=8)
        ax.plot([x + w - 0.1, x + w - 0.1], [y, y + h], color='#1D4ED8', lw=1.6, zorder=8)
    else:
        chevrons = int(w / 1.6)
        for i in range(1, chevrons):
            cx = x + i * 1.6
            ax.plot([cx - 0.3, cx, cx - 0.3] if direction == 'UP' else [cx + 0.3, cx, cx + 0.3], [y + 0.2, y + h/2, y + h - 0.2], color='#3B82F6', lw=1.1, zorder=7)
        ax.plot([x, x + w], [y + 0.1, y + 0.1], color='#1D4ED8', lw=1.6, zorder=8)
        ax.plot([x, x + w], [y + h - 0.1, y + h - 0.1], color='#1D4ED8', lw=1.6, zorder=8)

    ax.text(x + w/2, y + h/2, f'♿ {label}\nSLOPE {slope} (8.33%)\nCLEAR W: {min(w,h):.2f}m', ha='center', va='center', fontsize=5.3, fontweight='bold', color='#1E40AF', zorder=9,
            bbox=dict(boxstyle='round,pad=0.2', facecolor='#DBEAFE', edgecolor='#2563EB', lw=0.6))

def draw_elevator(ax, x, y, w=2.6, h=2.6, label='ELEVATOR', accessible=True):
    shaft = patches.Rectangle((x, y), w, h, facecolor='#F1F5F9', edgecolor=COLOR_WALL, lw=1.4, zorder=6)
    ax.add_patch(shaft)
    margin = 0.25
    cab = patches.Rectangle((x + margin, y + margin), w - 2*margin, h - 2*margin, facecolor='#E2E8F0', edgecolor='#475569', lw=1.0, zorder=7)
    ax.add_patch(cab)
    ax.plot([x + margin, x + w - margin], [y + margin, y + h - margin], color='#94A3B8', lw=0.8, zorder=7)
    ax.plot([x + margin, x + w - margin], [y + h - margin, y + margin], color='#94A3B8', lw=0.8, zorder=7)
    ax.plot([x + w/2 - 0.5, x + w/2 + 0.5], [y + margin, y + margin], color='#2563EB' if accessible else '#334155', lw=2.6, zorder=8)

    acc_tag = '\n♿ BP 344 ACCESSIBLE' if accessible else ''
    ax.text(x + w/2, y + h/2, f'{label}{acc_tag}\nCab: {w-2*margin:.1f}m x {h-2*margin:.1f}m', ha='center', va='center', fontsize=5.0, fontweight='bold', color='#1E3A8A' if accessible else '#1E293B', zorder=9,
            bbox=dict(boxstyle='square,pad=0.15', facecolor='#EFF6FF' if accessible else '#FFFFFF', edgecolor='#3B82F6' if accessible else '#CBD5E1', lw=0.5))

def draw_escalator(ax, x, y, w, h, label='ESCALATOR'):
    rect = patches.Rectangle((x, y), w, h, facecolor='#FEF2F2', edgecolor='#DC2626', lw=1.2, zorder=6)
    ax.add_patch(rect)
    if h > w:
        half = w / 2.0
        ax.plot([x + half, x + half], [y, y + h], color='#B91C1C', lw=1.0, ls='-', zorder=7)
        for i in range(int(h/0.5)):
            ax.plot([x + 0.1, x + half - 0.1], [y + i*0.5, y + i*0.5], color='#F87171', lw=0.6, zorder=7)
            ax.plot([x + half + 0.1, x + w - 0.1], [y + i*0.5, y + i*0.5], color='#F87171', lw=0.6, zorder=7)
        ax.annotate('', xy=(x + half/2, y + h - 0.5), xytext=(x + half/2, y + 0.5), arrowprops=dict(arrowstyle='->', color='#991B1B', lw=1.2), zorder=8)
        ax.annotate('', xy=(x + half + half/2, y + 0.5), xytext=(x + half + half/2, y + h - 0.5), arrowprops=dict(arrowstyle='->', color='#991B1B', lw=1.2), zorder=8)
        ax.text(x + half/2, y + 1.0, 'UP', ha='center', va='center', fontsize=5.5, fontweight='bold', color='#991B1B', zorder=9)
        ax.text(x + half + half/2, y + 1.0, 'DN', ha='center', va='center', fontsize=5.5, fontweight='bold', color='#991B1B', zorder=9)
    else:
        half = h / 2.0
        ax.plot([x, x + w], [y + half, y + half], color='#B91C1C', lw=1.0, ls='-', zorder=7)
        for i in range(int(w/0.5)):
            ax.plot([x + i*0.5, x + i*0.5], [y + 0.1, y + half - 0.1], color='#F87171', lw=0.6, zorder=7)
            ax.plot([x + i*0.5, x + i*0.5], [y + half + 0.1, y + h - 0.1], color='#F87171', lw=0.6, zorder=7)
        ax.annotate('', xy=(x + w - 0.5, y + half + half/2), xytext=(x + 0.5, y + half + half/2), arrowprops=dict(arrowstyle='->', color='#991B1B', lw=1.2), zorder=8)
        ax.annotate('', xy=(x + 0.5, y + half/2), xytext=(x + w - 0.5, y + half/2), arrowprops=dict(arrowstyle='->', color='#991B1B', lw=1.2), zorder=8)
        ax.text(x + 1.2, y + half + half/2, 'UP', ha='center', va='center', fontsize=5.5, fontweight='bold', color='#991B1B', zorder=9)
        ax.text(x + 1.2, y + half/2, 'DN', ha='center', va='center', fontsize=5.5, fontweight='bold', color='#991B1B', zorder=9)

    ax.text(x + w/2, y + h/2, f'{label}\nDual Truss (W: {w:.1f}m)', ha='center', va='center', fontsize=5.5, fontweight='bold', color='#7F1D1D', zorder=9,
            bbox=dict(boxstyle='square,pad=0.15', facecolor='#FEF2F2', edgecolor='#DC2626', lw=0.5))

def draw_dim_line(ax, x1, y1, x2, y2, label, offset=1.0, orientation='H'):
    color = DIM_COLOR
    tick = 0.35
    if orientation == 'H':
        y_dim = y1 + offset
        ax.plot([x1, x2], [y_dim, y_dim], color=color, lw=0.9, zorder=20)
        ax.plot([x1, x1], [y1, y_dim + tick], color=color, lw=0.6, ls=':', zorder=20)
        ax.plot([x2, x2], [y2, y_dim + tick], color=color, lw=0.6, ls=':', zorder=20)
        ax.plot([x1 - tick, x1 + tick], [y_dim - tick, y_dim + tick], color=color, lw=1.2, zorder=21)
        ax.plot([x2 - tick, x2 + tick], [y_dim - tick, y_dim + tick], color=color, lw=1.2, zorder=21)
        ax.text((x1 + x2)/2, y_dim + 0.15, label, ha='center', va='bottom', fontsize=5.5, fontweight='bold', color=color, zorder=22,
                bbox=dict(boxstyle='square,pad=0.1', facecolor='#FFFFFF', edgecolor='none'))
    else:
        x_dim = x1 + offset
        ax.plot([x_dim, x_dim], [y1, y2], color=color, lw=0.9, zorder=20)
        ax.plot([x1, x_dim + tick], [y1, y1], color=color, lw=0.6, ls=':', zorder=20)
        ax.plot([x2, x_dim + tick], [y2, y2], color=color, lw=0.6, ls=':', zorder=20)
        ax.plot([x_dim - tick, x_dim + tick], [y1 - tick, y1 + tick], color=color, lw=1.2, zorder=21)
        ax.plot([x_dim - tick, x_dim + tick], [y2 - tick, y2 + tick], color=color, lw=1.2, zorder=21)
        ax.text(x_dim + 0.15, (y1 + y2)/2, label, ha='left', va='center', rotation=90, fontsize=5.5, fontweight='bold', color=color, zorder=22,
                bbox=dict(boxstyle='square,pad=0.1', facecolor='#FFFFFF', edgecolor='none'))

def draw_pwd_toilet(ax, x, y, w=2.2, h=2.0, name='PWD RESTROOM'):
    rect = patches.Rectangle((x, y), w, h, facecolor=FILL_PWD, edgecolor=STROKE_PWD, lw=1.2, zorder=5)
    ax.add_patch(rect)
    circle = plt.Circle((x + w/2, y + h/2), 0.75, color='#93C5FD', fill=False, ls='--', lw=0.8, zorder=6)
    ax.add_patch(circle)
    ax.plot([x + 0.3, x + 0.3], [y + 0.4, y + 1.2], color='#1D4ED8', lw=2.0, zorder=7)
    ax.plot([x + 0.3, x + 1.0], [y + 0.4, y + 0.4], color='#1D4ED8', lw=2.0, zorder=7)
    draw_single_or_double_door(ax, x + w - 0.5, y, 0.90, wall='S', label='0.90m')
    ax.text(x + w/2, y + h/2, f'♿ {name}\n{w:.1f}m x {h:.1f}m\n1.5m Turn Circle', ha='center', va='center', fontsize=5.0, fontweight='bold', color='#1E40AF', zorder=8)

def draw_north_arrow(ax, x, y):
    pass

def draw_metric_scale_bar(ax, x, y, length_m=10.0):
    pass

def draw_bp344_compliance_panel(ax, x, y, w=44.0, h=4.2):
    box = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2", facecolor='#EFF6FF', edgecolor='#2563EB', lw=1.2, zorder=25)
    ax.add_patch(box)
    ax.text(x + 0.6, y + h - 0.6, '♿ BATAS PAMBANSA BLG. 344 (PHILIPPINE ACCESSIBILITY LAW) COMPLIANCE SPECIFICATIONS', fontsize=6.8, fontweight='bold', color='#1E3A8A', zorder=26)
    specs = (
        "• RAMPS: Max 1:12 (8.33%) slope; min 1.20m clear width; landings min 1.50m every 6.0m length; dual handrails at 0.70m & 0.90m; 100mm curbs.\n"
        "• CORRIDORS: Min 1.20m clear path (mall concourses 3.0m - 5.0m wide); 1.50m wheelchair turning bays; slip-resistant flooring.\n"
        "• ENTRANCES & DOORS: Min 0.80m clear opening (mall main entries 1.80m - 2.40m double automated); level 1.50m x 1.50m vestibule landings.\n"
        "• ELEVATORS: Accessible car min 1.10m x 1.40m (mall cars 2.1m x 2.1m); 0.90m clear door; braille & tactile controls at 0.90m - 1.20m; audio announcement.\n"
        "• RESTROOMS: Accessible PWD toilet min 1.70m x 1.80m with 1.50m turning radius; outward door (0.90m); grab bars at 0.80m; alarm cord at 0.40m & 0.90m.\n"
        "• STAIRS & ESCALATORS: Stairs tread min 300mm, riser max 150mm; tactile blister warning pavers 300mm from edges; paired with elevators/ramps."
    )
    ax.text(x + 0.6, y + 0.5, specs, fontsize=4.8, color='#1E40AF', va='bottom', linespacing=1.3, zorder=26)

# ==============================================================================
# FLOOR 1: GROUND FLOOR PLAN
# ==============================================================================
def render_floor_1(filename):
    fig, ax = plt.subplots(figsize=(18, 13), dpi=300)
    setup_ax(ax, "LEVEL 1: GROUND FLOOR PLAN · GRAND CONCOURSE & HYPERMARKET",
             "COMMERCIAL MALL DEVELOPMENT · BATAS PAMBANSA BLG. 344 ACCESSIBILITY CERTIFIED")
    draw_grid_and_columns(ax)
    draw_external_walls(ax, floor=1)

    # 1. North Main Entrance
    ax.add_patch(patches.Rectangle((30, 48), 12, 4.5, facecolor='#FEF3C7', edgecolor='#D97706', lw=1.2, zorder=3))
    ax.text(36, 51.5, 'NORTH MAIN PLAZA & ENTRANCE\nAutomated Glass Double Doors (2.40m Clear)', ha='center', va='center', fontsize=6.5, fontweight='bold', color='#92400E', zorder=10)
    draw_ramp(ax, 30.5, 48.5, 2.0, 3.5, slope='1:12', direction='DN', label='EXT. RAMP')
    draw_stairs(ax, 39.5, 48.5, 2.0, 3.5, direction='DN', label='EXT. STEPS')
    draw_single_or_double_door(ax, 36.0, 48.0, 2.40, wall='S', label='2.40m Auto Door')

    # 2. South Plaza Promenade Entrance
    ax.add_patch(patches.Rectangle((30, -4.5), 12, 4.5, facecolor='#FEF3C7', edgecolor='#D97706', lw=1.2, zorder=3))
    ax.text(36, -3.8, 'SOUTH PLAZA PROMENADE ENTRANCE\nWeather-Protected Drop-off & Level Landing', ha='center', va='center', fontsize=6.0, fontweight='bold', color='#92400E', zorder=10)
    draw_single_or_double_door(ax, 36.0, 0.0, 2.40, wall='N', label='2.40m Auto Door')

    # PWD Parking Slots
    for i in range(4):
        px_pos = 14.0 + i * 3.7
        ax.add_patch(patches.Rectangle((px_pos, -4.8), 3.7, 4.5, facecolor='#EFF6FF', edgecolor='#2563EB', lw=1.0, zorder=4))
        ax.add_patch(patches.Rectangle((px_pos + 2.5, -4.8), 1.2, 4.5, facecolor='#DBEAFE', edgecolor='#3B82F6', hatch='///', lw=0.5, zorder=5))
        ax.text(px_pos + 1.25, -2.5, f'♿ PWD BAY {i+1}\n2.50m + 1.20m AISLE\n(BP 344 MIN 3.70m)', ha='center', va='center', fontsize=4.5, fontweight='bold', color='#1D4ED8', zorder=8)
    draw_dim_line(ax, 14.0, -5.2, 28.8, -5.2, '4 x 3.70m PWD ACCESSIBLE PARKING SLOTS', offset=0.0, orientation='H')

    # 3. West Garden Entrance
    draw_single_or_double_door(ax, 0.0, 24.0, 2.00, wall='W', label='2.00m West Entry')
    ax.text(-2.5, 24.0, 'WEST GARDEN\nENTRANCE', ha='right', va='center', fontsize=6.0, fontweight='bold', color='#92400E', zorder=10)

    # 4. East Transit Terminal Entrance
    draw_single_or_double_door(ax, 72.0, 24.0, 2.00, wall='E', label='2.00m East Entry')
    ax.text(74.5, 24.0, 'EAST TRANSIT HUB\n& PASSENGER DROP-OFF', ha='left', va='center', fontsize=6.0, fontweight='bold', color='#92400E', zorder=10)
    ax.add_patch(patches.Rectangle((72.5, 20.0), 3.6, 8.0, facecolor='#EFF6FF', edgecolor='#2563EB', lw=1.0, zorder=4))
    ax.text(74.3, 22.0, '♿ PWD PASSENGER\nLOADING ZONE\n3.60m x 8.00m (BP 344)', ha='center', va='center', fontsize=4.8, fontweight='bold', color='#1D4ED8', zorder=8)

    # 5. Emergency Fire Exits
    for ex_x, ex_y, wall, name in [(0.0, 44.0, 'W', 'NW FIRE EXIT'), (72.0, 44.0, 'E', 'NE FIRE EXIT'),
                                   (0.0, 4.0, 'W', 'SW FIRE EXIT'), (72.0, 4.0, 'E', 'SE SERVICE EXIT')]:
        draw_single_or_double_door(ax, ex_x, ex_y, 1.20, wall=wall, label=f'1.2m {name}')

    # Atrium & Central Circulation
    ax.add_patch(patches.Rectangle((26, 16), 20, 16, facecolor=FILL_ATRIUM_VOID, edgecolor=STROKE_ATRIUM, lw=1.5, ls='--', zorder=3))
    ax.text(36, 31.0, 'CENTRAL GRAND ATRIUM (OPEN TO SKYLIGHT VOID ABOVE)', ha='center', va='center', fontsize=7.0, fontweight='bold', color='#475569', zorder=10)

    draw_escalator(ax, 33.0, 21.0, 6.0, 6.0, label='CRISS-CROSS ESCALATOR (L1 <-> L2)')
    draw_elevator(ax, 41.5, 22.0, 3.0, 2.8, label='SCENIC GLASS LIFT', accessible=True)

    ax.add_patch(patches.Rectangle((33.5, 17.0), 5.0, 2.2, facecolor='#FEF3C7', edgecolor='#D97706', lw=1.0, zorder=6))
    ax.text(36.0, 18.1, 'CONCIERGE & PWD ASSISTANCE\n0.80m Low Counter · Braille Mall Maps', ha='center', va='center', fontsize=5.0, fontweight='bold', color='#92400E', zorder=8)

    draw_room(ax, 27.0, 17.0, 3.2, 3.0, 'Artisan Coffee', 'Kiosk K-101', 'food', 'K1')
    draw_room(ax, 27.0, 26.5, 3.2, 3.0, 'Mobile Accessories', 'Kiosk K-102', 'tech', 'K2')
    draw_room(ax, 41.5, 17.0, 3.2, 3.0, 'Fresh Pastry Bar', 'Kiosk K-103', 'food', 'K3')
    draw_room(ax, 41.5, 26.5, 3.2, 3.0, 'Eyewear & Care', 'Kiosk K-104', 'retail', 'K4')

    # West Wing
    draw_room(ax, 2.0, 28.0, 22.0, 18.0, 'ANCHOR DEPARTMENT STORE - LEVEL 1', 'Apparel, Beauty & Homeware', 'anchor', 'DS-01',
              door=(24.0, 36.0, 3.0, 'W', '3.0m Grand Opening'))

    draw_elevator(ax, 2.5, 20.5, 2.6, 2.6, label='WEST LIFT 1', accessible=True)
    draw_stairs(ax, 5.5, 20.5, 3.0, 5.5, direction='UP', label='WEST STAIRWELL')
    draw_ramp(ax, 9.0, 20.5, 1.8, 5.5, slope='1:12', direction='UP', label='WEST RAMP')

    draw_room(ax, 11.5, 20.5, 3.5, 5.5, 'FEMALE TOILET', '5 Water Closets', 'restroom', 'W-F')
    draw_room(ax, 15.5, 20.5, 3.5, 5.5, 'MALE TOILET', '4 WC + 4 Urinals', 'restroom', 'W-M')
    draw_pwd_toilet(ax, 19.5, 20.5, 2.5, 2.5, name='PWD TOILET')

    draw_room(ax, 2.0, 10.0, 6.5, 8.0, 'Pharmacy & Drugstore', 'Accessible Low Counter', 'retail', 'S-101', door=(5.2, 10.0, 1.2, 'S'))
    draw_room(ax, 8.5, 10.0, 5.0, 8.0, 'Optical Clinic', 'Eye Exam Suite', 'retail', 'S-102', door=(11.0, 10.0, 1.2, 'S'))
    draw_room(ax, 13.5, 10.0, 5.0, 8.0, 'Jewelry & Watches', 'Luxury Timepieces', 'retail', 'S-103', door=(16.0, 10.0, 1.2, 'S'))
    draw_room(ax, 18.5, 10.0, 5.5, 8.0, 'Cosmetics Boutique', 'Skincare & Fragrance', 'retail', 'S-104', door=(21.2, 10.0, 1.2, 'S'))

    draw_room(ax, 2.0, 2.0, 7.0, 6.0, 'Bank & 24/7 ATM', 'Accessible Teller', 'retail', 'S-105', door=(5.5, 8.0, 1.2, 'N'))
    draw_room(ax, 9.0, 2.0, 7.0, 6.0, 'Fast Fashion Unit', 'Casual Wear', 'retail', 'S-106', door=(12.5, 8.0, 1.2, 'N'))
    draw_room(ax, 16.0, 2.0, 8.0, 6.0, 'Footwear & Bags', 'Leather Goods', 'retail', 'S-107', door=(20.0, 8.0, 1.2, 'N'))

    # East Wing
    draw_room(ax, 48.0, 26.0, 22.0, 20.0, 'ANCHOR SUPERMARKET & HYPERMARKET',
              'Groceries, Fresh Produce, Bakery & 6 Checkouts with PWD Lane', 'anchor', 'SM-01',
              door=(48.0, 36.0, 3.0, 'E', '3.0m Wide Entry'))

    draw_elevator(ax, 66.5, 20.5, 2.8, 2.8, label='EAST LIFT 2', accessible=True)
    draw_stairs(ax, 63.0, 20.5, 3.0, 5.5, direction='UP', label='EAST STAIRWELL')
    draw_ramp(ax, 60.5, 20.5, 1.8, 5.5, slope='1:12', direction='UP', label='EAST RAMP')

    draw_room(ax, 56.5, 20.5, 3.5, 5.5, 'FEMALE TOILET', '5 Water Closets', 'restroom', 'E-F')
    draw_room(ax, 52.5, 20.5, 3.5, 5.5, 'MALE TOILET', '4 WC + 4 Urinals', 'restroom', 'E-M')
    draw_pwd_toilet(ax, 49.5, 20.5, 2.5, 2.5, name='PWD TOILET')

    draw_room(ax, 48.0, 10.0, 7.0, 8.0, 'Bookstore & Paper', 'Books & Art Supplies', 'retail', 'S-108', door=(51.5, 10.0, 1.2, 'S'))
    draw_room(ax, 55.0, 10.0, 7.0, 8.0, 'Gourmet Deli & Wine', 'Specialty Foods', 'retail', 'S-109', door=(58.5, 10.0, 1.2, 'S'))
    draw_room(ax, 62.0, 10.0, 8.0, 8.0, 'Electronics Center', 'Smart Home & Audio', 'tech', 'S-110', door=(66.0, 10.0, 1.2, 'S'))

    draw_room(ax, 48.0, 2.0, 7.0, 6.0, 'Convenience Mart', '24/7 Quick Stop', 'retail', 'S-111', door=(51.5, 8.0, 1.2, 'N'))
    draw_room(ax, 55.0, 2.0, 7.0, 6.0, 'Luggage & Travel', 'Suitcases & Bags', 'retail', 'S-112', door=(58.5, 8.0, 1.2, 'N'))
    draw_room(ax, 62.0, 2.0, 8.0, 6.0, 'Home & Living', 'Decor & Kitchenware', 'retail', 'S-113', door=(66.0, 8.0, 1.2, 'N'))

    # Dimensions
    draw_dim_line(ax, 0.0, 48.0, 72.0, 48.0, 'OVERALL BUILDING WIDTH: 72.00 m', offset=5.0, orientation='H')
    draw_dim_line(ax, 0.0, 0.0, 0.0, 48.0, 'OVERALL DEPTH: 48.00 m', offset=-4.5, orientation='V')
    draw_dim_line(ax, 2.0, 9.0, 24.0, 9.0, 'WEST RETAIL CONCOURSE: 4.00 m CLEAR WIDTH', offset=0.0, orientation='H')
    draw_dim_line(ax, 48.0, 9.0, 70.0, 9.0, 'EAST RETAIL CONCOURSE: 4.00 m CLEAR WIDTH', offset=0.0, orientation='H')
    draw_dim_line(ax, 26.0, 24.0, 46.0, 24.0, 'CENTRAL ATRIUM SPAN: 20.00 m', offset=-9.5, orientation='H')

    draw_north_arrow(ax, 68.0, 52.0)
    draw_metric_scale_bar(ax, 50.0, 51.5, length_m=12.0)
    draw_bp344_compliance_panel(ax, 2.0, -5.5, w=68.0, h=4.5)

    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Rendered: {filename}")

# ==============================================================================
# FLOOR 2: SECOND FLOOR PLAN
# ==============================================================================
def render_floor_2(filename):
    fig, ax = plt.subplots(figsize=(18, 13), dpi=300)
    setup_ax(ax, "LEVEL 2: SECOND FLOOR PLAN · FASHION BOUTIQUES & CYBERZONE",
             "COMMERCIAL MALL DEVELOPMENT · BATAS PAMBANSA BLG. 344 ACCESSIBILITY CERTIFIED")
    draw_grid_and_columns(ax)
    draw_external_walls(ax, floor=2)

    # Atrium Void & Skybridge
    ax.add_patch(patches.Rectangle((26, 16), 20, 16, facecolor=FILL_ATRIUM_VOID, edgecolor='#DC2626', lw=1.5, ls='--', zorder=3))
    ax.plot([26, 46], [16, 32], color='#CBD5E1', lw=0.9, ls=':', zorder=4)
    ax.plot([26, 46], [32, 16], color='#CBD5E1', lw=0.9, ls=':', zorder=4)
    ax.text(36, 18.0, 'OPEN ATRIUM VOID OVER LEVEL 1\n(1.20m Glass Balustrade w/ 100mm Toe Kick - BP 344)', ha='center', va='center', fontsize=6.2, fontweight='bold', color='#DC2626', zorder=10)

    ax.add_patch(patches.Rectangle((33.5, 16.0), 5.0, 16.0, facecolor='#FFFFFF', edgecolor='#0F172A', lw=1.5, zorder=5))
    ax.text(36.0, 24.0, 'MEZZANINE SKYBRIDGE\n5.00m Wide Pedestrian Concourse\nAccessible Viewing Bays', ha='center', va='center', fontsize=5.8, fontweight='bold', color='#0F172A', zorder=9)

    draw_escalator(ax, 27.5, 21.0, 5.0, 6.0, label='ESCALATOR (L1 <-> L2)')
    draw_escalator(ax, 39.5, 21.0, 5.0, 6.0, label='ESCALATOR (L2 <-> L3)')
    draw_elevator(ax, 41.5, 28.0, 3.0, 2.8, label='SCENIC GLASS LIFT', accessible=True)

    # West Wing
    draw_room(ax, 2.0, 28.0, 22.0, 18.0, 'ANCHOR DEPARTMENT STORE - LEVEL 2', 'Ladies & Men’s Designer Apparel', 'anchor', 'DS-02',
              door=(24.0, 36.0, 3.0, 'W', '3.0m Opening'))

    draw_elevator(ax, 2.5, 20.5, 2.6, 2.6, label='WEST LIFT 1', accessible=True)
    draw_stairs(ax, 5.5, 20.5, 3.0, 5.5, direction='UP', label='WEST STAIRWELL')
    draw_ramp(ax, 9.0, 20.5, 1.8, 5.5, slope='1:12', direction='UP', label='WEST RAMP')

    draw_room(ax, 11.5, 20.5, 3.5, 5.5, 'FEMALE TOILET', '5 Water Closets', 'restroom', 'W-F2')
    draw_room(ax, 15.5, 20.5, 3.5, 5.5, 'MALE TOILET', '4 WC + 4 Urinals', 'restroom', 'W-M2')
    draw_pwd_toilet(ax, 19.5, 20.5, 2.5, 2.5, name='PWD TOILET')

    draw_room(ax, 2.0, 10.0, 8.0, 8.0, 'Athleisure & Sporting Goods', 'Activewear & Shoes', 'retail', 'S-201', door=(6.0, 10.0, 1.2, 'S'))
    draw_room(ax, 10.0, 10.0, 7.0, 8.0, 'Denim & Casual Studio', 'Jeans & Jackets', 'retail', 'S-202', door=(13.5, 10.0, 1.2, 'S'))
    draw_room(ax, 17.0, 10.0, 7.0, 8.0, 'Kids Fashion & Toys', 'Children’s Boutique', 'retail', 'S-203', door=(20.5, 10.0, 1.2, 'S'))

    draw_room(ax, 2.0, 2.0, 6.0, 6.0, 'Lingerie Studio', 'Intimate Apparel', 'retail', 'S-204', door=(5.0, 8.0, 1.2, 'N'))
    draw_room(ax, 8.0, 2.0, 6.0, 6.0, 'Sneaker Vault', 'Collector Kicks', 'retail', 'S-205', door=(11.0, 8.0, 1.2, 'N'))
    draw_room(ax, 14.0, 2.0, 10.0, 6.0, 'Beauty Salon & Wellness Day Spa', 'Hair & Esthetics', 'retail', 'S-206', door=(19.0, 8.0, 1.5, 'N'))

    # East Wing
    draw_room(ax, 48.0, 34.0, 11.0, 12.0, 'FLAGSHIP COMPUTER & LAPTOPS', 'Authorized Reseller', 'tech', 'CZ-01', door=(48.0, 39.0, 2.0, 'E'))
    draw_room(ax, 59.0, 34.0, 11.0, 12.0, 'SMARTPHONES & GADGET HUB', 'Flagship Brand Stores', 'tech', 'CZ-02', door=(59.0, 39.0, 2.0, 'E'))

    draw_room(ax, 48.0, 22.0, 10.0, 10.0, 'Esports & Gaming Lounge', 'Gaming Gear & VR', 'tech', 'CZ-03', door=(53.0, 22.0, 1.5, 'S'))
    draw_room(ax, 58.0, 22.0, 6.0, 10.0, 'Audio Studio', 'Headphones & HiFi', 'tech', 'CZ-04', door=(61.0, 22.0, 1.2, 'S'))
    draw_room(ax, 64.0, 22.0, 6.0, 10.0, 'Camera & Drone Lab', 'Photo & Imaging', 'tech', 'CZ-05', door=(67.0, 22.0, 1.2, 'S'))

    draw_elevator(ax, 66.5, 20.5, 2.8, 2.8, label='EAST LIFT 2', accessible=True)
    draw_stairs(ax, 63.0, 20.5, 3.0, 5.5, direction='UP', label='EAST STAIRWELL')
    draw_ramp(ax, 60.5, 20.5, 1.8, 5.5, slope='1:12', direction='UP', label='EAST RAMP')

    draw_room(ax, 56.5, 20.5, 3.5, 5.5, 'FEMALE TOILET', '5 Water Closets', 'restroom', 'E-F2')
    draw_room(ax, 52.5, 20.5, 3.5, 5.5, 'MALE TOILET', '4 WC + 4 Urinals', 'restroom', 'E-M2')
    draw_pwd_toilet(ax, 49.5, 20.5, 2.5, 2.5, name='PWD TOILET')

    draw_room(ax, 48.0, 10.0, 7.0, 8.0, 'Dental & Medical Clinic', 'Accessible Health Suite', 'retail', 'S-207', door=(51.5, 10.0, 1.2, 'S'))
    draw_room(ax, 55.0, 10.0, 7.0, 8.0, 'Home Furnishings', 'Modern Living', 'retail', 'S-208', door=(58.5, 10.0, 1.2, 'S'))
    draw_room(ax, 62.0, 10.0, 8.0, 8.0, 'Music & Vinyl Emporium', 'Instruments & Records', 'retail', 'S-209', door=(66.0, 10.0, 1.2, 'S'))

    draw_room(ax, 48.0, 2.0, 7.0, 6.0, 'Art & Craft Hub', 'Stationery & Paints', 'retail', 'S-210', door=(51.5, 8.0, 1.2, 'N'))
    draw_room(ax, 55.0, 2.0, 7.0, 6.0, 'Japanese Novelty Stalls', 'Anime & Gifts', 'retail', 'S-211', door=(58.5, 8.0, 1.2, 'N'))
    draw_room(ax, 62.0, 2.0, 8.0, 6.0, 'Organic Tea & Herbology', 'Wellness Teas', 'food', 'S-212', door=(66.0, 8.0, 1.2, 'N'))

    ax.add_patch(patches.Rectangle((26.0, 4.0), 20.0, 8.0, facecolor='#FEF3C7', edgecolor='#D97706', lw=1.0, zorder=4))
    ax.text(36.0, 8.0, 'SOUTH MEZZANINE GALLERY · ARTISAN CRAFT STALLS\nOpen Promenade · 4.00m Wide Walkway with Accessible Seating', ha='center', va='center', fontsize=6.0, fontweight='bold', color='#92400E', zorder=8)

    draw_dim_line(ax, 0.0, 48.0, 72.0, 48.0, 'BUILDING WIDTH: 72.00 m', offset=5.0, orientation='H')
    draw_dim_line(ax, 0.0, 0.0, 0.0, 48.0, 'BUILDING DEPTH: 48.00 m', offset=-4.5, orientation='V')
    draw_dim_line(ax, 33.5, 15.0, 38.5, 15.0, '5.00 m SKYBRIDGE WIDTH', offset=0.0, orientation='H')

    draw_north_arrow(ax, 68.0, 52.0)
    draw_metric_scale_bar(ax, 50.0, 51.5, length_m=12.0)
    draw_bp344_compliance_panel(ax, 2.0, -5.5, w=68.0, h=4.5)

    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Rendered: {filename}")

# ==============================================================================
# FLOOR 3: THIRD FLOOR PLAN
# ==============================================================================
def render_floor_3(filename):
    fig, ax = plt.subplots(figsize=(18, 13), dpi=300)
    setup_ax(ax, "LEVEL 3: THIRD FLOOR PLAN · FOOD HALL & CINEMA COMPLEX",
             "COMMERCIAL MALL DEVELOPMENT · BATAS PAMBANSA BLG. 344 ACCESSIBILITY CERTIFIED")
    draw_grid_and_columns(ax)
    draw_external_walls(ax, floor=3)

    # Atrium Void
    ax.add_patch(patches.Rectangle((26, 16), 20, 16, facecolor=FILL_ATRIUM_VOID, edgecolor='#DC2626', lw=1.5, ls='--', zorder=3))
    ax.plot([26, 46], [16, 32], color='#CBD5E1', lw=0.9, ls=':', zorder=4)
    ax.plot([26, 46], [32, 16], color='#CBD5E1', lw=0.9, ls=':', zorder=4)
    ax.text(36, 18.0, 'OPEN ATRIUM VOID & CLERESTORY SKYLIGHT\n(1.20m Glass Guardrail w/ 100mm Toe Kick)', ha='center', va='center', fontsize=6.2, fontweight='bold', color='#DC2626', zorder=10)

    draw_escalator(ax, 33.0, 21.0, 6.0, 6.0, label='ESCALATOR ARRIVAL (L2 -> L3)')
    draw_elevator(ax, 41.5, 22.0, 3.0, 2.8, label='SCENIC GLASS LIFT', accessible=True)

    # Food Hall (West)
    ax.add_patch(patches.Rectangle((2.0, 22.0), 22.0, 24.0, facecolor='#FFF7ED', edgecolor='#EA580C', lw=1.5, zorder=3))
    ax.text(13.0, 44.5, 'GRAND GOURMET FOOD HALL', ha='center', va='center', fontsize=8.0, fontweight='bold', color='#9A3412', zorder=10)
    ax.text(13.0, 43.0, 'Communal Seating Area · 1.50m Accessible Aisle Grids · PWD Priority Tables', ha='center', va='center', fontsize=5.5, color='#C2410C', zorder=10)

    food_stalls = [
        ('FS-01', 'Asian Wok & Rice', 2.5, 37.0),
        ('FS-02', 'Sizzling Grill & Steak', 2.5, 32.0),
        ('FS-03', 'Japanese Ramen Lab', 2.5, 27.0),
        ('FS-04', 'Pizza & Artisan Pasta', 2.5, 22.5),
        ('FS-05', 'Mexican Cantina Tacos', 18.5, 37.0),
        ('FS-06', 'Filipino Heritage Eats', 18.5, 32.0),
        ('FS-07', 'Fresh Juices & Smoothies', 18.5, 27.0),
        ('FS-08', 'Gourmet Dessert Crepes', 18.5, 22.5),
    ]
    for code, name, fx, fy in food_stalls:
        draw_room(ax, fx, fy, 5.0, 4.2, name, 'Low Counter: 0.80m', 'food', code)

    ax.add_patch(patches.Rectangle((8.5, 24.0), 9.0, 16.0, facecolor='#FED7AA', edgecolor='#F97316', lw=0.8, ls=':', zorder=4))
    ax.text(13.0, 32.0, 'COMMUNAL DINING ZONE\n(60 Tables · 8 Dedicated PWD Tables\nw/ 0.75m Height & 0.70m Knee Clearance)', ha='center', va='center', fontsize=5.5, fontweight='bold', color='#7C2D12', zorder=9)

    draw_elevator(ax, 2.5, 15.0, 2.6, 2.6, label='WEST LIFT 1', accessible=True)
    draw_stairs(ax, 5.5, 15.0, 3.0, 5.5, direction='DN', label='WEST STAIRWELL')
    draw_ramp(ax, 9.0, 15.0, 1.8, 5.5, slope='1:12', direction='DN', label='WEST RAMP')

    draw_room(ax, 11.5, 15.0, 3.5, 5.5, 'FEMALE TOILET', '5 Water Closets', 'restroom', 'W-F3')
    draw_room(ax, 15.5, 15.0, 3.5, 5.5, 'MALE TOILET', '4 WC + 4 Urinals', 'restroom', 'W-M3')
    draw_pwd_toilet(ax, 19.5, 15.0, 2.5, 2.5, name='PWD TOILET')

    draw_room(ax, 2.0, 2.0, 14.0, 11.0, 'AMUSEMENT ARCADE & VR ZONE', 'Family Games & Simulators', 'entertain', 'ENT-01',
              door=(9.0, 13.0, 2.0, 'N'))
    draw_room(ax, 16.0, 2.0, 8.0, 11.0, 'Billiards & Bowling Lounge', 'Recreation & Bar', 'entertain', 'ENT-02',
              door=(20.0, 13.0, 1.5, 'N'))

    # Cinema Complex (East)
    ax.add_patch(patches.Rectangle((46.0, 20.0), 24.0, 26.0, facecolor='#FAF5FF', edgecolor='#7C3AED', lw=1.5, zorder=3))
    ax.text(58.0, 44.5, 'GRAND CINEMA COMPLEX', ha='center', va='center', fontsize=8.0, fontweight='bold', color='#5B21B6', zorder=10)

    ax.add_patch(patches.Rectangle((47.0, 22.0), 6.0, 3.5, facecolor='#EDE9FE', edgecolor='#7C3AED', lw=1.0, zorder=5))
    ax.text(50.0, 23.7, 'BOX OFFICE\n0.80m PWD Counter', ha='center', va='center', fontsize=5.0, fontweight='bold', color='#5B21B6', zorder=8)

    ax.add_patch(patches.Rectangle((54.0, 22.0), 8.0, 3.5, facecolor='#EDE9FE', edgecolor='#7C3AED', lw=1.0, zorder=5))
    ax.text(58.0, 23.7, 'CINEMA CONCESSIONS\nPopcorn, Snacks & Drinks', ha='center', va='center', fontsize=5.0, fontweight='bold', color='#5B21B6', zorder=8)

    draw_room(ax, 47.0, 27.0, 11.0, 16.0, 'CINEMA 1: DIGITAL SURROUND', '100 Seats + 4 PWD Wheelchair Bays\nDirect Level Access (BP 344 Rule III)', 'cinema', 'C-01',
              door=(52.5, 27.0, 1.8, 'S'))
    draw_room(ax, 59.0, 27.0, 11.0, 16.0, 'CINEMA 2: DOLBY ATMOS', '100 Seats + 4 PWD Wheelchair Bays\nDirect Level Access (BP 344 Rule III)', 'cinema', 'C-02',
              door=(64.5, 27.0, 1.8, 'S'))

    draw_elevator(ax, 66.5, 14.5, 2.8, 2.8, label='EAST LIFT 2', accessible=True)
    draw_stairs(ax, 63.0, 14.5, 3.0, 5.5, direction='DN', label='EAST STAIRWELL')
    draw_ramp(ax, 60.5, 14.5, 1.8, 5.5, slope='1:12', direction='DN', label='EAST RAMP')

    draw_room(ax, 56.5, 14.5, 3.5, 5.5, 'FEMALE TOILET', '5 Water Closets', 'restroom', 'E-F3')
    draw_room(ax, 52.5, 14.5, 3.5, 5.5, 'MALE TOILET', '4 WC + 4 Urinals', 'restroom', 'E-M3')
    draw_pwd_toilet(ax, 49.5, 14.5, 2.5, 2.5, name='PWD TOILET')

    draw_room(ax, 48.0, 8.0, 12.0, 5.5, 'MALL ADMINISTRATION HEADQUARTERS', 'Management & Operations Office', 'admin', 'ADM-01',
              door=(54.0, 8.0, 1.2, 'S'))
    draw_room(ax, 60.0, 8.0, 10.0, 5.5, 'SECURITY OPERATIONS COMMAND', 'CCTV & Fire Monitoring', 'admin', 'SEC-01',
              door=(65.0, 8.0, 1.2, 'S'))

    draw_room(ax, 48.0, 2.0, 10.0, 5.0, 'EMERGENCY MEDICAL & FIRST AID', '♿ Equipped for PWD Care & Stretcher Direct Access', 'pwd', 'MED-01',
              door=(53.0, 7.0, 1.5, 'N'))
    draw_room(ax, 58.0, 2.0, 12.0, 5.0, 'Staff Lounge, Lockers & MEP Storage', 'Authorized Personnel Only', 'admin', 'STF-01',
              door=(64.0, 7.0, 1.2, 'N'))

    draw_dim_line(ax, 0.0, 48.0, 72.0, 48.0, 'BUILDING WIDTH: 72.00 m', offset=5.0, orientation='H')
    draw_dim_line(ax, 0.0, 0.0, 0.0, 48.0, 'BUILDING DEPTH: 48.00 m', offset=-4.5, orientation='V')
    draw_dim_line(ax, 2.0, 21.0, 24.0, 21.0, '22.00 m FOOD HALL WIDTH', offset=0.0, orientation='H')
    draw_dim_line(ax, 47.0, 26.0, 70.0, 26.0, '23.00 m CINEMA FOYER WIDTH', offset=0.0, orientation='H')

    draw_north_arrow(ax, 68.0, 52.0)
    draw_metric_scale_bar(ax, 50.0, 51.5, length_m=12.0)
    draw_bp344_compliance_panel(ax, 2.0, -5.5, w=68.0, h=4.5)

    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Rendered: {filename}")

# ==============================================================================
# MASTER SHEET: ALL 3 FLOORS + ARCHITECTURAL TITLE BLOCK & SCHEDULE
# ==============================================================================
def render_master_sheet(filename):
    fig = plt.figure(figsize=(24, 34), dpi=300)
    fig.patch.set_facecolor('#F8FAFC')

    gs = fig.add_gridspec(4, 1, height_ratios=[1.0, 1.0, 1.0, 0.42], hspace=0.15)

    ax1 = fig.add_subplot(gs[0])
    ax2 = fig.add_subplot(gs[1])
    ax3 = fig.add_subplot(gs[2])
    ax_title = fig.add_subplot(gs[3])

    setup_ax(ax1, "LEVEL 1: GROUND FLOOR PLAN · GRAND CONCOURSE & HYPERMARKET", "SCALE 1:200 · MULTIPLE ACCESSIBLE ENTRANCES · PWD DROP-OFF & PARKING")
    draw_grid_and_columns(ax1)
    draw_external_walls(ax1, floor=1)
    _draw_floor_1_elements(ax1)

    setup_ax(ax2, "LEVEL 2: SECOND FLOOR PLAN · FASHION BOUTIQUES & CYBERZONE", "SCALE 1:200 · CENTRAL VOID SKYBRIDGE · TECH HUB & SPECIALTY SHOPS")
    draw_grid_and_columns(ax2)
    draw_external_walls(ax2, floor=2)
    _draw_floor_2_elements(ax2)

    setup_ax(ax3, "LEVEL 3: THIRD FLOOR PLAN · FOOD HALL & CINEMA COMPLEX", "SCALE 1:200 · 8 GOURMET FOOD STALLS · 2 CINEMA AUDITORIUMS W/ PWD WHEELCHAIR BAYS")
    draw_grid_and_columns(ax3)
    draw_external_walls(ax3, floor=3)
    _draw_floor_3_elements(ax3)

    _draw_master_title_block(ax_title)

    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Rendered Master Sheet: {filename}")

def _draw_floor_1_elements(ax):
    ax.add_patch(patches.Rectangle((30, 48), 12, 4.0, facecolor='#FEF3C7', edgecolor='#D97706', lw=1.2, zorder=3))
    ax.text(36, 50.8, 'NORTH MAIN PLAZA & ENTRANCE · 2.40m Automated Doors', ha='center', va='center', fontsize=6.0, fontweight='bold', color='#92400E', zorder=10)
    draw_ramp(ax, 30.5, 48.5, 2.0, 3.2, slope='1:12', direction='DN', label='EXT. RAMP')
    draw_stairs(ax, 39.5, 48.5, 2.0, 3.2, direction='DN', label='EXT. STEPS')
    draw_single_or_double_door(ax, 36.0, 48.0, 2.40, wall='S', label='2.4m Auto Door')

    ax.add_patch(patches.Rectangle((30, -4.0), 12, 4.0, facecolor='#FEF3C7', edgecolor='#D97706', lw=1.2, zorder=3))
    ax.text(36, -3.2, 'SOUTH PLAZA PROMENADE ENTRANCE · Weather Portico', ha='center', va='center', fontsize=5.8, fontweight='bold', color='#92400E', zorder=10)
    draw_single_or_double_door(ax, 36.0, 0.0, 2.40, wall='N', label='2.4m Auto Door')

    for i in range(4):
        px_pos = 14.0 + i * 3.7
        ax.add_patch(patches.Rectangle((px_pos, -4.5), 3.7, 4.0, facecolor='#EFF6FF', edgecolor='#2563EB', lw=1.0, zorder=4))
        ax.add_patch(patches.Rectangle((px_pos + 2.5, -4.5), 1.2, 4.0, facecolor='#DBEAFE', edgecolor='#3B82F6', hatch='///', lw=0.5, zorder=5))
        ax.text(px_pos + 1.25, -2.5, f'♿ PWD {i+1}\n3.70m', ha='center', va='center', fontsize=4.5, fontweight='bold', color='#1D4ED8', zorder=8)

    draw_single_or_double_door(ax, 0.0, 24.0, 2.00, wall='W', label='2.0m West Entry')
    draw_single_or_double_door(ax, 72.0, 24.0, 2.00, wall='E', label='2.0m East Entry')

    ax.add_patch(patches.Rectangle((26, 16), 20, 16, facecolor=FILL_ATRIUM_VOID, edgecolor=STROKE_ATRIUM, lw=1.5, ls='--', zorder=3))
    draw_escalator(ax, 33.0, 21.0, 6.0, 6.0, label='ESCALATOR (L1 <-> L2)')
    draw_elevator(ax, 41.5, 22.0, 3.0, 2.8, label='SCENIC GLASS LIFT', accessible=True)

    ax.add_patch(patches.Rectangle((33.5, 17.0), 5.0, 2.2, facecolor='#FEF3C7', edgecolor='#D97706', lw=1.0, zorder=6))
    ax.text(36.0, 18.1, 'CONCIERGE & PWD DESK (0.80m)', ha='center', va='center', fontsize=4.8, fontweight='bold', color='#92400E', zorder=8)
    draw_room(ax, 27.0, 17.0, 3.2, 3.0, 'Artisan Coffee', 'Kiosk K1', 'food', 'K1')
    draw_room(ax, 27.0, 26.5, 3.2, 3.0, 'Mobile Gadgets', 'Kiosk K2', 'tech', 'K2')
    draw_room(ax, 41.5, 17.0, 3.2, 3.0, 'Fresh Bakery', 'Kiosk K3', 'food', 'K3')
    draw_room(ax, 41.5, 26.5, 3.2, 3.0, 'Eyewear Care', 'Kiosk K4', 'retail', 'K4')

    draw_room(ax, 2.0, 28.0, 22.0, 18.0, 'ANCHOR DEPT STORE - LEVEL 1', 'Apparel & Beauty', 'anchor', 'DS-01', door=(24.0, 36.0, 3.0, 'W'))
    draw_room(ax, 48.0, 26.0, 22.0, 20.0, 'ANCHOR SUPERMARKET & HYPERMARKET', 'Grocery & Checkouts w/ PWD Lane', 'anchor', 'SM-01', door=(48.0, 36.0, 3.0, 'E'))

    draw_elevator(ax, 2.5, 20.5, 2.6, 2.6, label='WEST LIFT', accessible=True)
    draw_stairs(ax, 5.5, 20.5, 3.0, 5.5, direction='UP', label='STAIRS')
    draw_ramp(ax, 9.0, 20.5, 1.8, 5.5, slope='1:12', direction='UP', label='RAMP')
    draw_room(ax, 11.5, 20.5, 3.5, 5.5, 'FEMALE TOILET', '', 'restroom', 'W-F')
    draw_room(ax, 15.5, 20.5, 3.5, 5.5, 'MALE TOILET', '', 'restroom', 'W-M')
    draw_pwd_toilet(ax, 19.5, 20.5, 2.5, 2.5, name='PWD TOILET')

    draw_elevator(ax, 66.5, 20.5, 2.8, 2.8, label='EAST LIFT', accessible=True)
    draw_stairs(ax, 63.0, 20.5, 3.0, 5.5, direction='UP', label='STAIRS')
    draw_ramp(ax, 60.5, 20.5, 1.8, 5.5, slope='1:12', direction='UP', label='RAMP')
    draw_room(ax, 56.5, 20.5, 3.5, 5.5, 'FEMALE TOILET', '', 'restroom', 'E-F')
    draw_room(ax, 52.5, 20.5, 3.5, 5.5, 'MALE TOILET', '', 'restroom', 'E-M')
    draw_pwd_toilet(ax, 49.5, 20.5, 2.5, 2.5, name='PWD TOILET')

    draw_room(ax, 2.0, 10.0, 6.5, 8.0, 'Pharmacy', 'Low Counter', 'retail', 'S101')
    draw_room(ax, 8.5, 10.0, 5.0, 8.0, 'Optical Clinic', '', 'retail', 'S102')
    draw_room(ax, 13.5, 10.0, 5.0, 8.0, 'Jewelry', '', 'retail', 'S103')
    draw_room(ax, 18.5, 10.0, 5.5, 8.0, 'Cosmetics', '', 'retail', 'S104')
    draw_room(ax, 2.0, 2.0, 7.0, 6.0, 'Bank / ATM', '', 'retail', 'S105')
    draw_room(ax, 9.0, 2.0, 7.0, 6.0, 'Fast Fashion', '', 'retail', 'S106')
    draw_room(ax, 16.0, 2.0, 8.0, 6.0, 'Footwear', '', 'retail', 'S107')

    draw_room(ax, 48.0, 10.0, 7.0, 8.0, 'Bookstore', '', 'retail', 'S108')
    draw_room(ax, 55.0, 10.0, 7.0, 8.0, 'Gourmet Deli', '', 'retail', 'S109')
    draw_room(ax, 62.0, 10.0, 8.0, 8.0, 'Electronics', '', 'tech', 'S110')
    draw_room(ax, 48.0, 2.0, 7.0, 6.0, 'Convenience Mart', '', 'retail', 'S111')
    draw_room(ax, 55.0, 2.0, 7.0, 6.0, 'Luggage & Bags', '', 'retail', 'S112')
    draw_room(ax, 62.0, 2.0, 8.0, 6.0, 'Home Living', '', 'retail', 'S113')

    draw_dim_line(ax, 0.0, 48.0, 72.0, 48.0, '72.00 m', offset=3.5, orientation='H')
    draw_dim_line(ax, 0.0, 0.0, 0.0, 48.0, '48.00 m', offset=-3.5, orientation='V')
    draw_north_arrow(ax, 69.0, 51.0)
    draw_metric_scale_bar(ax, 52.0, 51.0, length_m=10.0)

def _draw_floor_2_elements(ax):
    ax.add_patch(patches.Rectangle((26, 16), 20, 16, facecolor=FILL_ATRIUM_VOID, edgecolor='#DC2626', lw=1.5, ls='--', zorder=3))
    ax.plot([26, 46], [16, 32], color='#CBD5E1', lw=0.9, ls=':', zorder=4)
    ax.plot([26, 46], [32, 16], color='#CBD5E1', lw=0.9, ls=':', zorder=4)
    ax.text(36, 18.0, 'OPEN ATRIUM VOID OVER LEVEL 1 (1.20m Glass Guardrail - BP 344)', ha='center', va='center', fontsize=5.8, fontweight='bold', color='#DC2626', zorder=10)

    ax.add_patch(patches.Rectangle((33.5, 16.0), 5.0, 16.0, facecolor='#FFFFFF', edgecolor='#0F172A', lw=1.5, zorder=5))
    ax.text(36.0, 24.0, 'SKYBRIDGE CONCOURSE (5.0m)', ha='center', va='center', fontsize=5.5, fontweight='bold', color='#0F172A', zorder=9)

    draw_escalator(ax, 27.5, 21.0, 5.0, 6.0, label='ESCALATOR (L1 <-> L2)')
    draw_escalator(ax, 39.5, 21.0, 5.0, 6.0, label='ESCALATOR (L2 <-> L3)')
    draw_elevator(ax, 41.5, 28.0, 3.0, 2.8, label='SCENIC GLASS LIFT', accessible=True)

    draw_room(ax, 2.0, 28.0, 22.0, 18.0, 'ANCHOR DEPT STORE - LEVEL 2', 'Ladies & Men’s Fashion', 'anchor', 'DS-02', door=(24.0, 36.0, 3.0, 'W'))
    draw_elevator(ax, 2.5, 20.5, 2.6, 2.6, label='WEST LIFT', accessible=True)
    draw_stairs(ax, 5.5, 20.5, 3.0, 5.5, direction='UP', label='STAIRS')
    draw_ramp(ax, 9.0, 20.5, 1.8, 5.5, slope='1:12', direction='UP', label='RAMP')
    draw_room(ax, 11.5, 20.5, 3.5, 5.5, 'FEMALE TOILET', '', 'restroom', 'W-F2')
    draw_room(ax, 15.5, 20.5, 3.5, 5.5, 'MALE TOILET', '', 'restroom', 'W-M2')
    draw_pwd_toilet(ax, 19.5, 20.5, 2.5, 2.5, name='PWD TOILET')

    draw_room(ax, 2.0, 10.0, 8.0, 8.0, 'Sporting Goods', '', 'retail', 'S201')
    draw_room(ax, 10.0, 10.0, 7.0, 8.0, 'Denim Studio', '', 'retail', 'S202')
    draw_room(ax, 17.0, 10.0, 7.0, 8.0, 'Kids Boutique', '', 'retail', 'S203')
    draw_room(ax, 2.0, 2.0, 6.0, 6.0, 'Lingerie Studio', '', 'retail', 'S204')
    draw_room(ax, 8.0, 2.0, 6.0, 6.0, 'Sneaker Vault', '', 'retail', 'S205')
    draw_room(ax, 14.0, 2.0, 10.0, 6.0, 'Beauty Salon & Spa', '', 'retail', 'S206')

    draw_room(ax, 48.0, 34.0, 11.0, 12.0, 'COMPUTERS & LAPTOPS', 'Authorized Store', 'tech', 'CZ-01', door=(48.0, 39.0, 2.0, 'E'))
    draw_room(ax, 59.0, 34.0, 11.0, 12.0, 'SMARTPHONE HUB', 'Flagship Brands', 'tech', 'CZ-02', door=(59.0, 39.0, 2.0, 'E'))
    draw_room(ax, 48.0, 22.0, 10.0, 10.0, 'Esports & Gaming', '', 'tech', 'CZ-03')
    draw_room(ax, 58.0, 22.0, 6.0, 10.0, 'Audio Studio', '', 'tech', 'CZ-04')
    draw_room(ax, 64.0, 22.0, 6.0, 10.0, 'Camera & Drone', '', 'tech', 'CZ-05')

    draw_elevator(ax, 66.5, 20.5, 2.8, 2.8, label='EAST LIFT', accessible=True)
    draw_stairs(ax, 63.0, 20.5, 3.0, 5.5, direction='UP', label='STAIRS')
    draw_ramp(ax, 60.5, 20.5, 1.8, 5.5, slope='1:12', direction='UP', label='RAMP')
    draw_room(ax, 56.5, 20.5, 3.5, 5.5, 'FEMALE TOILET', '', 'restroom', 'E-F2')
    draw_room(ax, 52.5, 20.5, 3.5, 5.5, 'MALE TOILET', '', 'restroom', 'E-M2')
    draw_pwd_toilet(ax, 49.5, 20.5, 2.5, 2.5, name='PWD TOILET')

    draw_room(ax, 48.0, 10.0, 7.0, 8.0, 'Dental Clinic', '', 'retail', 'S207')
    draw_room(ax, 55.0, 10.0, 7.0, 8.0, 'Home Decor', '', 'retail', 'S208')
    draw_room(ax, 62.0, 10.0, 8.0, 8.0, 'Music & Vinyl', '', 'retail', 'S209')
    draw_room(ax, 48.0, 2.0, 7.0, 6.0, 'Craft Supplies', '', 'retail', 'S210')
    draw_room(ax, 55.0, 2.0, 7.0, 6.0, 'Japanese Stalls', '', 'retail', 'S211')
    draw_room(ax, 62.0, 2.0, 8.0, 6.0, 'Organic Tea', '', 'food', 'S212')

    ax.add_patch(patches.Rectangle((26.0, 4.0), 20.0, 8.0, facecolor='#FEF3C7', edgecolor='#D97706', lw=1.0, zorder=4))
    ax.text(36.0, 8.0, 'SOUTH MEZZANINE GALLERY · ARTISAN CRAFT STALLS', ha='center', va='center', fontsize=5.5, fontweight='bold', color='#92400E', zorder=8)

    draw_dim_line(ax, 0.0, 48.0, 72.0, 48.0, '72.00 m', offset=3.5, orientation='H')
    draw_dim_line(ax, 0.0, 0.0, 0.0, 48.0, '48.00 m', offset=-3.5, orientation='V')
    draw_north_arrow(ax, 69.0, 51.0)
    draw_metric_scale_bar(ax, 52.0, 51.0, length_m=10.0)

def _draw_floor_3_elements(ax):
    ax.add_patch(patches.Rectangle((26, 16), 20, 16, facecolor=FILL_ATRIUM_VOID, edgecolor='#DC2626', lw=1.5, ls='--', zorder=3))
    ax.plot([26, 46], [16, 32], color='#CBD5E1', lw=0.9, ls=':', zorder=4)
    ax.plot([26, 46], [32, 16], color='#CBD5E1', lw=0.9, ls=':', zorder=4)
    ax.text(36, 18.0, 'OPEN ATRIUM VOID & CLERESTORY SKYLIGHT', ha='center', va='center', fontsize=5.8, fontweight='bold', color='#DC2626', zorder=10)

    draw_escalator(ax, 33.0, 21.0, 6.0, 6.0, label='ESCALATOR ARRIVAL (L2 -> L3)')
    draw_elevator(ax, 41.5, 22.0, 3.0, 2.8, label='SCENIC GLASS LIFT', accessible=True)

    # Food Hall
    ax.add_patch(patches.Rectangle((2.0, 22.0), 22.0, 24.0, facecolor='#FFF7ED', edgecolor='#EA580C', lw=1.5, zorder=3))
    ax.text(13.0, 44.5, 'GRAND GOURMET FOOD HALL', ha='center', va='center', fontsize=7.5, fontweight='bold', color='#9A3412', zorder=10)

    food_stalls = [
        ('FS01', 'Asian Wok', 2.5, 37.0),
        ('FS02', 'Sizzling Grill', 2.5, 32.0),
        ('FS03', 'Ramen Lab', 2.5, 27.0),
        ('FS04', 'Pizza & Pasta', 2.5, 22.5),
        ('FS05', 'Tacos & Grill', 18.5, 37.0),
        ('FS06', 'Filipino Eats', 18.5, 32.0),
        ('FS07', 'Juice Bar', 18.5, 27.0),
        ('FS08', 'Crepes & Dessert', 18.5, 22.5),
    ]
    for code, name, fx, fy in food_stalls:
        draw_room(ax, fx, fy, 5.0, 4.2, name, 'Low Counter: 0.80m', 'food', code)

    ax.add_patch(patches.Rectangle((8.5, 24.0), 9.0, 16.0, facecolor='#FED7AA', edgecolor='#F97316', lw=0.8, ls=':', zorder=4))
    ax.text(13.0, 32.0, 'DINING AREA\n8 PWD Tables', ha='center', va='center', fontsize=5.5, fontweight='bold', color='#7C2D12', zorder=9)

    draw_elevator(ax, 2.5, 15.0, 2.6, 2.6, label='WEST LIFT', accessible=True)
    draw_stairs(ax, 5.5, 15.0, 3.0, 5.5, direction='DN', label='STAIRS')
    draw_ramp(ax, 9.0, 15.0, 1.8, 5.5, slope='1:12', direction='DN', label='RAMP')
    draw_room(ax, 11.5, 15.0, 3.5, 5.5, 'FEMALE TOILET', '', 'restroom', 'W-F3')
    draw_room(ax, 15.5, 15.0, 3.5, 5.5, 'MALE TOILET', '', 'restroom', 'W-M3')
    draw_pwd_toilet(ax, 19.5, 15.0, 2.5, 2.5, name='PWD TOILET')

    draw_room(ax, 2.0, 2.0, 14.0, 11.0, 'ARCADE & VR ZONE', 'Amusements', 'entertain', 'ENT01')
    draw_room(ax, 16.0, 2.0, 8.0, 11.0, 'Bowling Lounge', 'Recreation', 'entertain', 'ENT02')

    # Cinema Complex
    ax.add_patch(patches.Rectangle((46.0, 20.0), 24.0, 26.0, facecolor='#FAF5FF', edgecolor='#7C3AED', lw=1.5, zorder=3))
    ax.text(58.0, 44.5, 'CINEMA COMPLEX & FOYER', ha='center', va='center', fontsize=7.5, fontweight='bold', color='#5B21B6', zorder=10)

    ax.add_patch(patches.Rectangle((47.0, 22.0), 6.0, 3.5, facecolor='#EDE9FE', edgecolor='#7C3AED', lw=1.0, zorder=5))
    ax.text(50.0, 23.7, 'BOX OFFICE\n(0.80m PWD)', ha='center', va='center', fontsize=4.8, fontweight='bold', color='#5B21B6', zorder=8)
    ax.add_patch(patches.Rectangle((54.0, 22.0), 8.0, 3.5, facecolor='#EDE9FE', edgecolor='#7C3AED', lw=1.0, zorder=5))
    ax.text(58.0, 23.7, 'CONCESSIONS\nPopcorn & Snacks', ha='center', va='center', fontsize=4.8, fontweight='bold', color='#5B21B6', zorder=8)

    draw_room(ax, 47.0, 27.0, 11.0, 16.0, 'CINEMA 1', '100 Seats + 4 PWD Bays', 'cinema', 'C-01', door=(52.5, 27.0, 1.8, 'S'))
    draw_room(ax, 59.0, 27.0, 11.0, 16.0, 'CINEMA 2', '100 Seats + 4 PWD Bays', 'cinema', 'C-02', door=(64.5, 27.0, 1.8, 'S'))

    draw_elevator(ax, 66.5, 14.5, 2.8, 2.8, label='EAST LIFT', accessible=True)
    draw_stairs(ax, 63.0, 14.5, 3.0, 5.5, direction='DN', label='STAIRS')
    draw_ramp(ax, 60.5, 14.5, 1.8, 5.5, slope='1:12', direction='DN', label='RAMP')
    draw_room(ax, 56.5, 14.5, 3.5, 5.5, 'FEMALE TOILET', '', 'restroom', 'E-F3')
    draw_room(ax, 52.5, 14.5, 3.5, 5.5, 'MALE TOILET', '', 'restroom', 'E-M3')
    draw_pwd_toilet(ax, 49.5, 14.5, 2.5, 2.5, name='PWD TOILET')

    draw_room(ax, 48.0, 8.0, 12.0, 5.5, 'MALL ADMIN HEADQUARTERS', 'Management Office', 'admin', 'ADM01')
    draw_room(ax, 60.0, 8.0, 10.0, 5.5, 'SECURITY COMMAND', 'CCTV & Alarm', 'admin', 'SEC01')
    draw_room(ax, 48.0, 2.0, 10.0, 5.0, 'FIRST AID & CLINIC', '♿ PWD Medical Bay', 'pwd', 'MED01')
    draw_room(ax, 58.0, 2.0, 12.0, 5.0, 'Staff Lockers & Storage', '', 'admin', 'STF01')

    draw_dim_line(ax, 0.0, 48.0, 72.0, 48.0, '72.00 m', offset=3.5, orientation='H')
    draw_dim_line(ax, 0.0, 0.0, 0.0, 48.0, '48.00 m', offset=-3.5, orientation='V')
    draw_north_arrow(ax, 69.0, 51.0)
    draw_metric_scale_bar(ax, 52.0, 51.0, length_m=10.0)

def _draw_master_title_block(ax):
    ax.set_facecolor('#F8FAFC')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 36)
    ax.axis('off')

    ax.add_patch(patches.Rectangle((1, 1), 98, 34, facecolor='#FFFFFF', edgecolor='#0F172A', lw=1.8, zorder=2))

    ax.add_patch(patches.Rectangle((2, 2), 54, 32, facecolor='#EFF6FF', edgecolor='#2563EB', lw=1.2, zorder=3))
    ax.text(4, 31.5, '♿ BATAS PAMBANSA BLG. 344 (ACCESSIBILITY LAW) SCHEDULE OF COMPLIANCE', fontsize=8.2, fontweight='bold', color='#1E3A8A', zorder=4)

    col1_text = (
        "1. RAMPS & SLOPES (BP 344 Rule II Sec 1.3):\n"
        "   • Maximum slope ratio: 1:12 (8.33% gradient). Minimum clear width: 1.20 m (Mall ramps: 1.80 m to 2.00 m).\n"
        "   • Landings: 1.50 m minimum length at top, bottom, and turns; max 6.0 m run without resting landing.\n"
        "   • Handrails: Continuous on both sides at 0.70 m and 0.90 m heights; 0.30 m horizontal extensions.\n"
        "   • Protective curbs: 0.10 m (100 mm) height to prevent wheelchair casters from slipping off.\n\n"
        "2. CORRIDORS, WALKWAYS & TURNING BASINS (Rule II Sec 1.1):\n"
        "   • Primary mall concourse width: 4.00 m - 6.00 m clear (exceeds BP 344 1.20 m minimum).\n"
        "   • Turning circles: 1.50 m diameter clear unobstructed wheelchair turning space provided every 12.0 m.\n"
        "   • Surfaces: Slip-resistant, non-skid, heavy-traffic architectural finishes.\n\n"
        "3. ACCESSIBLE ENTRANCES & DOORS (Rule II Sec 1.4 / Rule III):\n"
        "   • At least one accessible entrance per building elevation (North, South, East, West provided).\n"
        "   • Clear opening width: Min 0.80 m (Mall primary double doors: 1.80 m to 2.40 m automated sliding).\n"
        "   • Entrances connect directly to accessible parking, passenger loading zone, and transport stops."
    )
    col2_text = (
        "4. ACCESSIBLE ELEVATORS (Rule II Sec 1.7):\n"
        "   • Car dimension: 2.10 m x 2.10 m & 2.60 m x 2.60 m (exceeds min 1.10 m x 1.40 m standard).\n"
        "   • Door opening: 1.00 m clear center-opening; equipped with photo-electric door sensors.\n"
        "   • Controls: Braille and tactile embossed buttons mounted at 0.90 m - 1.20 m above finished floor.\n"
        "   • Audio/visual: Chime tones and voice announcements for floor arrival and direction.\n\n"
        "5. RESTROOMS / TOILET ROOMS (Rule II Sec 1.5):\n"
        "   • Dedicated PWD stall: 2.20 m x 2.50 m (exceeds 1.70 m x 1.80 m minimum).\n"
        "   • 1.50 m wheelchair turning circle inside; grab bars mounted at 0.80 m on both sides.\n"
        "   • Outward-swinging door with 0.90 m clear opening and lever hardware; emergency call button.\n\n"
        "6. SEATING & PARKING (Rule II Sec 1.2 / Rule III Sec 3):\n"
        "   • Cinema: 4 designated 1.20 m x 1.40 m wheelchair spaces with direct level ramp access.\n"
        "   • Parking: 4 PWD bays (3.70 m wide each = 2.50 m stall + 1.20 m access aisle) within 15 m of entrance."
    )
    ax.text(4, 29.5, col1_text, fontsize=5.0, color='#1E3A8A', va='top', linespacing=1.22, zorder=5)
    ax.text(28.5, 29.5, col2_text, fontsize=5.0, color='#1E3A8A', va='top', linespacing=1.22, zorder=5)

    ax.add_patch(patches.Rectangle((57, 2), 20, 32, facecolor='#F8FAFC', edgecolor='#64748B', lw=1.0, zorder=3))
    ax.text(58.5, 31.5, 'ARCHITECTURAL LEGEND', fontsize=8.0, fontweight='bold', color='#0F172A', zorder=4)

    legend_items = [
        (FILL_ANCHOR, STROKE_ANCHOR, 'Anchor Store / Supermarket'),
        (FILL_RETAIL, STROKE_RETAIL, 'Retail Boutiques & Stalls'),
        (FILL_TECH, STROKE_TECH, 'Cyberzone / Electronics'),
        (FILL_FOOD, STROKE_FOOD, 'Food Hall & Dining Stalls'),
        (FILL_CINEMA, STROKE_CINEMA, 'Cinema Halls & Box Office'),
        (FILL_ENTERTAIN, STROKE_ENTERTAIN, 'Family Amusement & Arcade'),
        (FILL_PWD, STROKE_PWD, '♿ BP 344 Accessible PWD Facility'),
        (FILL_RESTROOM, STROKE_RESTROOM, 'Public Restrooms (M/F)'),
        (FILL_ADMIN, STROKE_ADMIN, 'Mall Administration & Clinic'),
    ]
    for idx, (fc, ec, label) in enumerate(legend_items):
        ly = 28.5 - idx * 2.8
        ax.add_patch(patches.Rectangle((58.5, ly), 2.2, 1.8, facecolor=fc, edgecolor=ec, lw=1.0, zorder=5))
        ax.text(61.5, ly + 0.9, label, fontsize=5.5, fontweight='bold' if 'PWD' in label else 'normal', color='#0F172A', va='center', zorder=5)

    ax.add_patch(patches.Rectangle((78, 2), 20, 32, facecolor='#FFFFFF', edgecolor='#0F172A', lw=1.4, zorder=3))
    ax.text(88, 31.5, 'PROJECT TITLE & SHEET INFORMATION', ha='center', va='center', fontsize=7.2, fontweight='bold', color='#0F172A', zorder=4)
    ax.plot([78, 98], [29.5, 29.5], color='#0F172A', lw=1.0, zorder=4)

    title_info = (
        "PROJECT:\n"
        "TRI-LEVEL REGIONAL COMMERCIAL MALL\n"
        "AND ENTERTAINMENT CENTER\n\n"
        "ACCESSIBILITY STANDARD:\n"
        "BATAS PAMBANSA BILANG 344\n"
        "(An Act to Enhance the Mobility of\n"
        "Disabled Persons / IRR Compliant)\n\n"
        "TOTAL GROSS FLOOR AREA: ~10,368 m²\n"
        "FLOORS: Level 1, Level 2, Level 3\n"
        "VERTICAL CIRCULATION:\n"
        "Elevators, Escalators, Stairs, Ramps\n\n"
        "DATE: NOVEMBER 2026\n"
        "SCALE: 1:200 (METRIC)\n"
        "SHEET NO: A-100 (MASTER COMPILATION)"
    )
    ax.text(80, 28.0, title_info, fontsize=5.2, color='#0F172A', va='top', linespacing=1.25, zorder=5)

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'outputs'))
    os.makedirs(out_dir, exist_ok=True)

    f1_path = os.path.join(out_dir, 'mall_level_1_ground_floor_plan.png')
    f2_path = os.path.join(out_dir, 'mall_level_2_second_floor_plan.png')
    f3_path = os.path.join(out_dir, 'mall_level_3_third_floor_plan.png')
    master_path = os.path.join(out_dir, 'mall_3_floor_master_plan_bp344.png')

    print("Generating Level 1 Floor Plan...")
    render_floor_1(f1_path)

    print("Generating Level 2 Floor Plan...")
    render_floor_2(f2_path)

    print("Generating Level 3 Floor Plan...")
    render_floor_3(f3_path)

    print("Generating Master 3-Floor Architectural Compilation...")
    render_master_sheet(master_path)

    public_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public'))
    os.makedirs(public_dir, exist_ok=True)
    import shutil
    shutil.copy(f1_path, os.path.join(public_dir, 'mall_level_1_ground_floor_plan.png'))
    shutil.copy(f2_path, os.path.join(public_dir, 'mall_level_2_second_floor_plan.png'))
    shutil.copy(f3_path, os.path.join(public_dir, 'mall_level_3_third_floor_plan.png'))
    shutil.copy(master_path, os.path.join(public_dir, 'mall_3_floor_master_plan_bp344.png'))
    print("All floor plans generated and copied to public/ successfully.")
