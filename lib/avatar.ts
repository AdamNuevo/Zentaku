export type AvatarCategory = "all" | "anime" | "cyber" | "retro" | "creatures";

export type AvatarPreset = {
  id: string;
  name: string;
  category: "anime" | "cyber" | "retro" | "creatures";
  seed: string;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  // Anime & Manga inspired
  { id: "shinobi", name: "Shinobi", category: "anime", seed: "Shinobi" },
  { id: "samurai", name: "Samurai", category: "anime", seed: "Samurai" },
  { id: "kenshin", name: "Kenshin", category: "anime", seed: "Kenshin" },
  { id: "ronin", name: "Ronin", category: "anime", seed: "Ronin" },
  { id: "valkyrie", name: "Valkyrie", category: "anime", seed: "Valkyrie" },
  { id: "sakura", name: "Sakura", category: "anime", seed: "Sakura" },
  { id: "spike", name: "Spike", category: "anime", seed: "Spike" },
  { id: "akira", name: "Akira", category: "anime", seed: "Akira" },

  // Cyber & Sci-Fi
  { id: "cyberpunk", name: "Cyber", category: "cyber", seed: "Cyberpunk" },
  { id: "neon", name: "Neon", category: "cyber", seed: "Neon" },
  { id: "mecha", name: "Mecha", category: "cyber", seed: "Mecha" },
  { id: "glitch", name: "Glitch", category: "cyber", seed: "Glitch" },
  { id: "astro", name: "Astro", category: "cyber", seed: "Astro" },
  { id: "zero", name: "Zero", category: "cyber", seed: "Zero" },

  // Retro Gaming
  { id: "pixel-boy", name: "Pixel Boy", category: "retro", seed: "PixelBoy" },
  { id: "pixel-girl", name: "Pixel Girl", category: "retro", seed: "PixelGirl" },
  { id: "arcade", name: "Arcade", category: "retro", seed: "Arcade" },
  { id: "knight", name: "Knight", category: "retro", seed: "Knight" },
  { id: "rogue", name: "Rogue", category: "retro", seed: "Rogue" },
  { id: "mage", name: "Mage", category: "retro", seed: "Mage" },

  // Creatures & Companions
  { id: "neko", name: "Neko", category: "creatures", seed: "PixelCat" },
  { id: "kitsune", name: "Kitsune", category: "creatures", seed: "Kitsune" },
  { id: "ghost", name: "Ghost", category: "creatures", seed: "Ghost" },
  { id: "dragon", name: "Dragon", category: "creatures", seed: "Dragon" },
];

export function getDicebearPixelUrl(seed: string): string {
  const cleanSeed = encodeURIComponent(seed.trim() || "Zentaku");
  return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${cleanSeed}`;
}

export function resolveAvatarUrl(
  userPhotoURL?: string | null,
  customAvatar?: string | null
): string | null {
  return customAvatar || userPhotoURL || null;
}
