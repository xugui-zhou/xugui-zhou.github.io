# Lab 8

Open index.html directly or use the canonical #l8 route in ../demo.html. English UI, local simulation, no hardware or installation. The revised course ends with Lab 9; legacy shared-plant demonstrations remain under explicit archive routes.

## Class use

After Lecture 12: 5-minute introduction, 45-minute P1/P2/I1/I2 sequence, 10-minute review. Compare access rules, maintenance authorization, monitoring continuity and missing logs. If paper presentations occupy the whole lecture, assign the L12 core as pre-reading. Source names simulate already-known identities; no authentication, firewall or real traffic is implemented.

## Student sequence

Read the task, write a prediction/hypotheses, run and label the supplied baseline, capture, change only the specified input, rerun and capture, explain. Lab 7 I2 additionally requires a third sustained-profile capture with the candidate alarm settings. Maximum four captures per task. Switching tasks resets inputs but retains evidence.

Review & Download provides a presence/settings checklist at the beginning of the HTML report. It is not a grade. Download HTML and JSON, print HTML to PDF if requested, then upload to Moodle manually. No server receives student work. Drafts have a 400,000-character budget. A storage failure leaves work in the current tab and prompts export.

## Maintenance and limits

Shared editable sources: ../shared/operations-model.js, operations-tasks.js, operations-workbench.js. CSS reuses timing-workbench.css. No build step. Run node scripts/test-all.cjs from web-demo. test-lab7-9.cjs covers model reference results, all task comparisons, report escaping, draft budget and quota errors. Browser layout/download behavior still needs browser acceptance.

The scripted profiles and fixtures are finite teaching examples. They do not implement a physical plant, SCADA vendor product, authentication, real firewall or security scanner. Stored evidence is student-editable and cannot certify a real system.
