import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { AdditionalData } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  enrichProductAttributes,
  wrapProductVariantsWithOffers,
} from "@mercurjs/core/api/utils/index"
import { createProductsWorkflow } from "@mercurjs/core/workflows/product/workflows/create-products"
import {
  ProductChangeActionType,
  type CreateProductDTO,
} from "@mercurjs/types"
import type {
  VendorCreateProductType,
  VendorGetProductsParamsType,
} from "@mercurjs/core/api/vendor/products/validators"

type SellerScopedRequest<T = unknown> = AuthenticatedMedusaRequest<T> & {
  seller_context: {
    seller_id: string
  }
}

const getSellerManagedProductIds = async (
  req: SellerScopedRequest,
  sellerId: string
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const [
    { data: sellerLinks },
    { data: createdActions },
    { data: sellerOffers },
  ] = await Promise.all([
    query.graph({
      entity: "product_seller",
      fields: ["product_id"],
      filters: { seller_id: sellerId },
    }),
    query.graph({
      entity: "product_change_action",
      fields: ["product_id"],
      filters: {
        action: ProductChangeActionType.PRODUCT_ADD,
        product_change: { created_by: sellerId },
      },
    }),
    query.graph({
      entity: "offer",
      fields: ["product_id"],
      filters: { seller_id: sellerId },
    }),
  ])

  return Array.from(
    new Set(
      [...sellerLinks, ...createdActions, ...sellerOffers]
        .map(({ product_id }) => product_id)
        .filter((id): id is string => Boolean(id))
    )
  )
}

export async function GET(
  req: SellerScopedRequest<VendorGetProductsParamsType>,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context.seller_id
  const managedProductIds = await getSellerManagedProductIds(req, sellerId)
  const existingAnd = Array.isArray(req.filterableFields?.$and)
    ? req.filterableFields.$and
    : []

  req.filterableFields = {
    ...req.filterableFields,
    $and: [
      ...existingAnd,
      { id: managedProductIds.length ? managedProductIds : ["__none__"] },
    ],
  }

  const withOffers = req.queryConfig.fields.some((field: string) =>
    field.includes("variants.offers")
  )

  if (withOffers) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field: string) => !field.includes("variants.offers")
    )
  }

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  await enrichProductAttributes(req.scope, products)

  if (withOffers) {
    await wrapProductVariantsWithOffers(req.scope, products, sellerId)
  }

  res.json({
    products,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export async function POST(
  req: SellerScopedRequest<VendorCreateProductType & AdditionalData>,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context.seller_id
  const { additional_data, ...rawPayload } =
    req.validatedBody as CreateProductDTO & AdditionalData
  const payload = rawPayload as CreateProductDTO

  const productInput = {
    ...payload,
    seller_ids: [sellerId],
    status: payload.status ?? ProductStatus.PROPOSED,
  }

  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [productInput],
      created_by: sellerId,
      additional_data,
    },
  })

  const createdId = result[0].id

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: createdId },
  })

  await enrichProductAttributes(req.scope, [product])

  res.status(201).json({ product })
}
