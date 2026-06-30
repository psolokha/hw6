import type {
  CategoryDTO,
  FavoritesEntryDTO,
  Id,
  LatLng,
  LocationSelectionDTO,
  LocationSuggestionDTO,
  PoiDTO,
  RouteVariantDTO,
} from '@/data/types'

export type RequestOptions = {
  signal?: AbortSignal
}

export type GetPoisParams =
  | { by: 'location'; location: LocationSelectionDTO; categoryIds?: Id[] }
  | { by: 'nearby'; center: LatLng; radiusMeters: number; categoryIds?: Id[] }

export type BuildRoutesParams = {
  start: LatLng
  pois: PoiDTO[]
  targetDistanceKm: number
  maxVariants?: 1 | 2 | 3
}

export interface NavigatorDataSource {
  searchLocations(query: string, opts?: RequestOptions): Promise<LocationSuggestionDTO[]>

  getCategories(opts?: RequestOptions): Promise<CategoryDTO[]>

  getPois(params: GetPoisParams, opts?: RequestOptions): Promise<PoiDTO[]>

  buildRouteVariants(params: BuildRoutesParams, opts?: RequestOptions): Promise<RouteVariantDTO[]>

  getFavorites(opts?: RequestOptions): Promise<FavoritesEntryDTO[]>
  saveFavorite(entry: FavoritesEntryDTO, opts?: RequestOptions): Promise<void>
  removeFavorite(id: Id, opts?: RequestOptions): Promise<void>
}

