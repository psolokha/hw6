import type { CategoryDTO, Id } from "./contracts.js";

export const CATEGORIES: CategoryDTO[] = [
  { id: "culture", title: "Культура" },
  { id: "history", title: "История" },
  { id: "nature", title: "Природа" },
  { id: "architecture", title: "Архитектура" },
  { id: "museum", title: "Музей" },
  { id: "food", title: "Еда" },
];

export type OsmTags = Record<string, string | undefined>;

export function inferCategoryIdsFromOsmTags(tags: OsmTags): Id[] {
  const out = new Set<Id>();

  const tourism = tags.tourism;
  const historic = tags.historic;
  const amenity = tags.amenity;
  const leisure = tags.leisure;
  const natural = tags.natural;
  const building = tags.building;

  if (tourism === "museum") out.add("museum");
  if (tourism === "gallery" || tourism === "attraction" || tourism === "artwork") out.add("culture");
  if (historic) out.add("history");

  if (natural || leisure === "park" || leisure === "garden") out.add("nature");

  if (
    building === "cathedral" ||
    building === "church" ||
    building === "palace" ||
    building === "castle" ||
    building === "theatre" ||
    building === "temple" ||
    building === "mosque"
  ) {
    out.add("architecture");
  }

  if (
    amenity === "restaurant" ||
    amenity === "cafe" ||
    amenity === "bar" ||
    amenity === "pub" ||
    amenity === "fast_food"
  ) {
    out.add("food");
  }

  if (out.size === 0) out.add("culture");
  return [...out];
}

