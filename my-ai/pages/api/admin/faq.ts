/**
 * Admin FAQ API - /api/admin/faq
 *
 * CRUD for FAQ entries. Requires x-admin-password header matching ADMIN_PASSWORD.
 * Supports GET (list/search, or single by id), POST (create), PUT (update), DELETE.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import {
  createFaq,
  deleteFaq,
  getAllFaqs,
  getFaqById,
  updateFaq,
} from "../../../lib/db";
import { config } from "../../../lib/config";
import type { AdminApiResponse } from "@/types/api";

/** Check that request has valid admin password header */
function authed(req: NextApiRequest): boolean {
  const expected = config.admin.password;
  const provided = req.headers["x-admin-password"];

  const ok =
    typeof provided === "string" &&
    expected.length > 0 &&
    provided === expected;

  if (!ok) {
    console.warn("[admin] auth failed", {
      hasHeader: typeof provided === "string",
      expectedSet: expected.length > 0,
    });
  }

  return ok;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminApiResponse>
) {
  const started = Date.now();

  console.log("[admin] request", {
    method: req.method,
    url: req.url,
  });

  // Auth check first so nothing else runs for unauthorized users
  if (!authed(req)) {
    console.warn("[admin] unauthorized access attempt");
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const idRaw = req.query.id;
      const searchRaw = req.query.search;

      if (typeof idRaw === "string") {
        const id = Number(idRaw);
        if (!Number.isFinite(id)) {
          console.warn("[admin] invalid id in GET", idRaw);
          return res.status(400).json({ ok: false, error: "Invalid id" });
        }
        const row = getFaqById(id);
        return res.status(200).json({ ok: true, data: row });
      }

      const search =
        typeof searchRaw === "string" && searchRaw.trim()
          ? searchRaw.trim()
          : undefined;
      const all = getAllFaqs(search);
      console.log("[admin] fetched faqs", { count: all.length, search });
      return res.status(200).json({ ok: true, data: all });
    }

    if (req.method === "POST") {
      // I validate all required fields before touching the DB
      const body = (req.body as any) || {};
      const question = String(body.question ?? "").trim();
      const answer = String(body.answer ?? "").trim();
      const category = String(body.category ?? "").trim();

      if (!question || !answer || !category) {
        console.warn("[admin] create blocked: missing fields", {
          question: !!question,
          answer: !!answer,
          category: !!category,
        });

        return res.status(400).json({
          ok: false,
          error: "question, answer and category are required",
        });
      }

      const id = createFaq({ question, answer, category });
      console.log("[admin] faq created", { id });

      return res.status(200).json({ ok: true, data: { id } });
    }

    if (req.method === "PUT") {
      const body = (req.body as any) || {};
      const id = Number(body.id);
      const question = String(body.question ?? "").trim();
      const answer = String(body.answer ?? "").trim();
      const category = String(body.category ?? "").trim();

      if (!Number.isFinite(id)) {
        console.warn("[admin] update blocked: invalid id", body.id);
        return res.status(400).json({ ok: false, error: "id required" });
      }

      if (!question || !answer || !category) {
        console.warn("[admin] update blocked: missing fields", {
          id,
          question: !!question,
          answer: !!answer,
          category: !!category,
        });

        return res.status(400).json({
          ok: false,
          error: "question, answer and category are required",
        });
      }

      const changes = updateFaq(id, { question, answer, category });
      console.log("[admin] faq updated", { id, changes });

      return res.status(200).json({ ok: true, data: { changes } });
    }

    if (req.method === "DELETE") {
      const body = (req.body as any) || {};
      const id = Number(body.id);

      if (!Number.isFinite(id)) {
        console.warn("[admin] delete blocked: invalid id", body.id);
        return res.status(400).json({ ok: false, error: "id required" });
      }

      const changes = deleteFaq(id);
      console.log("[admin] faq deleted", { id, changes });

      return res.status(200).json({ ok: true, data: { changes } });
    }

    console.warn("[admin] method not allowed", req.method);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (e: any) {
    // I log full error details server-side but return a clean message to the client
    console.error("[admin] API error", {
      message: e?.message,
      stack: e?.stack,
    });

    return res
      .status(500)
      .json({ ok: false, error: e?.message ?? "Server error" });
  } finally {
    console.log("[admin] request finished", {
      method: req.method,
      ms: Date.now() - started,
    });
  }
}