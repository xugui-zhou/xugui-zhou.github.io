# EE4002 offline website

## Lab 2

Open `demo.html#l2` or `lab2/index.html`. The standalone Lab 2 sources need no build. Run `node scripts/test-lab2.cjs` after editing. See `lab2/README.md` for the L5-aligned sequence, model assumptions and evidence format. Lab 2 is a single-tank control exercise; the older `m3` PLC demonstration remains separate for Lab 3 background. Do not connect the host rig controls to Lab 2 student evidence.

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
