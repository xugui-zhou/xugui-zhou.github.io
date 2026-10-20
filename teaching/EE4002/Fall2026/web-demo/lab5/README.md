# Lab 5 — Network delivery and recovery

Open `index.html` directly, or use the Lab 5 entry in `../demo.html`.
No installation, hardware or network connection is required.

## Teaching sequence (60 minutes, including buffer)

- 5 min introduction: distinguish delivery delay, data age and deadline.
- P1 (10 min): predict CAN serialization time; compare arbitration IDs.
- P2 (12 min): calculate FIFO waiting; compare Ethernet priority queueing.
- I1 (13 min): independently change bitrate/queue policy to meet a deadline.
- I2 (15 min): compare physical link restoration with fresh-source arrival.
- 5 min review/export. Additional class time remains for questions.

Students predict → run the supplied baseline → capture → change only the specified inputs → compare → explain. Task changes reset the experiment, not saved evidence. Independent tasks check presence of a controlled comparison, not correctness of the reasoning.

Comparison controls are highlighted in green; other settings remain visible but locked for the task. CAN-only and Ethernet-only controls are explicitly identified when unused. Integer fields reject fractional values, and blank numeric inputs are not silently treated as zero. Review shows the same itemized completeness checklist as the exported report, with return buttons for each task. Existing saved evidence is preserved.

## Lecture 9 alignment (revision 1.1.0)

P1 includes an 11-bit sensor-versus-0x200 arbitration table after each CAN run. It highlights the first differing bit and shows the loser releasing the bus thereafter. The timeline still models every background frame. Equal IDs are explicitly identified as an unsupported arbitration tie, not a CAN winner.

Each task has an always-visible Before you run reference. P2 explicitly changes the lecture example to eight 12,000-bit background frames, one 1,200-bit sensor frame and 2 ms downstream delay. Results separate first-frame queue waiting, serialization and downstream delay; this first-frame result is not claimed as the worst case.

I2 uses an imposed 40 ms outage, not the lecture's Siemens 200 ms MRP specification. It does not implement ring reconfiguration. The age-window warning appears beside the metrics and in exported reports. All prior task settings and saved evidence remain compatible. Independent tasks still check evidence presence and controlled comparisons, not correctness.

## Model boundaries

One ideal non-preemptive bus/output queue. CAN uses an assumed 130-bit on-wire frame; Ethernet background/sensor lengths are 12,000/1,200 bits. This is not a CAN bit-stuffing simulator or an Ethernet protocol implementation. All traffic at each acquisition time is ready before arbitration. Priority does not interrupt a frame already transmitting.

Sources acquire only during [0,100) ms. Plots include a final held-value interval, so maximum observed age is not a steady-state bound. Outage drops arrivals during [40,40+duration) ms; it does not implement MRP or buffer a disconnected network. Fresh recovery accepts acquisition timestamps at or after restoration. No topology, VLAN or cybersecurity implementation is claimed.

## Maintenance

Shared source: `../shared/timing-model.js`, `timing-tasks.js`, `timing-workbench.js`, `timing-workbench.css`. Run `node scripts/test-all.cjs` from `web-demo` after edits. No build step.

At most four captures per task, each at most 241 plotted samples; metrics use the full run. Final exports: JSON evidence and colored HTML report (printable to PDF). Students upload to Moodle themselves. Browser drafts are not backups.
