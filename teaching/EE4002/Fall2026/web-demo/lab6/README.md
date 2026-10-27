# Lab 6 — Networked control and timing

Open `index.html` directly, or use the Lab 6 entry in `../demo.html`.

## Teaching sequence (60 minutes, including buffer)

- 5 min: distinguish true level, received PV and source age.
- P1 (12 min): zero-delay versus delayed feedback, with identical gains.
- P2 (12 min): acquisition-loss burst, age threshold and held output.
- I1 (14 min): independent gain search under unchanged network conditions; reduce peak without increasing IAE more than 10%.
- I2 (12 min): defend hold/stop/local fallback for the inlet-pump tank.
- 5 min: review and export. Optional Lecture 10 recurrence demo: 3–5 minutes, no submission. Task settings are locked except the comparison variables to avoid confounded experiments.

## Model and lecture connection

The Lecture 10 ideal integrator illustrates delay stability. This lab uses a leaky tank with physical units, not a numerical reproduction of that simplified example:

`dh/dt = 0.04u - 0.02h - load`, with area 1 m², load 0 until 60 s then 0.008 m³/s. SP=1 m, initial h=0.6 m, bias=0.5, output limited to [0,1]. PI uses the configured sample period and conditional anti-windup. The integrator freezes under stale hold/stop; local fallback needs an additional working local sensor path.

Every run resets state and lasts 120 s. Euler integration step is 0.02 s. Seeded measurement delay/jitter/loss is simulated; actuator communication is ideal. Older source timestamps are rejected. Recovery measures sustained ±0.02 m tracking AFTER the common 60 s load step, only through the finite observation end. It is not proof of asymptotic stability or a universally safe fallback.

Main plot: true level, received PV, SP and saved true-level comparison. Separate synchronized plots show pump percent and source age in seconds with the configured limit. The shaded 40–48 s interval marks dropped acquisitions. The replay readout includes source time and integral contribution. Replay illustrates a precomputed run, not wall-clock industrial communication.

Students save baseline and controlled comparison, then explain tradeoffs. Completion checks are not automatic grades. Final JSON and colored HTML report are downloaded once and uploaded to Moodle manually. Storage/export uses reduced traces (≤241 points per capture); metrics retain full simulation resolution. See Lab 5 README for shared source and testing instructions.

## Lecture 10 alignment update

The collapsible optional demo has its own ideal-model.js and ideal-demo.js. It computes x[k+1] = x[k] − g x[k−d], constant history x=1 m, and shows poles and a near-zero zoom. It does not change task settings, save captures or count toward submission. The strict bounds 0<g<2 (d=0) and 0<g<1 (d=1) apply only to this ideal P-controlled integrator.

Each burst capture now saves a recovery object: burst end at 48 s, first accepted post-burst source arrival, first usable post-burst sample, and a separate process-in-band timestamp. Process recovery means entering ±0.02 m at or after 48 s and remaining there through the observation window just before the 60 s load step (0.02 s resolution). A timestamp of 48 s can mean the process was already in band and remained there; it does not imply communication recovered first. Not observed remains null. The existing recoveryAfterLoadS metric is a duration measured from the 60 s load change through 120 s; it must not be presented as network-outage recovery.

Reports include the same three plots and recovery evidence. Older captures remain readable but do not gain newly calculated timestamps. Source and integral values are retained in reduced traces. Up to four captures per task; the Lab 6 draft budget is 750,000 characters. This budget is shared-origin browser storage, not a guaranteed quota allocation.

Verification: run node scripts/test-lab5-6.cjs, node scripts/test-lab6-alignment.cjs and node scripts/test-all.cjs from web-demo. These cover calculations and real-script DOM contracts; they do not certify browser layout.
