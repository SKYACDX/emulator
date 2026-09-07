import type { EmulatorTheme } from "@/generated/prisma/client";

type EmulatorThemeWithAuthor = EmulatorTheme & { author: { username: string } };

// Matches docs/themes-api.md's Theme shape exactly. `assets` is always all
// null in v1 — there's no column for it yet (see the schema comment).
export function serializeEmulatorTheme(theme: EmulatorThemeWithAuthor) {
  return {
    id: theme.id,
    slug: theme.slug,
    name: theme.name,
    system: theme.system,
    author: theme.author.username,
    createdAt: theme.createdAt.toISOString(),
    updatedAt: theme.updatedAt.toISOString(),
    downloads: theme.downloads,
    public: theme.isPublic,
    palette: {
      shellBackground: theme.shellBackground,
      shellBorder: theme.shellBorder,
      screenBezel: theme.screenBezel,
      dpadColor: theme.dpadColor,
      actionButtonColor: theme.actionButtonColor,
      shoulderButtonColor: theme.shoulderButtonColor,
    },
    presets: {
      dpad: theme.dpadPreset,
      actionButtons: theme.actionButtonsPreset,
      shoulderButtons: theme.shoulderButtonsPreset,
    },
    assets: {
      shellBackground: null,
      dpad: null,
      buttonA: null,
      buttonB: null,
      buttonX: null,
      buttonY: null,
      buttonL: null,
      buttonR: null,
    },
  };
}
