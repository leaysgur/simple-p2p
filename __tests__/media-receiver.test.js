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

describe("MediaReceiver#close()", () => {
  it("should emit close event by sender.close()", async done => {
    const closed = [];
    m2.on("receiver", r1 => {
      r1.on("close", () => {
        closed.push(r1);
      });
    });

    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await s1.close();
    expect(closed.length).toBe(1);
    done();
  });

  it("should be closed w/ proper receiver", async done => {
    const closed = [];
    m2.on("receiver", r => {
      r.on("close", () => closed.push(r));
    });

    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await m1.sendTrack(vt1).catch(done.fail);

    await s1.close();

    expect(closed.length).toBe(1);
    expect(closed[0].track.kind).toBe(at1.kind);
    done();
  });
});
