import { ProductDetailsPage } from "@/components/sections"
import { listProducts } from "@/lib/data/products"
import { generateProductMetadata } from "@/lib/helpers/seo"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params

  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
  }).then(({ response }) => response.products[0])

  return generateProductMetadata(prod, locale)
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string; locale: string }>
  searchParams: Promise<{ seller_id?: string }>
}) {
  const { handle, locale } = await params
  const { seller_id } = await searchParams

  return (
    <main className="container">
      <ProductDetailsPage
        handle={handle}
        locale={locale}
        preferredSellerId={seller_id}
      />
    </main>
  )
}
