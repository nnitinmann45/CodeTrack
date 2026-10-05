import test from "node:test";
import assert from "node:assert/strict";
import { calculateStats, todayIn } from "../server/lib/stats.js";
import { problemSchema } from "../server/lib/validation.js";
const p = (date, difficulty = "Easy") => ({
  solvedDate: date,
  difficulty,
  topic: "Arrays",
});
test("empty records have zero progress and no earned badges", () => {
  const s = calculateStats([], "2026-10-05");
  assert.equal(s.points, 0);
  assert.equal(s.currentStreak, 0);
  assert.equal(s.longestStreak, 0);
  assert.equal(s.activity.length, 84);
  assert.ok(s.badges.every((b) => !b.earned));
});
test("multiple problems in one day count once toward streak, with correct points", () => {
  const s = calculateStats(
    [p("2026-10-03"), p("2026-10-04", "Medium"), p("2026-10-04", "Hard")],
    "2026-10-05",
  );
  assert.equal(s.currentStreak, 2);
  assert.equal(s.longestStreak, 2);
  assert.equal(s.points, 70);
  assert.equal(s.total, 3);
});
test("today continues a streak, older history preserves longest only", () => {
  const records = [
    p("2026-09-28"),
    p("2026-09-29"),
    p("2026-09-30"),
    p("2026-10-05"),
  ];
  const s = calculateStats(records, "2026-10-05");
  assert.equal(s.currentStreak, 1);
  assert.equal(s.longestStreak, 3);
  assert.equal(calculateStats(records, "2026-10-07").currentStreak, 0);
});
test("streak crosses year and leap-day boundaries", () => {
  assert.equal(
    calculateStats([p("2025-12-31"), p("2026-01-01")], "2026-01-01")
      .currentStreak,
    2,
  );
  assert.equal(
    calculateStats(
      [p("2024-02-28"), p("2024-02-29"), p("2024-03-01")],
      "2024-03-01",
    ).longestStreak,
    3,
  );
});
test("calendar date follows account timezone", () => {
  const now = new Date("2026-10-04T20:00:00Z");
  assert.equal(todayIn("Asia/Kolkata", now), "2026-10-05");
  assert.equal(todayIn("UTC", now), "2026-10-04");
});
test("validation rejects impossible and future dates, unsafe links", () => {
  const valid = {
    title: "Two Sum",
    platform: "LeetCode",
    url: "https://leetcode.com/problems/two-sum/?x=1#solution",
    difficulty: "Easy",
    topic: "Arrays",
    solvedDate: "2024-02-29",
  };
  const schema = problemSchema("UTC");
  assert.equal(
    schema.parse(valid).url,
    "https://leetcode.com/problems/two-sum",
  );
  for (const solvedDate of ["2025-02-29", "2024-04-31", "2099-01-01"])
    assert.equal(schema.safeParse({ ...valid, solvedDate }).success, false);
  assert.equal(
    schema.safeParse({ ...valid, url: "javascript:alert(1)" }).success,
    false,
  );
});
