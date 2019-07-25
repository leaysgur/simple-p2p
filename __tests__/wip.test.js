import { createTransport } from "../lib";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60;

describe("simple-p2p", () => {
  it("should open peer", async done => {
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
      new Promise(r => t1.once("open", r)),
      new Promise(r => t2.once("open", r))
    ]);
    done();
  });

  it("should send media", async done => {
    const t1 = createTransport();
    const t2 = createTransport({});
    t1.on("negotiation", p => t2.handleNegotiation(p).catch(console.error));
    t2.on("negotiation", p => t1.handleNegotiation(p).catch(console.error));
    await t1.startNegotiation().catch(console.error);
    const m1 = t1.mediaHandler;
    const m2 = t2.mediaHandler;

    await Promise.all([
      new Promise(r => m1.once("open", r)),
      new Promise(r => m2.once("open", r))
    ]);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    const [vTrack] = stream.getVideoTracks();
    const [aTrack] = stream.getAudioTracks();

    let m2count = 0;
    m2.on("media", t1 => {
      console.warn(t1);
      m2count++;
    });
    await m1.sendMedia(vTrack).catch(console.error);

    await new Promise(r => setTimeout(r, 1000 * 3));

    await m1.sendMedia(aTrack).catch(console.error);

    await new Promise(r => setTimeout(r, 1000 * 3));

    expect(m2count).toBe(2);

    m1.on("media", t2 => {
      expect(t2.kind).toBe("audio");
      done();
    });
    await m2.sendMedia(aTrack.clone()).catch(console.error);
  });

  it("should send data", async done => {
    const t1 = createTransport();
    const t2 = createTransport({});
    t1.on("negotiation", p => t2.handleNegotiation(p).catch(console.error));
    t2.on("negotiation", p => t1.handleNegotiation(p).catch(console.error));
    await t1.startNegotiation().catch(console.error);
    const d1 = t1.dataHandler;
    const d2 = t2.dataHandler;

    await Promise.all([
      new Promise(r => d1.once("open", r)),
      new Promise(r => d2.once("open", r))
    ]);

    d2.on("data", c2 => {
      console.warn(c2);
    });
    const c1 = await d1.createDataChannel().catch(console.error);
    console.warn(c1);

    await new Promise(r => setTimeout(r, 1000 * 3));

    d1.on("data", c1 => {
      console.warn(c1);
      expect(c1.ordered).toBeFalsy();
      done();
    });
    const c2 = await d2
      .createDataChannel("foo", { ordered: false })
      .catch(console.error);
    console.warn(c2);
  });
});
