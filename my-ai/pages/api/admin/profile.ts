/**
 * Admin Profile API - /api/admin/profile
 *
 * GET: returns "about me" content for the bot.
 * PUT: updates "about me" content (body: { content: string }).
 * Requires x-admin-password header matching ADMIN_PASSWORD.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getAboutMe, updateProfile } from "../../../lib/db";
import { config } from "../../../lib/config";

/** Check that request has valid admin password header */
function authed(req: NextApiRequest): boolean {
  const expected = config.admin.password;
  const provided = req.headers["x-admin-password"];
  return (
    typeof provided === "string" &&
    expected.length > 0 &&
    provided === expected
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!authed(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const content = getAboutMe();
      return res.status(200).json({ ok: true, content: content ?? "" });
    }

    if (req.method === "PUT") {
      const { content } = (req.body as { content?: unknown }) || {};
      if (typeof content !== "string") {
        return res.status(400).json({ ok: false, error: "Content must be a string" });
      }
      updateProfile("about", content);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    console.error("[admin/profile] error", err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}
