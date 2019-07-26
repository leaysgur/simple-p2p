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

    await Promise.all([
      new Promise(r => t1.once("open", r)),
      new Promise(r => t2.once("open", r))
    ]);

    // TODO: check connState?
    // await new Promise(r => setTimeout(r, 2000));
    // await t2.restartIce().catch(console.error);

    // await new Promise(r => setTimeout(r, 2000));
    // t2.close();
    // await new Promise(r => setTimeout(r, 1000 * 30));

    done();
  });

  it("should send media", async done => {
    const t1 = createTransport();
    const t2 = createTransport({});
    t1.on("negotiation", p => t2.handleNegotiation(p).catch(console.error));
    t2.on("negotiation", p => t1.handleNegotiation(p).catch(console.error));
    await t1.startNegotiation().catch(console.error);
    await Promise.all([
      new Promise(r => t1.once("open", r)),
      new Promise(r => t2.once("open", r))
    ]);

    const m1 = t1.mediaHandler;
    const m2 = t2.mediaHandler;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    const [vTrack] = stream.getVideoTracks();
    const [aTrack] = stream.getAudioTracks();

    let m2count = 0;
    m2.on("track", t1 => {
      console.warn(t1);
      m2count++;
    });
    await m1.sendTrack(vTrack).catch(console.error);

    await new Promise(r => setTimeout(r, 1000 * 3));

    await m1.sendTrack(aTrack).catch(console.error);

    await new Promise(r => setTimeout(r, 1000 * 3));

    expect(m2count).toBe(2);

    m1.on("track", t2 => {
      expect(t2.kind).toBe("audio");
      done();
    });
    await m2.sendTrack(aTrack.clone()).catch(console.error);
  });

  it("should send data", async done => {
    const t1 = createTransport();
    const t2 = createTransport({});
    t1.on("negotiation", p => t2.handleNegotiation(p).catch(console.error));
    t2.on("negotiation", p => t1.handleNegotiation(p).catch(console.error));
    await t1.startNegotiation().catch(console.error);
    await Promise.all([
      new Promise(r => t1.once("open", r)),
      new Promise(r => t2.once("open", r))
    ]);

    const d1 = t1.dataHandler;
    const d2 = t2.dataHandler;

    d2.on("channel", c2 => {
      console.warn(c2);
    });
    const c1 = await d1.createChannel().catch(console.error);
    console.warn(c1);

    await new Promise(r => setTimeout(r, 1000 * 3));

    d1.on("channel", c1 => {
      console.warn(c1);
      expect(c1.ordered).toBeFalsy();
      done();
    });
    const c2 = await d2
      .createChannel("foo", { ordered: false })
      .catch(console.error);
    console.warn(c2);
  });
});
