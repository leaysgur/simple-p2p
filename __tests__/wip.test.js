import { createTransport } from "../lib";

// jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60;

describe("simple-p2p", () => {
  it("should work", async () => {
    const t1 = createTransport();
    const t2 = createTransport({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    t1.on("negotiation", p => t2.handleNegotiation(p).catch(console.error));
    t2.on("negotiation", p => t1.handleNegotiation(p).catch(console.error));

    await t1.startNegotiation().catch(console.error);

    // await new Promise(r => setTimeout(r, 2000));
    // await t2.restartIce().catch(console.error);

    // await new Promise(r => setTimeout(r, 2000));
    // t2.close();
    // await new Promise(r => setTimeout(r, 1000 * 30));

    await Promise.all([
      new Promise(r =>
        t1.on("connectionStateChange", s => s === "connected" && r())
      ),
      new Promise(r =>
        t2.on("connectionStateChange", s => s === "connected" && r())
      )
    ]);

    const p1 = t1.peer;
    const p2 = t2.peer;

    console.warn(p1, p2);
  });
});
