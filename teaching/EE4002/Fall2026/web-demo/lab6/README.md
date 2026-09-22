# Lab 6 — Networked control and timing

Open `index.html` directly, or use the Lab 6 entry in `../demo.html`.

## Teaching sequence (60 minutes, including buffer)

- 5 min: distinguish true level, received PV and source age.
- P1 (12 min): zero-delay versus delayed feedback, with identical gains.
- P2 (12 min): acquisition-loss burst, age threshold and held output.
- I1 (14 min): independent gain search under unchanged network conditions; reduce peak without increasing IAE more than 10%.
- I2 (12 min): defend hold/stop/local fallback for the inlet-pump tank.
- 5 min: review and export. Optional exploration: jitter, random loss or sampling period, changing one variable at a time.

## Model and lecture connection

The Lecture 10 ideal integrator illustrates delay stability. This lab uses a leaky tank with physical units, not a numerical reproduction of that simplified example:

`dh/dt = 0.04u - 0.02h - load`, with area 1 m², load 0 until 60 s then 0.008 m³/s. SP=1 m, initial h=0.6 m, bias=0.5, output limited to [0,1]. PI uses the configured sample period and conditional anti-windup. The integrator freezes under stale hold/stop; local fallback needs an additional working local sensor path.

Every run resets state and lasts 120 s. Euler integration step is 0.02 s. Seeded measurement delay/jitter/loss is simulated; actuator communication is ideal. Older source timestamps are rejected. Recovery measures sustained ±0.02 m tracking AFTER the common 60 s load step, only through the finite observation end. It is not proof of asymptotic stability or a universally safe fallback.

Main plot: true level, SP and saved comparison. Auxiliary plot: pump percent and age as percent of the configured age threshold; exact age/PV are in the replay readout. Replay illustrates a precomputed run, not wall-clock industrial communication.

Students save baseline and controlled comparison, then explain tradeoffs. Completion checks are not automatic grades. Final JSON and colored HTML report are downloaded once and uploaded to Moodle manually. Storage/export uses reduced traces (≤241 points per capture); metrics retain full simulation resolution. See Lab 5 README for shared source and testing instructions.
