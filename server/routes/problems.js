import { Router } from "express";
import mongoose from "mongoose";
import { Problem } from "../models/Problem.js";
import { problemSchema } from "../lib/validation.js";
import { calculateStats, todayIn } from "../lib/stats.js";
export function problemRoutes() {
  const r = Router();
  r.get("/", async (req, res) => {
    const problems = await Problem.find({ user: req.user.id })
      .sort({ solvedDate: -1, createdAt: -1 })
      .lean();
    res.json({
      problems,
      stats: calculateStats(problems, todayIn(req.user.timezone)),
    });
  });
  r.post("/", async (req, res) => {
    const data = problemSchema(req.user.timezone).parse(req.body);
    const problem = await Problem.create({ ...data, user: req.user.id });
    res.status(201).json({ problem });
  });
  r.param("id", (req, res, next, id) => {
    if (!mongoose.isObjectIdOrHexString(id))
      return res.status(400).json({ message: "Invalid problem ID." });
    next();
  });
  r.put("/:id", async (req, res) => {
    const data = problemSchema(req.user.timezone).parse(req.body);
    const problem = await Problem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!problem)
      return res.status(404).json({ message: "Problem not found." });
    res.json({ problem });
  });
  r.delete("/:id", async (req, res) => {
    const problem = await Problem.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!problem)
      return res.status(404).json({ message: "Problem not found." });
    res.json({ message: "Problem deleted." });
  });
  return r;
}
