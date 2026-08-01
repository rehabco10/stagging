import { z } from "zod"

/**
 * Single source of truth for the package wizard's shapes. Types are inferred
 * from here (`z.infer`) rather than declared alongside — see docs/data-model.md.
 *
 * PocketBase returns dates as strings and view-collection numbers as strings,
 * so numeric fields coerce and dates stay strings until the UI parses them.
 */

/** PocketBase system fields. `passthrough` keeps `expand` and anything new. */
export const BaseSchema = z
  .object({
    id: z.string().optional(),
    created: z.string().optional(),
    updated: z.string().optional(),
    collectionId: z.string().optional(),
    collectionName: z.string().optional(),
    expand: z.any().optional(),
  })
  .passthrough()

/* ── enums ──────────────────────────────────────────────────────── */

export const City = z.enum(["makkah", "madinah"])
/** «خمسة نجوم … نزل». Independent of `Grade` — see data-model §2. */
export const StarClass = z.enum(["5", "4", "3", "2", "1", "nuzul"])
/** «فئة السكن» أ/ب/ج/م. */
export const Grade = z.enum(["أ", "ب", "ج", "م"])
export const Tier = z.enum(["luxury", "premium", "standard"])
/** The ministry's slot label. NOT chronological order — row 5 of 1447 puts
 *  `transitional` first. Order comes from dates via `sequence`. */
export const LegRole = z.enum(["first", "second", "transitional"])
export const Transport = z.enum(["bus"])
export const PublishStatus = z.enum(["draft", "submitted", "approved", "rejected"])
export const SaleStatus = z.enum(["unavailable", "available"])
export const SeasonStatus = z.enum(["draft", "submitted", "approved", "closed"])
export const MediaRole = z.enum(["hero", "gallery"])
export const QuotaGroup = z.enum(["premium_and_above", "standard"])

/** Where a requirement came from. */
export const MeetingKind = z.enum(["internal", "ministry", "provider", "other"])
/**
 * Requirement types. The first five carry structured `params` and are enforced
 * by validateSeason; `note` is free text and becomes a manual sign-off item.
 */
export const RequirementKind = z.enum([
  "quota", // total pilgrims for the season
  "mix", // tier percentage bounds
  "pricing", // price floor/ceiling per tier
  "hotel", // a hotel that must or must not be used
  "window", // season date window / mashaer dates
  "note", // free text, not machine-checkable
])
export const RequirementStatus = z.enum(["proposed", "agreed", "superseded"])
export const SubmissionStatus = z.enum(["preparing", "sent", "accepted", "rejected", "partial"])

/** PocketBase date field: "YYYY-MM-DD" or a full timestamp. */
const pbDate = z.string().min(1)
const relation = z.string()

/* ── collections ────────────────────────────────────────────────── */

export const SeasonSchema = BaseSchema.extend({
  year_hijri: z.coerce.number().int(),
  year_gregorian: z.coerce.number().int(),
  quota_total: z.coerce.number().int().positive(),
  status: SeasonStatus.default("draft"),
  default_disclaimer_ar: z.string().optional().nullable(),
})

export const HotelSchema = BaseSchema.extend({
  season: relation.optional().nullable(),
  name_ar: z.string().min(1),
  name_en: z.string().optional().nullable(),
  city: City,
  star_class: StarClass,
  grade: Grade,
  nusuk_ref: z.string().optional().nullable(),
})

export const CampSchema = BaseSchema.extend({
  season: relation.optional().nullable(),
  name: z.string().min(1),
  zone: z.string().optional().nullable(),
})

export const ItinerarySchema = BaseSchema.extend({
  season: relation,
  code: z.string().min(1),
  is_shifting: z.boolean().default(false),
  // derived from legs; validated, not trusted
  total_nights: z.coerce.number().int().nonnegative().default(0),
  starts_on: pbDate.optional().nullable(),
  ends_on: pbDate.optional().nullable(),
})

export const ItineraryLegSchema = BaseSchema.extend({
  itinerary: relation,
  sequence: z.coerce.number().int().positive(),
  role: LegRole,
  city: City,
  hotel: relation,
  starts_on: pbDate,
  ends_on: pbDate,
  nights: z.coerce.number().int().positive(),
})

export const PackageSchema = BaseSchema.extend({
  season: relation,
  package_no: z.string().min(1),
  nusuk_id: z.string().optional().nullable(),
  name_ar: z.string().optional().nullable(),
  name_en: z.string().min(1),
  tier: Tier,
  is_shifting: z.boolean().default(false),
  /**
   * Opaque trailing label on the platform's category string — 1447 used "SA"
   * on packages 30, 31, 38, 39. Meaning is not confirmed, so it is carried
   * verbatim for round-trip and nothing downstream branches on it. Give it a
   * real name only once the meaning is settled.
   */
  variant_suffix: z.string().optional().nullable(),
  itinerary: relation,
  camp: relation.optional().nullable(),
  transport: Transport.default("bus"),
  capacity: z.coerce.number().int().positive(),
  initial_price_sar: z.coerce.number().positive(),
  publish_status: PublishStatus.default("draft"),
  sale_status: SaleStatus.default("unavailable"),
})

export const PackageContentSchema = BaseSchema.extend({
  package: relation,
  body_ar: z.string().optional().nullable(),
  body_en: z.string().optional().nullable(),
  disclaimer_ar: z.string().optional().nullable(),
})

