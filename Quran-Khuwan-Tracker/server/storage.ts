import { eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  organizers,
  khuwanies,
  claims,
  type InsertOrganizer,
  type InsertKhuwani,
  type InsertClaim,
  type Organizer,
  type Khuwani,
  type Claim,
} from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  getOrganizerByEmail(email: string): Promise<Organizer | undefined>;
  getOrganizerById(id: number): Promise<Organizer | undefined>;
  createOrganizer(data: InsertOrganizer): Promise<Organizer>;
  getKhuwaniesForOrganizer(organizerId: number): Promise<Khuwani[]>;
  getKhuwaniById(id: number): Promise<Khuwani | undefined>;
  getKhuwaniBySlug(slug: string): Promise<Khuwani | undefined>;
  createKhuwani(data: InsertKhuwani): Promise<Khuwani>;
  deleteKhuwani(id: number): Promise<void>;
  getClaimsForKhuwani(khuwaniId: number): Promise<Claim[]>;
  createClaim(data: InsertClaim): Promise<Claim>;
  deleteClaim(khuwaniId: number, quranNumber: number, siparaNumber: number, participantName: string): Promise<boolean>;
  deleteAllClaimsForKhuwani(khuwaniId: number): Promise<void>;
  slugExists(slug: string): Promise<boolean>;
  incrementQurans(khuwaniId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getOrganizerByEmail(email: string): Promise<Organizer | undefined> {
    const [organizer] = await db.select().from(organizers).where(eq(organizers.email, email)).limit(1);
    return organizer;
  }

  async getOrganizerById(id: number): Promise<Organizer | undefined> {
    const [organizer] = await db.select().from(organizers).where(eq(organizers.id, id)).limit(1);
    return organizer;
  }

  async createOrganizer(data: InsertOrganizer): Promise<Organizer> {
    const [organizer] = await db.insert(organizers).values(data).returning();
    return organizer;
  }

  async getKhuwaniesForOrganizer(organizerId: number): Promise<Khuwani[]> {
    return db.select().from(khuwanies).where(eq(khuwanies.organizerId, organizerId));
  }

  async getKhuwaniById(id: number): Promise<Khuwani | undefined> {
    const [k] = await db.select().from(khuwanies).where(eq(khuwanies.id, id)).limit(1);
    return k;
  }

  async getKhuwaniBySlug(slug: string): Promise<Khuwani | undefined> {
    const [k] = await db.select().from(khuwanies).where(eq(khuwanies.slug, slug)).limit(1);
    return k;
  }

  async createKhuwani(data: InsertKhuwani): Promise<Khuwani> {
    const [k] = await db.insert(khuwanies).values(data).returning();
    return k;
  }

  async deleteKhuwani(id: number): Promise<void> {
    await db.delete(claims).where(eq(claims.khuwaniId, id));
    await db.delete(khuwanies).where(eq(khuwanies.id, id));
  }

  async getClaimsForKhuwani(khuwaniId: number): Promise<Claim[]> {
    return db.select().from(claims).where(eq(claims.khuwaniId, khuwaniId));
  }

  async createClaim(data: InsertClaim): Promise<Claim> {
    const [claim] = await db.insert(claims).values(data).returning();
    return claim;
  }

  async deleteClaim(
    khuwaniId: number,
    quranNumber: number,
    siparaNumber: number,
    participantName: string
  ): Promise<boolean> {
    const result = await db
      .delete(claims)
      .where(
        and(
          eq(claims.khuwaniId, khuwaniId),
          eq(claims.quranNumber, quranNumber),
          eq(claims.siparaNumber, siparaNumber),
          eq(claims.participantName, participantName)
        )
      )
      .returning();
    return result.length > 0;
  }

  async deleteAllClaimsForKhuwani(khuwaniId: number): Promise<void> {
    await db.delete(claims).where(eq(claims.khuwaniId, khuwaniId));
  }

  async slugExists(slug: string): Promise<boolean> {
    const [k] = await db.select({ id: khuwanies.id }).from(khuwanies).where(eq(khuwanies.slug, slug)).limit(1);
    return !!k;
  }

  async incrementQurans(khuwaniId: number): Promise<void> {
    await db
      .update(khuwanies)
      .set({ numQurans: sql`${khuwanies.numQurans} + 1` })
      .where(eq(khuwanies.id, khuwaniId));
  }
}

export const storage = new DatabaseStorage();
