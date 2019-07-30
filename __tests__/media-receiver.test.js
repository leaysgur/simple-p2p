import { connectTransports, getUserMedia } from "./helper";
import { createTransport } from "../lib";

let at1;
let vt1;
// do not gUM() for each test
beforeAll(async done => {
  const { vt, at } = await getUserMedia(done);
  at1 = at;
  vt1 = vt;
  done();
});
afterAll(() => {
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

describe("MediaReceiver#constructor", () => {
  it("should be ended: false", async done => {
    const receivers = [];
    m2.on("receiver", r1 => receivers.push(r1));
    await m1.sendTrack(at1).catch(done.fail);

    expect(receivers.length).toBe(1);
    expect(receivers[0].ended).toBeFalsy();
    done();
  });

  it("should have track", async done => {
    const receivers = [];
    m2.on("receiver", r1 => receivers.push(r1));
    await m1.sendTrack(at1).catch(done.fail);
    await m1.sendTrack(vt1).catch(done.fail);

    expect(receivers.length).toBe(2);
    expect(receivers[0].track.kind).toBe(at1.kind);
    expect(receivers[1].track.kind).toBe(vt1.kind);
    done();
  });
});

describe("MediaReceiver#events@replace", () => {
  it("should emit replace event by sender.replace()", async done => {
    const replaced = [];
    m2.on("receiver", r1 => {
      r1.on("replace", () => replaced.push(r1));
    });

    const s1 = await m1.sendTrack(at1).catch(done.fail);
    const at2 = at1.clone();
    await s1.replace(at2).catch(done.fail);

    expect(replaced.length).toBe(1);
    expect(replaced[0].track.kind).toBe(at2.kind);
    done();
  });

  it("should emit replace on proper receiver", async done => {
    const receivers = [];
    m2.on("receiver", r1 => receivers.push(r1));

    await m1.sendTrack(vt1).catch(done.fail);
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await m1.sendTrack(vt1.clone()).catch(done.fail);
    await m1.sendTrack(at1.clone()).catch(done.fail);

    let replaced = false;
    for (const r of receivers) {
      const idx = receivers.indexOf(r);
      r.on("replace", () => (replaced = idx === 1));
    }

    const at2 = at1.clone();
    await s1.replace(at2).catch(done.fail);

    expect(replaced).toBeTruthy();
    expect(receivers[1].track.kind).toBe(at2.kind);
    done();
  });
});

describe("MediaReceiver#events@close", () => {
  it("should emit close event by sender.end()", async done => {
    const ended = [];
    m2.on("receiver", r1 => {
      r1.on("ended", () => ended.push(r1));
    });

    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await s1.end().catch(done.fail);

    expect(ended.length).toBe(1);
    expect(ended[0].ended).toBeTruthy();
    done();
  });

  it("should be ended w/ proper receiver", async done => {
    const ended = [];
    m2.on("receiver", r => {
      r.on("ended", () => ended.push(r));
    });

    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await m1.sendTrack(vt1).catch(done.fail);

    await s1.end().catch(done.fail);

    expect(ended.length).toBe(1);
    expect(ended[0].ended).toBeTruthy();
    expect(ended[0].track.kind).toBe(at1.kind);
    done();
  });
});
