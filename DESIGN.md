---
name: Linden Hotel Concierge Desk
description: Warm paper, evergreen and restrained brass for a tactile hotel wayfinding desk.
colors:
  paper: "#faf7f0"
  evergreen: "#234e3c"
  muted: "#66695e"
  divider: "#d8d4c8"
  brass: "#806338"
  ink: "#293d32"
  body-ink: "#29342c"
  canvas: "#eeece4"
  focus: "#316851"
typography:
  display:
    fontFamily: "'Inria Serif', Georgia, serif"
    fontSize: "clamp(32px,2.65vw,41px)"
    fontWeight: 400
    lineHeight: 1.13
    letterSpacing: "-.028em"
  headline:
    fontFamily: "'Inria Serif', Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-.025em"
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "13px"
    lineHeight: 1.5
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  distance:
    fontFamily: "'Inria Serif', Georgia, serif"
    fontSize: "26px"
    lineHeight: 1
rounded:
  map-label: "4px"
  floor-key: "5px"
  shortcut: "6px"
  control: "7px"
  card: "8px"
  floor-tray: "9px"
spacing:
  compact: "8px"
  control-gap: "10px"
  card: "12px"
  action-inline: "16px"
  phone-gutter: "22px"
  desktop-map-top: "28px"
components:
  button-primary:
    backgroundColor: "{colors.evergreen}"
    textColor: "white"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  location-trigger:
    rounded: "{rounded.control}"
    padding: "10px"
  route-choice:
    rounded: "{rounded.card}"
    padding: "12px"
  floor-key:
    rounded: "{rounded.floor-key}"
    height: "38px"
  facility-shortcut:
    rounded: "{rounded.shortcut}"
    padding: "8px 12px"
---

# Design System: Linden Hotel Concierge Desk

## Overview

**Creative North Star: "Concierge Desk"**

A formal but welcoming hotel wayfinding interface, with ivory paper, evergreen actions, serif headings and restrained brass details. The user's selected Concierge Desk layout remains authoritative: route controls sit to the left of a large architectural map on desktop. Their subsequent request for icons and skeuomorphism supersedes the original reference's flat material treatment.

The current system is extracted from `src/styles.css` and its later material layer, `src/concierge.css`. Typography and geometry stay readable while inset fields, beveled buttons and framed paper surfaces suggest a physical reception desk. These are implemented tokens, not a claim that every accessibility or reference-fidelity check has passed.

**Key Characteristics:**
- Serif hierarchy with compact sans-serif operational text.
- Warm paper surfaces, recessed trays and raised controls.
- Purposeful facility icons paired with visible names.
- A large floor plan with actual computed routes in meters.

## Colors

Evergreen establishes selection and route continuity; brass adds quiet warmth to icons and controls. Paper neutrals carry the interface without competing with the plan.

### Primary
- **Evergreen** (`evergreen`): main actions, selected controls, current route and arrival state.

### Secondary
- **Brass** (`brass`): facility icons, directions heading and small material details. It is not a second route-status color.

### Neutral
- **Warm Paper** (`paper`): research surface and route halo.
- **Desk Canvas** (`canvas`): underlying page canvas, with a warm body gradient above it.
- **Hotel Ink** (`ink`, `body-ink`): distance figures and body copy.
- **Muted Ink** (`muted`): explanatory labels and floor metadata.
- **Paper Divider** (`divider`): base separating rules; material-specific borders use darker warm neutrals.

## Typography

**Display Font:** Inria Serif, Georgia, serif. **Body Font:** Geist, sans-serif.

Serif headings and route-distance figures provide the hotel character; Geist carries forms, destinations, controls and directions. Preserve this established pairing. The display role uses the extracted desktop clamp; at widths up to 1100px it is 34px and at the phone breakpoint it is 35px. The map heading is 32px on desktop, 29px at 1100px and 28px at 760px. Directions are 13px on desktop and 14px on phone; supporting directions increase from 11px to 12px. Small plan labels are separate from body text and require the zoom controls for detailed reading.

## Layout

