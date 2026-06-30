export type Id = string;

export type LatLng = {
  lat: number;
  lng: number;
};

export type DistanceMeters = number;

export type LocationSuggestionDTO = {
  id: Id;
  title: string;
  subtitle?: string | undefined;
  center?: LatLng | undefined;
};

export type CategoryDTO = {
  id: Id;
  title: string;
};

export type PoiDTO = {
  id: Id;
  title: string;
  description?: string | undefined;
  categories: CategoryDTO["id"][];
  location: LatLng;
  photoUrl?: string | undefined;
  externalUrl?: string | undefined;
};

export type RouteStopDTO = {
  order: number;
  poi: PoiDTO;
};

export type RouteVariantKind = "shorter" | "near" | "longer";

export type RouteVariantDTO = {
  id: Id;
  kind: RouteVariantKind;
  totalDistanceMeters: DistanceMeters;
  stops: RouteStopDTO[];
  isLoop: true;
  start: LatLng;
};

export type FavoritesEntryDTO =
  | {
      type: "poi";
      id: Id;
      createdAtIso: string;
      poi: PoiDTO;
    }
  | {
      type: "route";
      id: Id;
      createdAtIso: string;
      route: RouteVariantDTO;
      title?: string | undefined;
    };
