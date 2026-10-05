import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../server/app.js";
import { User } from "../server/models/User.js";
import { Problem } from "../server/models/Problem.js";
import { runReminders } from "../server/lib/reminders.js";
const origin = "http://localhost:5173";
const app = createApp({
  secret: "test-only-secret-with-more-than-32-characters",
  origin,
  production: false,
});
let mongo;
before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([User.init(), Problem.init()]);
});
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
const body = {
  title: "Two Sum",
  platform: "LeetCode",
  url: "https://leetcode.com/problems/two-sum/",
  difficulty: "Easy",
  topic: "Arrays",
  solvedDate: "2024-03-01",
  notes: "Use a map",
};
test("registration, CRUD, isolation, duplicate protection, and logout revocation", async () => {
  const alice = request.agent(app),
    bob = request.agent(app);
  await request(app).get("/api/problems").expect(401);
  await request(app).post("/api/auth/register").send({}).expect(403);
  const registration = await alice
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({
      name: "Alice",
      email: "ALICE@example.com",
      password: "strong-pass-123",
    })
    .expect(201);
  assert.ok(!registration.body.user.passwordHash);
  const stolenCookie = registration.headers["set-cookie"][0].split(";")[0];
  assert.match(registration.headers["set-cookie"][0], /HttpOnly/);
  await bob
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({
      name: "Bob",
      email: "bob@example.com",
      password: "strong-pass-456",
    })
    .expect(201);
  await alice
    .post("/api/auth/settings")
    .set("Origin", origin)
    .send({})
    .expect(404);
  const added = await alice
    .post("/api/problems")
    .set("Origin", origin)
    .send(body)
    .expect(201);
  const id = added.body.problem._id;
  await alice
    .post("/api/problems")
    .set("Origin", origin)
    .send({ ...body, url: body.url + "?query=1" })
    .expect(409);
  await bob
    .put("/api/problems/" + id)
    .set("Origin", origin)
    .send({ ...body, title: "Stolen" })
    .expect(404);
  await bob
    .delete("/api/problems/" + id)
    .set("Origin", origin)
    .expect(404);
  assert.equal(
    (await bob.get("/api/problems").expect(200)).body.problems.length,
    0,
  );
  await alice
    .put("/api/problems/" + id)
    .set("Origin", origin)
    .send({ ...body, difficulty: "Hard" })
    .expect(200);
  assert.equal((await alice.get("/api/problems")).body.stats.points, 40);
  await alice
    .post("/api/problems")
    .set("Origin", origin)
    .send({ ...body, url: "javascript:alert(1)" })
    .expect(400);
  await alice
    .patch("/api/auth/settings")
    .set("Origin", origin)
    .send({ name: "Alice", timezone: "Asia/Kolkata", remindersEnabled: true })
    .expect(400);
  await alice
    .delete("/api/problems/" + id)
    .set("Origin", origin)
    .expect(200);
  assert.equal((await alice.get("/api/problems")).body.stats.points, 0);
  await alice.post("/api/auth/logout").set("Origin", origin).expect(200);
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", stolenCookie)
    .expect(401);
  await alice
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email: "alice@example.com", password: "wrong-password" })
    .expect(401);
  await alice
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email: "alice@example.com", password: "strong-pass-123" })
    .expect(200);
});
test("verification token is single-use and cron endpoint is secret-protected", async () => {
  const token = "a".repeat(64);
  await User.updateOne(
    { email: "alice@example.com" },
    {
      $set: {
        verificationHash: createHash("sha256").update(token).digest("hex"),
        verificationExpires: new Date(Date.now() + 60000),
      },
    },
  );
  await request(app)
    .post("/api/auth/verify-email")
    .set("Origin", origin)
    .send({ token })
    .expect(200);
  await request(app)
    .post("/api/auth/verify-email")
    .set("Origin", origin)
    .send({ token })
    .expect(400);
  process.env.CRON_SECRET = "test-cron-secret-with-32-characters-or-more";
  await request(app).post("/api/jobs/reminders").expect(401);
  await request(app)
    .post("/api/jobs/reminders")
    .set("Authorization", "Bearer " + process.env.CRON_SECRET)
    .expect(200);
});
test("reminders target verified inactive opt-ins only; retries do not resend successful deliveries", async () => {
  const old = new Date(Date.now() - 4 * 86400000);
  await User.updateOne(
    { email: "alice@example.com" },
    { $set: { remindersEnabled: true, emailVerified: true, createdAt: old } },
    { timestamps: false },
  );
  await User.updateOne(
    { email: "bob@example.com" },
    { $set: { remindersEnabled: true, emailVerified: false, createdAt: old } },
    { timestamps: false },
  );
  process.env.MAIL_PROVIDER = "resend";
  process.env.RESEND_API_KEY = "fake-test-key";
  process.env.MAIL_FROM = "test@example.com";
  const realFetch = global.fetch;
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    assert.equal(JSON.parse(options.body).to[0], "alice@example.com");
    return { ok: true };
  };
  try {
    assert.equal((await runReminders(origin)).sent, 1);
    assert.equal((await runReminders(origin)).sent, 0);
    assert.equal(calls, 1);
  } finally {
    global.fetch = realFetch;
    process.env.MAIL_PROVIDER = "disabled";
  }
});
