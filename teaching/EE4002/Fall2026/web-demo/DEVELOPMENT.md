# EE4002 offline website

## Lab 2

Open `demo.html#l2` or `lab2/index.html`. The standalone Lab 2 sources need no build. Run `node scripts/test-lab2.cjs` after editing. See `lab2/README.md` for the L5-aligned sequence, model assumptions and evidence format. Lab 2 is a single-tank control exercise. `#m3` now redirects to current Lab 3; `#archive-plc` is historical background. Do not connect the host rig controls to Lab 2 student evidence.

Open `demo.html#l1` in a browser. No server, network service or build is needed to use the checked-in website.

## Editable source and build

The canonical Lab 1 runtime sources are **lab1/src/**, included in this website folder. Do not edit generated **lab1/runtime.js** directly. Earlier sources under the course's Lab1_IC_Workbench_v9 folder are historical snapshots, not the active source.

With Node.js installed, run from this directory:

```
node scripts/build-lab1.cjs
node scripts/build-lab1.cjs --check
node scripts/test-lab1.cjs
```

There are no build dependencies. The build script resolves paths relative to itself and works after copying this folder to another computer. Its explicit order joins core, guide, visual, lesson, steps, host and report_ui in a single private scope. Render/task/action/update hooks register before the final initialization. Only the outer bundle needs a strict-mode directive.

### Node on the current workstation

On the workstation checked on 2026-09-09, `node` is not on the shell PATH. The existing bundled Node executable is available at the following path; no system-wide installation is required for this workstation:

```
/Users/xugui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/build-lab1.cjs
/Users/xugui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/test-lab1.cjs
```

This machine-specific path is not portable or guaranteed after runtime updates. On another computer, install/provide Node.js and use the standard commands above. npm, bun and deno are not required. Students need only a browser.

The local-file audit is limited to `demo.html` and `lab1/`, even if this folder is merged into a larger course website. It strips HTML comments before checking references or inline scripts. The test includes regressions proving commented missing links are ignored while active missing links still fail. This repository provides a manually run test, not an automatic CI check.

`lab1/step-plan.js` is the task-definition source: each task explicitly declares its phase; prediction, explanation and checkpoint requirements derive from its steps. `collectLabEvidence()` exports these expectations with student evidence. `lab1/report.js` uses the same expectations for sections and missing-item checks, including future tasks/response steps. Older exports without this metadata cannot receive a completeness verdict.

`lab1/config.js` owns the app version. Storage and workflow schema versions describe compatibility and deliberately need not match the release number. Keep the storage key when upgrading compatible drafts. Invalid restored fault/interface settings revert to defaults with a visible notice; saved evidence is not rewritten.

`#m2` is a legacy route alias only, normalized to `#l1` before module lookup. It has no module entry, task content or remote command channel.

This is student-visible teaching software, not an exam-security boundary. Keep instructor solutions outside the published folder. Reports and JSON download locally; students upload them to Moodle themselves.


## Labs 3–4 and release checks

Lab 3: edit lab3/ sources directly. engine.js and ladder.js implement the model;
studio.js owns UI workflow, task-guide.js supplies guidance (lengths validated at initialization).
evidence-storage.js projects display traces to at most 400 points using bucket extrema.
Metrics are computed first on the engine's retained history. Events remain separate and unchanged.
Exports include traceInfo: reduced curves are not raw sample archives.
Drafts use the existing schema/key, including older captures, and have a 750,000-character budget
(about 1.5 MB of UTF-16 data, not a browser quota guarantee). Persistence may use 160 or 80
points per capture to meet that budget, never silently deletes captures, and reports failure.
Switching tasks requires Load workspace before Download. Download within an initialized task
preserves the plant for maintenance tests. Stored student evidence remains intact.

Lab 4: integrity.js declares an explicit initializer; app.js passes its model, DOM access,
capture setter and notice function. Keep that script order. Draft schema 1 accepts legacy
unversioned drafts. Restoring retains the newest 12 captures. Serial wire faults also affect RTU
and are displayed in the Modbus link summary.

Labs 2–6 share shared/embedded-height.js. The parent checks the sending frame, origin and
height range. Lab 1 retains its existing tour/height channel.

Run from web-demo before delivery:

```
node scripts/test-all.cjs
```

The runner executes all test-*.cjs files (excluding itself), continues after failures and exits
nonzero if any fail. This includes the original eight suites plus shared regressions.
All four lab suites use scripts/lib/check-refs.cjs. Lab 4 DOM IDs are checked against HTML
plus its explicitly generated UART configuration controls.

Browser acceptance still required: task switch without Load, initialized Download/RUN,
supply-label refresh, capture/export/reload, quota-failure warning, RTU hidden wire-fault
visibility, and embedded height growth/shrink at desktop and narrow widths.
Tests are not a substitute for browser layout or download checks.

Labs 5–6: shared/timing-model.js is the deterministic simulation, timing-tasks.js defines
the task sequence, timing-workbench.js implements evidence/report/UI, and timing-workbench.css
owns layout. No bundle/build step. Canonical host routes #l5 and #l6 open the standalone
workbenches; legacy #m5/#m6 links normalize to them. Earlier shared-plant demos remain
accessible under #archive-network and #archive-control, alongside #archive-plc and
#archive-protocol. They are background demonstrations, not submission tasks.
Local drafts have a 400,000-character budget per lab;
up to four captures per task retain at most 241 display points, with full-run metrics.
test-lab5-6.cjs covers numeric timing, constrained gain-search feasibility, fault policies,
HTML references, real-script initialization and capture/review/export workflow.
Browser layout, actual download behavior and embedded resize remain manual acceptance items.

Cache policy: local asset and iframe URLs are unversioned, including Lab 4. Do not add an
isolated `?v=` to an iframe: it does not invalidate the page's JS/CSS dependencies. After
deployment, verify the host's cache revalidation behavior; use a hard refresh when checking
an update. This source change does not configure hosting headers or guarantee cache eviction.
Application/evidence schema versions remain separate from cache policy.
