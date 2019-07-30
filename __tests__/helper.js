export async function connectTransports(t1, t2, done) {
  t1.on("negotiation", msg => t2.handleNegotiation(msg).catch(done.fail));
  t2.on("negotiation", msg => t1.handleNegotiation(msg).catch(done.fail));
  await t1.startNegotiation().catch(done.fail);

  await Promise.all([
    new Promise(r => t1.once("open", r)),
    new Promise(r => t2.once("open", r))
  ]);
}
