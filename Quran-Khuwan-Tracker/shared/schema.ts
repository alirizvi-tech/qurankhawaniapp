import { pgTable, text, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const organizers = pgTable("organizers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const khuwanies = pgTable("khuwanies", {
  id: serial("id").primaryKey(),
  organizerId: integer("organizer_id").notNull().references(() => organizers.id),
  slug: text("slug").notNull().unique(),
  marhoomName: text("marhoom_name").notNull(),
  numQurans: integer("num_qurans").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  khuwaniId: integer("khuwani_id").notNull().references(() => khuwanies.id, { onDelete: "cascade" }),
  quranNumber: integer("quran_number").notNull(),
  siparaNumber: integer("sipara_number").notNull(),
  participantName: text("participant_name").notNull(),
  claimedAt: timestamp("claimed_at").defaultNow(),
}, (table) => [
  unique("unique_claim").on(table.khuwaniId, table.quranNumber, table.siparaNumber),
]);

export const insertOrganizerSchema = createInsertSchema(organizers).pick({
  email: true,
  passwordHash: true,
});

export const insertKhuwaniSchema = createInsertSchema(khuwanies).pick({
  organizerId: true,
  slug: true,
  marhoomName: true,
  numQurans: true,
});

export const insertClaimSchema = createInsertSchema(claims).pick({
  khuwaniId: true,
  quranNumber: true,
  siparaNumber: true,
  participantName: true,
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const createKhuwaniFormSchema = z.object({
  marhoomName: z.string().min(1, "Please enter the name"),
});

export type InsertOrganizer = z.infer<typeof insertOrganizerSchema>;
export type InsertKhuwani = z.infer<typeof insertKhuwaniSchema>;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Organizer = typeof organizers.$inferSelect;
export type Khuwani = typeof khuwanies.$inferSelect;
export type Claim = typeof claims.$inferSelect;

export const SIPARA_NAMES = [
  "Alif Laam Meem",
  "Sayaqool",
  "Tilkal Rusul",
  "Lan Tana Loo",
  "Wal Mohsanat",
  "La Yuhibbullah",
  "Wa Iza Samiu",
  "Wa Lau Annana",
  "Qalal Malao",
  "Wa A'lamu",
  "Yata Zeroon",
  "Wa Mamin Dabbatin",
  "Wa Ma Ubrioo",
  "Rubama",
  "Subhanalladhi",
  "Qal Alam",
  "Iqtarabo",
  "Qadd Aflaha",
  "Wa Qalalladhina",
  "Amman Khalaqa",
  "Utlu Ma Oohi",
  "Wa Man Yaqnut",
  "Wa Mali",
  "Faman Azlamu",
  "Ilaihi Yuraddu",
  "Ha Meem",
  "Qala Fama Khatbukum",
  "Qadd Sami Allah",
  "Tabarakallazi",
  "Amma",
] as const;

export const SIPARA_NAMES_ARABIC = [
  "الٓمٓ",
  "سَيَقُولُ",
  "تِلْكَ الرُّسُلُ",
  "لَن تَنَالُوا",
  "وَالْمُحْصَنَاتُ",
  "لَا يُحِبُّ اللهُ",
  "وَإِذَا سَمِعُوا",
  "وَلَوْ أَنَّنَا",
  "قَالَ الْمَلَأُ",
  "وَاعْلَمُوا",
  "يَعْتَذِرُونَ",
  "وَمَا مِن دَابَّةٍ",
  "وَمَا أُبَرِّئُ",
  "رُبَمَا",
  "سُبْحَانَ الَّذِي",
  "قَالَ أَلَمْ",
  "اقْتَرَبَ",
  "قَدْ أَفْلَحَ",
  "وَقَالَ الَّذِينَ",
  "أَمَّنْ خَلَقَ",
  "اتْلُ مَا أُوحِيَ",
  "وَمَن يَقْنُتْ",
  "وَمَالِيَ",
  "فَمَنْ أَظْلَمُ",
  "إِلَيْهِ يُرَدُّ",
  "حٰمٓ",
  "قَالَ فَمَا خَطْبُكُمْ",
  "قَدْ سَمِعَ اللهُ",
  "تَبَارَكَ الَّذِي",
  "عَمَّ",
] as const;

export const ARABIC_NUMERALS = [
  "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠",
  "١١", "١٢", "١٣", "١٤", "١٥", "١٦", "١٧", "١٨", "١٩", "٢٠",
  "٢١", "٢٢", "٢٣", "٢٤", "٢٥", "٢٦", "٢٧", "٢٨", "٢٩", "٣٠",
] as const;
