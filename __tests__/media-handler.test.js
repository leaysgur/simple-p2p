import { connectTransports } from "./helper";
import { createTransport } from "../lib";

let at1;
let vt1;
// do not gUM() for each test
beforeAll(async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  at1 = stream.getAudioTracks()[0];
  vt1 = stream.getVideoTracks()[0];
});
afterAll(() => {
  at1.stop();
  vt1.stop();
  at1 = vt1 = null;
});

let t1;
let t2;
let m1;
let m2;
beforeEach(async done => {
  t1 = createTransport();
  t2 = createTransport();
  await connectTransports(t1, t2, done);

  m1 = t1.mediaHandler;
  m2 = t2.mediaHandler;
  done();
});
afterEach(() => {
  t1.close();
  t2.close();
  t1 = t2 = null;
  m1 = m2 = null;
});

describe("MediaHandler#constructor()", () => {
  it("should be closed: false", () => {
    expect(m1.closed).toBeFalsy();
    expect(m2.closed).toBeFalsy();
  });
});

describe("MediaHandler#close()", () => {
  it("should be closed: true", () => {
    m1.close();
    expect(m1.closed).toBeTruthy();

    m2.close();
    expect(m2.closed).toBeTruthy();
  });

  it("should throw after closed", async () => {
    m1.close();
    await m1.sendTrack(at1).catch(err => {
      expect(err).toMatch(/closed/);
    });
  });
});

describe("MediaHandler#sendTrack()", () => {
  it("should send audio", async done => {
    let recvCount = 0;
    m2.once("receiver", r => {
      expect(r.track.kind).toBe(at1.kind);
      recvCount++;
      // if done() here, m1.sRD fails!
    });
    await m1.sendTrack(at1).catch(done.fail);

    expect(recvCount).toBe(1);
    done();
  });

  it("should send video", async done => {
    let recvCount = 0;
    m2.once("receiver", r => {
      expect(r.track.kind).toBe(vt1.kind);
      recvCount++;
      // if done() here, m1.sRD fails!
    });
    await m1.sendTrack(vt1).catch(done.fail);

    expect(recvCount).toBe(1);
    done();
  });

  it("should send video+audio", async done => {
    const receivers = [];
    m2.on("receiver", r => {
      receivers.push(r);
      expect(r.track instanceof MediaStreamTrack).toBeTruthy();
    });
    await m1.sendTrack(vt1).catch(done.fail);
    await m1.sendTrack(at1).catch(done.fail);

    expect(receivers.length).toBe(2);
    expect(receivers[0].track === receivers[1].track).toBeFalsy();
    done();
  });

  it("should send and send back", async done => {
    let trackCount = 0;
    m1.on("receiver", r => {
      expect(r.track.kind).toBe(at1.kind);
      trackCount++;
    });
    m2.on("receiver", async r => {
      expect(r.track.kind).toBe(vt1.kind);
      trackCount++;
      await m2.sendTrack(at1).catch(done.fail);

      expect(trackCount).toBe(2);
      done();
    });
    await m1.sendTrack(vt1).catch(done.fail);
  });
});
