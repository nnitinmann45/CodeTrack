import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
export const cookieName = "codetrack_session";
export const cookieOptions = (config) => ({
  httpOnly: true,
  secure: config.production,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 86400000,
});
export function setSession(res, user, config) {
  const token = jwt.sign({ ver: user.tokenVersion }, config.secret, {
    subject: user.id,
    expiresIn: "7d",
    algorithm: "HS256",
    issuer: "codetrack",
    audience: "codetrack-web",
  });
  res.cookie(cookieName, token, cookieOptions(config));
}
export function authenticate(config) {
  return async (req, res, next) => {
    let payload;
    try {
      payload = jwt.verify(req.cookies[cookieName], config.secret, {
        algorithms: ["HS256"],
        issuer: "codetrack",
        audience: "codetrack-web",
      });
    } catch {
      return res.status(401).json({ message: "Please log in to continue." });
    }
    const user = await User.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.ver)
      return res
        .status(401)
        .json({ message: "Your session has expired. Please log in." });
    req.user = user;
    next();
  };
}
