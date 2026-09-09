# EE4002 offline website

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

`lab1/step-plan.js` is the task-definition source: each task explicitly declares its phase; prediction, explanation and checkpoint requirements derive from its steps. `collectLabEvidence()` exports these expectations with student evidence. `lab1/report.js` uses the same expectations for sections and missing-item checks, including future tasks/response steps. Older exports without this metadata cannot receive a completeness verdict.

`lab1/config.js` owns the app version. Storage and workflow schema versions describe compatibility and deliberately need not match the release number. Keep the storage key when upgrading compatible drafts. Invalid restored fault/interface settings revert to defaults with a visible notice; saved evidence is not rewritten.

`#m2` is a legacy route alias only, normalized to `#l1` before module lookup. It has no module entry, task content or remote command channel.

This is student-visible teaching software, not an exam-security boundary. Keep instructor solutions outside the published folder. Reports and JSON download locally; students upload them to Moodle themselves.
