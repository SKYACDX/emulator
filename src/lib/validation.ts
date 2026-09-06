import { z } from "zod";
import { REPORT_REASONS } from "@/lib/fileReports";

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
