import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema, createKhuwaniFormSchema } from "@shared/schema";
import MemoryStore from "memorystore";
import { z } from "zod";

const claimBodySchema = z.object({
  quranNumber: z.number().int().min(1),
  siparaNumber: z.number().int().min(1).max(30),
  participantName: z.string().min(1).max(100).trim(),
});

declare module "express-session" {
  interface SessionData {
    organizerId?: number;
  }
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const random = Math.random().toString(36).substring(2, 7);
  return `${base}-${random}`;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.organizerId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const MSStore = MemoryStore(session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "quran-khuwani-secret-key-" + Math.random(),
      resave: false,
      saveUninitialized: false,
      store: new MSStore({ checkPeriod: 86400000 }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  app.post("/api/organizer/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;
      const existing = await storage.getOrganizerByEmail(email);
      if (existing) {
        return res.status(400).json({ success: false, message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const organizer = await storage.createOrganizer({ email, passwordHash });
      req.session.organizerId = organizer.id;
      res.json({ success: true, message: "Account created" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  });

  app.post("/api/organizer/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;
      const organizer = await storage.getOrganizerByEmail(email);
      if (!organizer) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, organizer.passwordHash);
      if (!valid) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      req.session.organizerId = organizer.id;
      res.json({ success: true, message: "Logged in" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  app.post("/api/organizer/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true, message: "Logged out" });
    });
  });

  app.get("/api/organizer/session", async (req: Request, res: Response) => {
    if (!req.session.organizerId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const organizer = await storage.getOrganizerById(req.session.organizerId);
    if (!organizer) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    res.json({ id: organizer.id, email: organizer.email });
  });

  app.get("/api/organizer/khuwanies", requireAuth, async (req: Request, res: Response) => {
    try {
      const khuwaniList = await storage.getKhuwaniesForOrganizer(req.session.organizerId!);
      const result = await Promise.all(
        khuwaniList.map(async (k) => {
          const kClaims = await storage.getClaimsForKhuwani(k.id);
          return { ...k, claims: kClaims };
        })
      );
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to fetch khuwanies" });
    }
  });

  app.post("/api/organizer/khuwani/create", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = createKhuwaniFormSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
      }

      let slug = generateSlug(parsed.data.marhoomName);
      let attempts = 0;
      while (await storage.slugExists(slug) && attempts < 10) {
        slug = generateSlug(parsed.data.marhoomName);
        attempts++;
      }

      const khuwani = await storage.createKhuwani({
        organizerId: req.session.organizerId!,
        slug,
        marhoomName: parsed.data.marhoomName,
        numQurans: 1,
      });

      res.json({ success: true, khuwani });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to create khuwani" });
    }
  });

  app.post("/api/organizer/khuwani/:id/delete", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const k = await storage.getKhuwaniById(id);
      if (!k || k.organizerId !== req.session.organizerId) {
        return res.status(404).json({ success: false, message: "Khuwani not found" });
      }
      await storage.deleteKhuwani(id);
      res.json({ success: true, message: "Deleted" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to delete" });
    }
  });

  app.post("/api/organizer/khuwani/:id/reset", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const k = await storage.getKhuwaniById(id);
      if (!k || k.organizerId !== req.session.organizerId) {
        return res.status(404).json({ success: false, message: "Khuwani not found" });
      }
      await storage.deleteAllClaimsForKhuwani(id);
      res.json({ success: true, message: "Claims reset" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to reset" });
    }
  });

  app.post("/api/organizer/khuwani/:id/add-quran", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const k = await storage.getKhuwaniById(id);
      if (!k || k.organizerId !== req.session.organizerId) {
        return res.status(404).json({ success: false, message: "Khuwani not found" });
      }
      await storage.incrementQurans(id);
      res.json({ success: true, message: "Quran added" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to add Quran" });
    }
  });

  app.get("/api/k/:slug", async (req: Request, res: Response) => {
    try {
      const k = await storage.getKhuwaniBySlug(req.params.slug);
      if (!k) {
        return res.status(404).json({ success: false, message: "Khuwani not found" });
      }
      const kClaims = await storage.getClaimsForKhuwani(k.id);
      res.json({
        id: k.id,
        marhoomName: k.marhoomName,
        numQurans: k.numQurans,
        slug: k.slug,
        claims: kClaims,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to fetch khuwani" });
    }
  });

  app.post("/api/k/:slug/claim", async (req: Request, res: Response) => {
    try {
      const k = await storage.getKhuwaniBySlug(req.params.slug);
      if (!k) {
        return res.status(404).json({ success: false, message: "Khuwani not found" });
      }

      const parsed = claimBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
      }

      const { quranNumber, siparaNumber, participantName } = parsed.data;

      if (quranNumber > k.numQurans) {
        return res.status(400).json({ success: false, message: "Invalid Quran number" });
      }

      try {
        const claim = await storage.createClaim({
          khuwaniId: k.id,
          quranNumber,
          siparaNumber,
          participantName,
        });
        res.json({ success: true, claim });
      } catch (err: any) {
        if (err.code === "23505") {
          return res.status(409).json({
            success: false,
            message: "Sorry, this Sipara was just claimed by someone else. Please choose another.",
          });
        }
        throw err;
      }
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Failed to claim sipara" });
      }
    }
  });

  app.post("/api/k/:slug/unclaim", async (req: Request, res: Response) => {
    try {
      const k = await storage.getKhuwaniBySlug(req.params.slug);
      if (!k) {
        return res.status(404).json({ success: false, message: "Khuwani not found" });
      }

      const parsed = claimBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
      }

      const { quranNumber, siparaNumber, participantName } = parsed.data;

      const deleted = await storage.deleteClaim(
        k.id,
        quranNumber,
        siparaNumber,
        participantName
      );

      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: "Could not release this Sipara. You may not have claimed it.",
        });
      }

      res.json({ success: true, message: "Sipara released" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to release sipara" });
    }
  });

  return httpServer;
}
