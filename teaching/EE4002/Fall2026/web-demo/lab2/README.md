# Lab 2 — Control foundations

Version 1.3 separates final Review & Download from the task workspace. Task views retain captures and responses; the final view summarizes all tasks and provides student details and both downloads. Returning to a task retains captured work. The course overview features Lab 1 and Lab 2 together and labels the later demonstration checklist separately. Developer-facing footer copy has been removed from the student page.

Open `index.html` directly, or use `demo.html#l2` in the parent website. No build, network, vendor software or hardware is required. All student-facing content is English.

## Teaching sequence

Allow 50–55 minutes for core work including evidence writing, plus 10–15 minutes for introduction/discussion and buffer. P1–P3 are guided practice; I1–I2 are independent tests. X1 is optional preparation for Lecture 6, not a Lab 2 requirement. Instructor solutions are not embedded. In the current 54-page `L5-PLC and Control.pptx`, slides 22–37 supply the required rules and slides 47–54 support X1.

- P1: mass balance and command versus physical flow (8 minutes).
- P2: inclusive boundary conditions and hysteresis memory (8 minutes).
- P3: latched trip, cause clearance, Reset and fresh Start (8 minutes).
- I1: changed flows/thresholds, a filling prediction and six controlled boundary tests (10–12 minutes). Start/AUTO is explicit; a table lists each initialization and final level. Natural-cycle comparison moves to I3.
- I2: held-Start recovery and active-cause Reset rejection (8–10 minutes).
- Discussion: why can the same level give two commands? What evidence proves recovery did not cause an unintended restart?
- I3 (optional challenge/homework, 10–15 minutes): design two candidate control bands and compare each at two outlet flows over 120 s. Keep level within 0.75–1.25 m while reducing switching. Explain margins, tradeoffs and finite-window limitations. No PID prerequisite.

The single-tank constant-outflow model matches L5. It deliberately does not inherit the older shared two-tank demonstration. Core ON/OFF commands cannot request intermediate pump speeds. X1 explicitly changes to an ideal continuously adjustable pump. It remains an integrating tank; the L5 first-order tuning comparison is a different model.

## Operation and evidence

Every task starts with Load baseline, then prediction, student-controlled tests, captures, and explanation. Navigation does not grade or lock students out. Loading a baseline preserves captured evidence. The live plant is reset between tasks; browser drafts restore writing and captures only. Capture up to 20 checkpoints per task with up to 6,000 recent samples and 1,000 events each. Limits are explicit and exports are not tamper-proof. Local storage can fill; an on-screen warning directs students to download. The browser does not send submissions.

Students select a named checkpoint when capturing. `support.js` owns the checkpoint expectations used by the checklist, JSON and HTML report. Older unlabeled captures remain available but cannot satisfy specific checkpoint requirements. Reports flag missing labels and writing, not correctness: an instructor must check whether the captured conditions support the claim. Students download JSON plus HTML; the report can be printed to PDF using browser Print when Moodle requires it. No answer key is published.

Version 1.1 clears FillDemand on invalid measurement, matching L5. P2 includes a separate, manual-step measurement-noise demonstration, with initial-state and transition-count assumptions stated. It never changes the experiment or its evidence. X1 displays SP/PV and applied-command trends, raw command and integral values, and captured-run summaries. Compare the same initial conditions and elapsed time; no automatic settling-time or performance grade is claimed. No manual-mode or drive-feedback timeout simulation is provided.

## Maintenance and tests

`model.js` owns dynamics and controller rules; `app.js` owns task metadata, UI and exports. `support.js` supplies checklists and observation aids; `evidence.js` supplies run summaries and condition reminders. These are editable sources, not generated bundles. From the website folder run `node scripts/test-lab2.cjs` and `node scripts/test-lab2-workflow.cjs`. The second is a lightweight DOM-contract unit test of application handlers and export generation, not a real browser, layout or download integration test. Use the bundled Node path documented in `../DEVELOPMENT.md` if Node is not on PATH. Preserve the existing Lab 1 sources and shared course demo.

Version 1.2 adds I3 as optional in both exports and the interface, corrects task sequencing, provides a guarded 120 s comparison run, and records named condition reminders with each new capture. These reminders do not grade results or verify every historical action. Old captures are preserved; missing review metadata does not imply a passed check. The host demo labels browser-only Lab 2 separately from Lab 3 PLC tooling.
