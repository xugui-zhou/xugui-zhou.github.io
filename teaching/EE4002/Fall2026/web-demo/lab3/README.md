# Lab 3 — Virtual PLC Studio

Open `index.html` offline, or the parent demo route `#l3`. Canonical sources live here. No network, build, hardware or vendor installation is needed. The appearance follows common industrial engineering-tool conventions; this is not Siemens software and cannot load TIA projects.

## Lecture 7 alignment

L7 connects P/PI/PID and manual parameter comparison to sampled implementation, Boolean permission, state recovery and program lifecycle. The lab has a project tree, editable text program, compile/check diagnostics, STOP-only download, CPU RUN/STOP, single scan, online watch/network monitor, live process/trends, project JSON import/export, and final report/evidence downloads.

The default editor is now a click-to-insert LAD editor. Students add/delete NO and NC contacts, series components, parallel branches, normal coils, SET/RESET memory coils and TON timers. They can add/delete/reorder networks and Undo/Redo. The properties panel configures tags, coil types, phase and timer preset. A separate parameter panel configures the supplied PID block. The generated project JSON is read-only and is the same program downloaded into the CPU; there is no second, disconnected visual program.

This is a bounded teaching LAD dialect, not a complete IEC compiler or Siemens-compatible editor. It supports 12 networks, four branches per network, eight components per branch, four memory bits and four unique TON instances. Fixed supervisor and PID routines remain in `engine.js`. Before-state networks execute first, the supervisor updates Auto/Trip, and after-state networks execute next. Within each phase the visible network order applies. A normal TripCause coil must execute before the state update and a normal PumpEnable coil afterward. Other outputs are M1–M4. SET/RESET preserve memory when their rung is false; last active writer wins. STOP/download clear memory and timers. Empty branches fail Check. Online colors show the last executed scan, and are suppressed against a changed draft.

The former eight-assignment ST files still import, converting their Boolean expressions into series/parallel contacts when within the teaching limits. No eval or Function is used. Captures retain the actual running source, CPU revision, component power flow, memory/timer states and draft mismatch.

## Student workflow refinements

Each task now identifies the action location, observations and expected checkpoints. `task-guide.js` supplies these same evidence expectations to the final review and exported report. Capture counts are reminders, not correctness checks. The optional two-minute Boolean warm-up compares `(A AND B) OR C` with `A AND (B OR C)` in an isolated diagram; it does not alter the plant or the downloaded program.

Studio uses fixed 50% Bias. The entry page and parameter panel distinguish this from the live demo's zero-Bias starting preset. P2 explicitly treats the 120-second error as a transient observation, not a guaranteed steady-state result or a guarantee that PI wins. I1 asks students to choose a success criterion before comparing two matched disturbance trials.

Capture comparison tables appear within each task, at final review and in the HTML report. New records retain the running mode, gains, Bias, Tf and Ts. Legacy records remain readable; missing Bias is shown as unknown rather than guessed. Peak and upper-saturation duration refer to retained trace samples. Downloads remain centralized in Review & Download.

## Timing and tasks

P1 building a rung/commissioning (12 min), P2 P versus PI (12), I1 disturbance tuning (12), I2 graphical permission repair/restart regression (12). Allow about 58 minutes including introduction and final evidence review. X1 cascade and the I2 TON challenge are optional. This fits the revised standalone Lab3 session with discussion/help buffer. If a paper presentation is added, assign preparation ahead of class.

Discussion prompts: why can a syntactically correct program block the pump? Which evidence distinguishes a poor gain from a permission fault? Instructors should review program and trace, not capture counts alone. No grading answer key is embedded.

## Model and limitations

Single integrating tank, A=.5 m², inlet actuator lag 2 s, maximum nominal inlet .020 m³/s. Initial h=.8 m and q=0. Inlet flow target scales with supply effectiveness. Ts allowed values .02/.05/.1/.2/.5 s; discrete PI/PID includes Ts and conditional anti-windup. PID derivative uses filtered negative PV rate. Cascade inner PI has fixed Kp=1, Ki=.8 with nominal target feedforward; both loops execute at Ts. No claim of universal tuning superiority or certified safety. CPU STOP forces zero command, but residual flow decays and tank physics can still advance.

