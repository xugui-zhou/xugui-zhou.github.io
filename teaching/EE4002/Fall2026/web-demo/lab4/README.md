# Lab 4 · Serial & Modbus

Open `index.html` directly in a browser. No installation, device or server is required.

Edit `model.js` for UART/protocol behavior, `tasks.js` for task wording, and `app.js` / `style.css` for interaction and presentation. Run `node scripts/test-lab4.cjs` from `web-demo` after changes. No build step is needed.

Two guided tasks lead into two independent diagnoses (55 minutes of tasks, with introduction/review and buffer kept separate). Students capture checkpoints during tasks and download a consolidated JSON and HTML report at the end. Browser storage is convenience only, not submission or a backup.

This is a digital UART and Modbus message simulator, not a hardware driver, RS-485 electrical model or packet capture tool. The device map follows Lecture 8; the optional older polling sandbox uses a different map. The waveform uses ideal edge detection and bit-centre sampling. RTU transactions assume valid frame spacing. TCP mode compares message formats without opening a network connection. A separate fixed trace illustrates three-way handshake and partial reads; it does not implement a TCP stack.

The required P2 integrity comparison compares per-byte even parity, an 8-bit additive checksum, and CRC-16/MODBUS. Edit payload bytes or select single-bit, double-bit and balanced-sum errors. Original check fields are unchanged to isolate payload corruption. Captures are included in JSON and HTML reports. `integrity.js` controls this panel; numerical calculations live in `model.js`. The simple sum is not Modbus ASCII LRC.

Version 1.2 adds a per-byte RTU waveform inspector (request and response), a capturable TCP walkthrough, and evidence-category checks in Review. Existing v1 drafts remain readable. P2 takes 19 minutes; I2 asks for four captures including the intermediate wrong-scale reply. learning.js owns the new demonstrations and receives explicit dependencies from app.js. Model tests cover buffering and evidence rules. No electrical simulation or PCAP capture is provided.
