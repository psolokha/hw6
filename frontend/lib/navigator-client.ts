import { HttpNavigatorDataSource } from "@/data/http/httpDataSource"

let instance: HttpNavigatorDataSource | null = null

export function getNavigatorDataSource(): HttpNavigatorDataSource {
  if (!instance) {
    instance = new HttpNavigatorDataSource()
  }
  return instance
}
