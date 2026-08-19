"use client"

import { SellerInfo } from "@/components/molecules"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import {
  getBuyboxWinner,
  getVariantOffers,
  StoreOffer,
} from "@/lib/helpers/buybox"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { HttpTypes } from "@medusajs/types"

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce(
    (
      acc: Record<string, string>,
      varopt: HttpTypes.StoreProductOptionValue
    ) => {
      acc[varopt.option?.title.toLowerCase() || ""] = varopt.value

      return acc
    },
    {}
  )
}

export const ProductDetailsSeller = ({
  product,
  offers = [],
  preferredSellerId,
}: {
  product: HttpTypes.StoreProduct
  offers?: StoreOffer[]
  preferredSellerId?: string
}) => {
  const { allSearchParams } = useGetAllSearchParams()

  const { cheapestVariant, cheapestPrice } = getProductPrice({
    product,
  })

  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  const selectedVariant = hasAnyPrice
    ? {
        ...optionsAsKeymap(cheapestVariant.options ?? null),
        ...allSearchParams,
      }
    : allSearchParams

  const variantId =
    product.variants?.find(({ options }: { options: any }) =>
      options?.every((option: any) =>
        selectedVariant[option.option?.title.toLowerCase() || ""]?.includes(
          option.value
        )
      )
    )?.id || ""

  const variantOffers = getVariantOffers(offers, variantId)
  const preferredOffer =
    variantOffers.find((offer) => offer.seller?.id === preferredSellerId)
  const activeSeller = (preferredOffer ?? getBuyboxWinner(variantOffers))?.seller

  if (!activeSeller) return null

  return (
    <div className="border rounded-sm">
      <div>
        <div className="flex justify-between">
          <SellerInfo
            seller={activeSeller}
            showArrow
            bottomBorder
            showReviews={false}
          />
        </div>
      </div>
    </div>
  )
}