Program files save the validated offline draft. Work drafts save captured records and written answers, not a running process. Evidence is student-editable, not a secure assessment record. The engine retains at most 6,000 samples and each task accepts at most 12 captures, but exported JSON is **not a raw sample archive**: captured display traces are reduced to at most 400 points and include `traceInfo`. Local draft persistence also enforces a 750,000-character budget and may reduce traces further. See “Evidence storage and task isolation” below for details; download before clearing browser data.

## Verification

From `web-demo`, run `node scripts/test-all.cjs` for the complete regression suite. Lab 3 checks cover the model/compiler, ladder semantics, task workflow, reduced-trace metadata, storage-budget handling and live PID demo. See “Studio verification” and “PID live practice” below for individual commands and scope. These automated tests do not replace browser checks of layout, file selection and downloads.

## PID live practice

The live demo starts with Kp=100, Ki=Kd=0 and Bias=0. Compare the no-bias P, no-bias PI (Ki=2), and 50% bias P presets using Restart for each trial. Under nominal supply their steady levels are approximately 0.50, 1.00 and 1.00 m respectively. Bias is optional known operating output, not an integral replacement; reduced supply breaks the nominal balance. Apply preserves integral memory even when bias changes, so it may produce an output jump. The model-based preset explicitly uses 50% bias. Formal Studio tasks keep their original fixed 50% bias and existing assessment settings.

Open `pid-demo.html` using the Quick PID practice link in Studio. This page uses a separate PLC instance and the same engine, with fixed Ts=0.1 s and Tf=0.2 s. Apply updates the next control scan without clearing integral memory or changing physical state. Restart repeats initial conditions with applied gains and the selected supply. The simulation runs continuously. Both charts use a 30/60/120/300 s sliding window, with time zoom buttons, an optional auto-fit level axis, and compact/large plot sizes. History stays bounded at 3,001 samples (300 s). Reset all restores defaults and pauses; Restart preserves applied gains and selected supply. Hidden pages and high-high trips pause playback. The view includes an animated tank, level/setpoint and pump-command traces, error, peak above setpoint and IAE. It does not modify assessment work or save captures. The model-based preset (180, 3.44, 50) is a pole-placement candidate, not a universal optimum.

Run `node scripts/test-lab3-pid-demo.cjs` from web-demo for live-apply isolation, restart, numerical references, disturbance, continuous playback, zoom, bounded history, visibility pause, trip behavior and UI-event checks.

## Studio verification

From web-demo: `node scripts/test-lab3.cjs`, `node scripts/test-lab3-ladder.cjs` and `node scripts/test-lab3-workflow.cjs`. Tests cover compiler/model checks, LAD truth tables and legacy equivalence, TON and memory behavior, DOM contracts, graphical task sequences, report generation and host syntax. Browser layout, native file chooser and downloads require a separate browser rehearsal. Main sources need no build. The L7 response chart still uses the same plant and control engine; the deck's earlier editor-scope description predates this LAD upgrade.

Single scan requires CPU RUN and pauses automatic playback. CPU STOP never executes a control scan. The process can still drain in STOP when time is advanced.


### Evidence storage and task isolation

Each task must be initialized with Load workspace before Download. Changing task invalidates
that initialization; downloading within one initialized task preserves the plant for maintenance.
Capture metrics use the retained engine samples before reduction. Curves retain at most 400
samples using extrema buckets and store only plotting fields; event records stay separate.
JSON includes traceInfo so reduced traces cannot be mistaken for raw acquisition data.
Its originalCount and retainedCount identify the source and retained sample counts;
method describes the projection. Metrics are not recomputed from the reduced curve.
Local drafts have a 750,000-character budget and may reduce curves further to 160/80 points.
This is a character budget, not a guaranteed browser quota. Exports made after restoring a
reduced draft retain that reduced resolution; omitted samples cannot be reconstructed.
Existing schema-1 drafts remain readable. A storage failure leaves evidence in memory and
displays an alert to download immediately. Do not close the page until downloaded.
