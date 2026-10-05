import test from "node:test";
import request from "supertest";
import { createApp } from "../server/app.js";
const origin = "http://localhost:5173";
const app = createApp({
  secret: "guards-test-secret-at-least-32-characters",
  origin,
  production: false,
});
test("unauthenticated and forged-origin requests cannot access protected operations", async () => {
  await request(app).get("/api/problems").expect(401);
  await request(app)
    .post("/api/problems")
    .set("Origin", "https://other.example")
    .send({})
    .expect(403);
  await request(app)
    .post("/api/problems")
    .set("Origin", origin)
    .send({})
    .expect(401);
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", "codetrack_session=forged")
    .expect(401);
});
test("bad registration and login inputs are rejected before database access", async () => {
  await request(app)
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ name: "A", email: "invalid", password: "short" })
    .expect(400);
  await request(app)
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email: { $ne: null }, password: "pw" })
    .expect(400);
  await request(app)
    .post("/api/auth/register")
    .set("Origin", origin)
    .set("Content-Type", "application/json")
    .send("{broken")
    .expect(400);
});
test("unknown API routes return JSON 404 and reminder jobs require a separate secret", async () => {
  await request(app)
    .get("/api/missing")
    .expect("Content-Type", /json/)
    .expect(404);
  process.env.CRON_SECRET = "separate-guard-test-secret-of-32-characters";
  await request(app).post("/api/jobs/reminders").expect(401);
  await request(app)
    .post("/api/jobs/reminders")
    .set("Authorization", "Bearer wrong")
    .expect(401);
});