export const PackageMediaSchema = BaseSchema.extend({
  package: relation,
  file: z.string().optional().nullable(),
  role: MediaRole.default("gallery"),
  sort: z.coerce.number().int().nonnegative().default(0),
  approved: z.boolean().default(false),
  approved_by: relation.optional().nullable(),
})

/* ── intake: meetings → requirements → packages ──────────────────
 * Packages are not authored from a blank slate. They are the output of
 * meetings with the team and with the Hajj & Umrah ministry, where the quota,
 * the tier mix, pricing bounds and hotel constraints get set. Capturing those
 * here means every package rule is traceable to the meeting that set it.
 */

export const MeetingSchema = BaseSchema.extend({
  season: relation,
  kind: MeetingKind,
  title: z.string().min(1),
  held_on: pbDate,
  attendees: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  minutes: z.string().optional().nullable(),
})

/**
 * Structured payload per requirement kind. Kept as one discriminated union so
 * `params` cannot drift from `kind`.
 */
export const RequirementParams = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("quota"), total: z.coerce.number().int().positive() }),
  z.object({
    kind: z.literal("mix"),
    group: QuotaGroup,
    min_pct: z.coerce.number().min(0).max(100).optional().nullable(),
    max_pct: z.coerce.number().min(0).max(100).optional().nullable(),
  }),
  z.object({
    kind: z.literal("pricing"),
    tier: Tier,
    min_sar: z.coerce.number().nonnegative().optional().nullable(),
    max_sar: z.coerce.number().positive().optional().nullable(),
  }),
  z.object({
    kind: z.literal("hotel"),
    hotel: relation,
    rule: z.enum(["must_use", "must_not_use"]),
  }),
  z.object({
    kind: z.literal("window"),
    starts_on: pbDate,
    ends_on: pbDate,
  }),
  z.object({ kind: z.literal("note") }),
])

export const RequirementSchema = BaseSchema.extend({
  season: relation,
  /** Provenance — which meeting produced this. Null for standing rules. */
  meeting: relation.optional().nullable(),
  kind: RequirementKind,
  status: RequirementStatus.default("proposed"),
  title: z.string().min(1),
  detail: z.string().optional().nullable(),
  params: z.unknown().optional().nullable(),
  /** Free-text requirements are signed off by hand before submission. */
  acknowledged: z.boolean().default(false),
})

/** Parse a requirement's `params` against its `kind`. Returns null if absent or invalid. */
export function parseRequirementParams(req: Pick<Requirement, "kind" | "params">) {
  if (req.params == null) return null
  const candidate =
    typeof req.params === "object" && req.params !== null && "kind" in req.params
      ? req.params
      : { ...(req.params as object), kind: req.kind }
  const result = RequirementParams.safeParse(candidate)
  return result.success ? result.data : null
}

/* ── submission to Nusuk ────────────────────────────────────────── */

export const SubmissionSchema = BaseSchema.extend({
  season: relation,
  status: SubmissionStatus.default("preparing"),
  sent_on: pbDate.optional().nullable(),
  sent_by: relation.optional().nullable(),
  /** Package ids included in this batch, in submission order. */
  package_ids: z.array(z.string()).default([]),
  /** Validation snapshot taken at send time — what was known then. */
  issues_snapshot: z.unknown().optional().nullable(),
  response_note: z.string().optional().nullable(),
})

/* ── derived / composed shapes ──────────────────────────────────── */

/** An itinerary with its legs loaded — what the drag editor works on. */
export const ItineraryWithLegsSchema = ItinerarySchema.extend({
  legs: z.array(ItineraryLegSchema),
})

/** A package resolved for display: itinerary, legs and hotels expanded. */
export const PackageDetailSchema = PackageSchema.extend({
  itinerary: ItineraryWithLegsSchema,
  content: PackageContentSchema.optional().nullable(),
  media: z.array(PackageMediaSchema).default([]),
})

/* ── types ──────────────────────────────────────────────────────── */

export type Season = z.infer<typeof SeasonSchema>
export type Hotel = z.infer<typeof HotelSchema>
export type Camp = z.infer<typeof CampSchema>
export type Itinerary = z.infer<typeof ItinerarySchema>
export type ItineraryLeg = z.infer<typeof ItineraryLegSchema>
export type ItineraryWithLegs = z.infer<typeof ItineraryWithLegsSchema>
export type Package = z.infer<typeof PackageSchema>
export type PackageContent = z.infer<typeof PackageContentSchema>
export type PackageMedia = z.infer<typeof PackageMediaSchema>
export type PackageDetail = z.infer<typeof PackageDetailSchema>
export type Meeting = z.infer<typeof MeetingSchema>
export type Requirement = z.infer<typeof RequirementSchema>
export type RequirementParamsValue = z.infer<typeof RequirementParams>
export type Submission = z.infer<typeof SubmissionSchema>

export type CityValue = z.infer<typeof City>
export type TierValue = z.infer<typeof Tier>
export type LegRoleValue = z.infer<typeof LegRole>

/**
 * The five categories the platform displays, rebuilt from the three flags we
 * store. Kept as a function so the string never drifts from the itinerary.
 */
export function displayCategory(pkg: Pick<Package, "tier" | "is_shifting" | "variant_suffix">) {
  const base = pkg.tier === "luxury" ? "Luxury" : pkg.tier === "premium" ? "Premium" : "Standard"
  const parts = [base]
  if (pkg.is_shifting) parts.push("Shifting")
  if (pkg.variant_suffix) parts.push(pkg.variant_suffix)
  return parts.join(" ")
}
