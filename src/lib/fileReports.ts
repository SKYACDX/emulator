export const REPORT_REASONS = [
  "Contenido para adultos / sexual explícito",
  "Es una ROM completa u otro contenido con copyright no permitido",
  "Contenido violento o perturbador",
  "Spam o publicidad",
  "Malware o archivo dañino",
  "Otro",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
