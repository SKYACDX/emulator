import { z } from "zod";
import { REPORT_REASONS } from "@/lib/fileReports";
import { isValidHexColor } from "@/lib/themes";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  username: z
    .string()
    .trim()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(24, "El nombre de usuario debe tener como máximo 24 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const createHackSchema = z.object({
  platformSlug: z.string().min(1, "Selecciona una plataforma"),
  gameTitle: z.string().trim().min(1, "El nombre del juego es obligatorio").max(120),
  hackTitle: z.string().trim().min(1, "El título del hack es obligatorio").max(120),
  description: z.string().trim().min(1, "La descripción es obligatoria").max(5000),
  version: z.string().trim().min(1, "La versión es obligatoria").max(30),
  releaseNotes: z.string().trim().max(5000).optional().default(""),
});

export const addPatchSchema = z.object({
  hackId: z.string().min(1),
  version: z.string().trim().min(1, "La versión es obligatoria").max(30),
  releaseNotes: z.string().trim().max(5000).optional().default(""),
});

export const presignFileSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive(),
  contentType: z.string().trim().min(1).max(255),
});

export const createSharedFileSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(120),
  description: z.string().trim().max(5000).optional().default(""),
  storedName: z.string().trim().min(1),
  originalName: z.string().trim().min(1).max(255),
  isPublic: z.boolean().optional().default(true),
  platformSlug: z.string().trim().max(30).optional(),
  gameTitle: z.string().trim().max(120).optional(),
  coverImageUrl: z.string().trim().url().max(500).optional(),
});

export const reportFileSchema = z
  .object({
    reason: z.enum(REPORT_REASONS),
    details: z.string().trim().max(500).optional().default(""),
  })
  .refine((data) => data.reason !== "Otro" || data.details.length > 0, {
    message: "Describe el motivo",
    path: ["details"],
  });

const hexColorSchema = z.string().refine(isValidHexColor, "Color inválido");

export const presignSaveSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive(),
  contentType: z.string().trim().min(1).max(255),
});

export const createSaveSchema = z.object({
  gameKey: z.string().trim().min(1, "Falta el identificador del juego").max(200),
  slot: z.number().int().min(0).max(99).optional().default(0),
  storedName: z.string().trim().min(1),
  originalName: z.string().trim().min(1).max(255),
});

export const createCommunityThemeSchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre al tema").max(60),
  bg: hexColorSchema,
  surface: hexColorSchema,
  accent: hexColorSchema,
  text: hexColorSchema,
});

const emulatorThemePaletteSchema = z.object({
  shellBackground: hexColorSchema,
  shellBorder: hexColorSchema,
  screenBezel: hexColorSchema,
  dpadColor: hexColorSchema,
  actionButtonColor: hexColorSchema,
  shoulderButtonColor: hexColorSchema,
});

const emulatorThemePresetsSchema = z.object({
  dpad: z.string().trim().min(1).max(60),
  actionButtons: z.string().trim().min(1).max(60),
  shoulderButtons: z.string().trim().min(1).max(60),
});

export const createEmulatorThemeSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Falta el slug")
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "El slug solo puede tener minúsculas, números y guiones"),
  name: z.string().trim().min(1, "Ponle un nombre al tema").max(80),
  system: z.string().trim().min(1, "Falta el sistema"),
  palette: emulatorThemePaletteSchema,
  presets: emulatorThemePresetsSchema,
  public: z.boolean().optional().default(true),
});

export const updateEmulatorThemeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  palette: emulatorThemePaletteSchema.optional(),
  presets: emulatorThemePresetsSchema.optional(),
  public: z.boolean().optional(),
});

export const updateAppListingSchema = z.object({
  tagline: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(20000).optional(),
  features: z.array(z.string().trim().min(1).max(300)).max(50).optional(),
});

export const createAppReleaseSchema = z.object({
  version: z.string().trim().min(1).max(30),
  versionCode: z.number().int().positive(),
  changelog: z.string().trim().max(10000).optional().default(""),
  minAndroidSdk: z.number().int().positive(),
});

export const presignAppAssetSchema = z.object({
  slot: z.string().trim().min(1).max(60), // "icon" | "screenshot" | "apk:<releaseId>"
  filename: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive(),
  contentType: z.string().trim().min(1).max(255),
});

export const registerAppAssetSchema = z.object({
  slot: z.string().trim().min(1).max(60),
  storedName: z.string().trim().min(1),
  originalName: z.string().trim().min(1).max(255),
});

export const createAppFeedbackSchema = z.object({
  body: z.string().trim().min(1, "Escribe algo").max(2000),
  deviceInfo: z.string().trim().max(200).optional(),
  appVersion: z.string().trim().max(50).optional(),
  imageKey: z.string().trim().min(1).optional(),
  guestName: z.string().trim().max(60).optional(),
});

export const createContactMessageSchema = z.object({
  name: z.string().trim().min(1, "Falta tu nombre").max(120),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  subject: z.string().trim().min(1, "Falta el asunto").max(200),
  body: z.string().trim().min(1, "Escribe tu mensaje").max(5000),
});
