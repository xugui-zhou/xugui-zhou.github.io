# Lab 7 · Integrated SCADA Studio

Open index.html (redirects to studio.html), or ../demo.html#l7. The canonical page has two views of one project: Edit and Run. P1/P2/I1/I2 appear below the Studio and use its deployed components, tag values, alarm engine and evidence capture. No hardware or external connection.

## Student route and timing

- Concepts and screen practice: 10–15 minutes. Add/bind a lamp to P101; arrange LT101 components. Deploy and operate the manual tank.
- P1/P2/I1: 30–35 minutes. Select a task, load baseline settings, write a prediction, deploy, observe, capture. Edit only the requested setting, Apply and redeploy; compare and explain.
- Review/download: 5 minutes. Leave remaining class time for questions. Complete I2 after class if needed.

Switching tasks resets uncaptured runtime, but retains the layout, answers and captures. Baseline loading changes signal/alarm configuration only. Once loaded, its button becomes Reset to baseline settings; resetting requires confirmation even before a run has started. The ready-to-deploy flag is saved together with the baseline. Deploy resets time and creates an isolated runtime snapshot. Run tab shows that snapshot without redeploying; Edit pauses it. If there are applied but undeployed edits, Run is disabled and the page directs the student to Deploy & Run new test. Re-clicking Edit does not discard pending form inputs. Apply changes in the toolbar (or any Apply all changes button) saves all current form edits together. Editing does not retroactively change captures.

## Tasks on the same screen

- P1: normal ramp versus frozen source (20–35 s). Display, trend, raw count, timestamp, age and STALE all share LT101.
- P2: sustained HIGH; compare zero delay and 3 s delay. The student acknowledges the active alarm manually. ACK is not a repair.
- I1: incorrect conversion scale. Repair scale and show conversions at two timestamps; do not hide the error by changing the alarm threshold.
- I2: compare threshold chatter with a candidate deadband/delay, then verify sustained HIGH with the same candidate.

Task runs stop at 60 simulated seconds; formal task capture is disabled until then. Reset & pause always returns the deployed run to zero and pauses. Resume continues it. Manual screen practice continues with a rolling 120 s trace. Fixed test profiles drive the reference level independently of the pump; the pump button and manual freeze are disabled during task tests. Profile/scaling changes require Apply and Deploy.

## Model boundaries

The manual plant uses A=1 m², inflow=0.06 m³/s when ON and outflow=0.025h m³/s, forward Euler at 0.1 s, clamped to 0–2 m. Fixed profiles are repeatable test inputs, not additional physical plants. Raw tag encoding is 1 mm/count; displayed metres = raw × configurable scale. GOOD means source age ≤2 s, not measurement accuracy. There is no automatic PID, safety interlock, authentication or real device connection.

Alarm activation requires fresh data above HIGH continuously for the delay. Stale data resets pending activation but retains an active alarm. Fresh level ≤HIGH−deadband returns it to normal. ACK marks awareness without changing the pump or clearing the physical condition. Retention of unacknowledged returned-to-normal alarms is not modeled.

The editor is inspired by commercial SCADA concepts, not a vendor-compatible product. Component scripts cannot access equipment.

## Evidence and storage

Final downloads are one HTML report and one JSON evidence file, uploaded to Moodle manually. HTML includes a presence/comparison self-check, task answers, per-capture deployed-screen reconstructions, trends, selected timestamp samples and event logs. It does not grade explanation correctness. Print the HTML to PDF only if requested.

At most 24 captures are retained; reaching the limit blocks new captures rather than deleting earlier work. Each saves at most 301 reduced trace points, not raw full-resolution history. Live history is bounded to 1,201 samples, event logs to 80, undo to 30 designs. Drafts share browser storage with other labs. A save failure leaves the live work available and displays a persistent backup warning.

Save portable backup exports the entire project, captures and answers. Importing a Studio backup replaces these only after confirmation. Importing a plain project replaces design only. Draft key is ee4002-lab7-studio-v2. Previous v1/fixture drafts are not erased or silently counted as integrated evidence: legacy-experiments.html remains available for recovering older submissions. Stored evidence is student-editable and is not proof of a real system test.

## Maintenance and verification

Editable files: studio.html, studio.css, studio.js, studio-model.js, tasks.js and evidence.js. No build step. tasks.js owns task metadata and evidence comparison requirements. The legacy workbench retains shared/operations-* for old drafts only.

From web-demo run:
- node scripts/test-lab7-studio.cjs
- node scripts/test-all.cjs

Tests cover project validation, model states, all integrated task sequences, manual ACK, same-screen scaling/freshness, stop at 60 s, comparison requirements, report escaping, snapshot isolation and storage errors. test-lab7-9.cjs separately retains legacy fixture coverage. Additional regressions cover pending edits, deployment mismatch, early capture, reset cancellation, reset-and-pause and reload after baseline loading. These are model/DOM-contract tests, not real-browser layout, drag/drop or download acceptance.

## Canvas and component editing

Edit → Canvas supports 600–2400 px width and 400–1600 px height. Apply saves the layout; Deploy makes it the active runtime screen. Existing projects without canvas metadata retain 1000 × 600 dimensions. Captures and report SVGs use their own deployed canvas dimensions.

Fit scales the entire screen to available width and a 660 px drawing height; use 100% for readable detail and scrolling. The selected component has a lower-right resize handle. Drag/resize respects zoom, snaps to a 10 px grid and remains inside the canvas. Width/Height fields remain an alternative. Cancelling a pointer gesture restores its initial geometry.

Add and Duplicate search for a free space; if none exists they leave the project unchanged and ask for more room. Manual placement may overlap. Shrinking the canvas cannot crop components: move/resize them first. Undo/redo preserves a valid selection. Very small components may scroll their content rather than silently hide it.

Automated coverage includes canvas limits, old project compatibility, true Fit, duplication placement, selection after undo, gesture resize/cancel, shrink rejection and report dimensions. Physical pointer gestures and browser layout still need browser acceptance.

## Dual-tank extension

Screen practice → Add TK102 station appends a second set of graphics and creates independent state. The supported configurations are one tank or two independent tanks; there is no hydraulic coupling or arbitrary-N editor yet. The nested second station uses the same single-station simulation function and independent signal/alarm configuration. Tags are LT101/P101/FLOW101 and LT102/P102/FLOW102.

The station selector targets signal settings, alarm settings, event log, manual freeze and ACK. A graphic follows its tag binding, not the selector or label. Both pump buttons operate independently in Manual moving tank input mode. Fixed profiles disable their respective pump controls. Editing needs Apply and Deploy. Capture/report includes separate state, reduced trace and events for each station.

P3 is guided dual-station practice: run P101 only, then P102 only, capture both 60 s trials and explain independent states. I3 is an independent binding diagnosis: TK102 tank/numeric graphics initially point to LT101, while its trend/alarm use LT102. Students must compare evidence, repair bindings, rerun and explain why GOOD quality is not a binding check. These are optional extensions/homework unless assigned; they do not add mandatory work to the existing class core. Presence checks appear when answers or captures exist, not as correctness grading.

Loading a dual-task baseline replaces the editable layout after confirmation; saved captures remain. Returning to a core baseline removes second-station components/state. Old single-tank projects remain valid. Reports explicitly identify extension tasks and retain both stations' evidence. The separate state/configuration/binding pattern is the generalization exercise for larger installations, not a claim that this editor supports unlimited stations.
