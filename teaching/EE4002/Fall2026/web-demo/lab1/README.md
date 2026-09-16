# Lab 1 maintenance

Students open `../demo.html#l1`; no Node.js is required to use the lab.

Do not edit generated `runtime.js`. Edit `src/`, then run from the website root (the folder containing `demo.html`):

```
node scripts/build-lab1.cjs
node scripts/test-lab1.cjs
```

The test checks source/build parity without rebuilding, and audits only `demo.html` plus Lab 1 files. Commented-out HTML references are ignored; missing active local references still fail. A stale-runtime error means you must rebuild from the current sources before testing.

These maintenance commands require Node.js, not npm packages. If `node` is not on PATH, use an available Node executable's full path. See `../DEVELOPMENT.md` for this workstation's verified path and further details. Commit/copy `src/`, `scripts/`, and the rebuilt `runtime.js` together.
