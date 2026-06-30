"use client"

import { useParams } from "next/navigation"
import { PoiDetailClient } from "./poi-detail-client"

export default function PoiDetailPage() {
  const params = useParams<{ id: string }>()
  return <PoiDetailClient id={params?.id ?? ""} />
}