Desktop uses `minmax(330px,29%) minmax(0,1fr)` for the route column and map. At 1600px and above the route column is 420px and the inherited page max-width is 1900px. The header is 94px tall; desktop route padding is `34px 27px 26px 34px`, and map padding is `28px 29px 25px`.

At 760px and below the layout becomes a vertical flow: introduction and route form, map, route comparison and directions, then the supporting note. Form gutters are 22px; map gutters are 15px. Route choices remain two columns. The header wraps navigation beneath the wordmark. At 370px and below the demo label hides. These are implemented breakpoints; the current phone screenshot is not proof of a particular CSS viewport width.

Keep the map's `1000/760` aspect ratio, coordinate system and independent label positions. Material refinements must not alter route geometry or make guest rooms into corridor shortcuts.

## Elevation & Depth

Depth is structural and restrained. Recessed location fields and navigation trays use the `--pressed` shadow; raised shortcut keys, route cards and small icon plaques use `--raised`. The primary action uses a green gradient with inset top and bottom highlights. The map sits inside a paper frame rather than a generic floating card. Gradients, borders and exact shadow values live in the sidecar because they exceed the frontmatter component schema.

Buttons use 180ms background, border, shadow and transform transitions. Active buttons move down 1px, except map labels preserve their positioning transform. Reduced-motion CSS disables transitions and animations; new browser emulation of that preference is still pending.

## Shapes

Corners are modest and purpose-specific: 4px plan labels, 5px floor keys, 6px shortcuts, 7px inputs/actions, 8px route cards, 9px floor trays. The 45 × 51px brass emblem has a `4px 4px 18px 18px` shield profile. Circular step markers and selection indicators communicate sequence and state. Preserve the map's rectangular architectural character.

## Components

### Buttons

The main action is a tactile evergreen button with white text, a 7px radius and green beveled highlights. Find route is full width, at least 54px tall on desktop and 52px on phone, with a leading route icon and trailing arrow. Hover lightens the gradient; active uses an inset shadow. Disabled buttons retain the base 45% opacity. The inherited focus treatment is a 3px evergreen outline offset 4px.

### Inputs / Fields

Location triggers are recessed paper fields with facility icon plaques, destination names and smaller floor metadata. Desktop minimum height is 64px, phone 61px. The searchable popover uses a warm solid surface, 8px corners and an elevated shadow. Keyboard selection and visible names must remain available; icons are decorative supplements.

### Navigation

The main navigation uses a recessed 48px tray with a raised active tab, reducing to 44px on phone. Floor controls use a recessed 9px tray with discrete beveled keys; the active floor is evergreen and carries `aria-pressed`. Route-presence dots remain distinct from floor selection.

### Route Choices

Route cards show icon, description, serif distance and meters. Selected cards use a pale green inset surface and a small evergreen check indicator. Cards are at least 83px tall on desktop; phone cards become a two-row grid at least 136px tall. Distances remain computed values, not decorative content.

### Map and Facility Shortcuts

The floor image, SVG route overlay and HTML facility buttons share a coordinate plane. The frame is 7px on desktop and 4px on phone. Green selected paths, pale halos and gray dashed alternatives preserve route distinction. Zoom controls form a horizontal tactile group. Explore this floor buttons use the shared facility icon vocabulary and select a destination; changing the destination clears the old route until Find route is used.

### Research Surface

Research retains its separate navigation entry, readable tables, runtime results and JSON export. Warm paper, subtle elevation and muted table headers extend the hotel material system without changing the scientific meaning of results.

## Do's and Don'ts

- **Do** retain the Concierge Desk hierarchy, palette and large map.
- **Do** pair facility icons with names and retain keyboard interaction.
- **Do** use each floor's actual doorway geometry and test wall crossings.
- **Do** distinguish implementation tokens from verified browser evidence.
- **Don't** revert to the superseded flat material treatment or open a new concept round.
- **Don't** hide directions or facility names behind decorative icons.
- **Don't** treat guest rooms as passageways or imply real-building certification.
- **Don't** mark the historical artwork gate or untested accessibility checks as resolved by this visual refinement.
