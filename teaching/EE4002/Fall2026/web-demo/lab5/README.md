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

## Boundaries

One ideal non-preemptive bus/output queue. CAN uses an assumed 130-bit on-wire frame; Ethernet background/sensor lengths are 12,000/1,200 bits. This is not a CAN bit-stuffing simulator or an Ethernet protocol implementation. All traffic at each acquisition time is ready before arbitration. Priority does not interrupt a frame already transmitting.

Sources acquire only during [0,100) ms. Plots include a final held-value interval, so maximum observed age is not a steady-state bound. Outage drops arrivals during [40,40+duration) ms; it does not implement MRP or buffer a disconnected network. Fresh recovery accepts acquisition timestamps at or after restoration. No topology, VLAN or cybersecurity implementation is claimed.

## Maintenance

Shared source: `../shared/timing-model.js`, `timing-tasks.js`, `timing-workbench.js`, `timing-workbench.css`. Run `node scripts/test-all.cjs` from `web-demo` after edits. No build step.

At most four captures per task, each at most 241 plotted samples; metrics use the full run. Final exports: JSON evidence and colored HTML report (printable to PDF). Students upload to Moodle themselves. Browser drafts are not backups.
