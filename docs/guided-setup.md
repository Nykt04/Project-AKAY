# Guided establishment setup — October 19, 2026

The user reported that creating a new establishment was confusing. The editor now presents four stages using the existing ivory, evergreen and brass style:

1. **Place & floors:** establishment name, floor-plan upload and floor naming. New drafts start with an empty name. No scan credentials, calibration or graph tools appear here.
2. **Find paths:** choose AI or local scanning, give image-sharing consent when using AI, and scan the selected floor. Manual path creation remains available. A successful scan opens the map-check stage.
3. **Check the map:** inspect labels and paths, correct locations and set real-world distance scale. Basic location tools remain visible; obstacle settings and tracing tools are expandable. Errors and misplaced locations remain visible outside the advanced section.
4. **Review access:** confirm actual access conditions per floor, connect floors where needed and resolve validation issues. Visitor navigation remains disabled until the existing activation validator passes.

Back and step-navigation controls preserve the draft. Floor selection is available throughout. Drafts continue autosaving locally; the Map tools menu now offers Exit setup and closes after creating or switching workspaces. Backup download remains available.

The current step has an explicit accessible label and heading focus on entry. A short GSAP heading transition runs only when reduced motion is not requested. Advanced tools reset to Inspect when their disclosure closes, preventing a hidden obstacle-painting mode from remaining active.

## Checks and limits

59 automated tests and the Vercel production build passed. Tests cover which controls appear in each stage, required floor/name/scale/destination data, the no-key scan alternative, consent gating, and blocked activation for unreviewed connections, alongside the existing routing and scan safeguards. Server-rendered checks do not prove live pointer/keyboard interactions or visual layout.

Fresh browser verification remains blocked by the browser tool's prior security-policy rejection. No alternate browser access was used. Desktop/phone layout, live forward/back interactions, uploads and reduced-motion behavior still need browser confirmation. This revision does not claim participant usability results or improved AI recognition accuracy.
