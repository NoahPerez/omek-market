import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { CreateInventoryItemInput } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createSellerInventoryItemsWorkflow } from "@mercurjs/core/workflows/inventory-item/workflows/create-seller-inventory-items"

import { sanitizeInventoryItem, refetchInventoryItem } from "./helpers"

type SellerScopedRequest<T = unknown> = AuthenticatedMedusaRequest<T> & {
  seller_context: {
    seller_id: string
  }
}

export async function GET(req: SellerScopedRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: inventoryItems, metadata } = await query.graph({
    entity: "inventory_item",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    inventory_items: inventoryItems.map((item) =>
      sanitizeInventoryItem(item as Record<string, unknown> & { offers?: Array<Record<string, unknown> | null> | null })
    ),
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export async function POST(req: SellerScopedRequest, res: MedusaResponse) {
  const sellerId = req.seller_context.seller_id
  const { result } = await createSellerInventoryItemsWorkflow(req.scope).run({
    input: {
      seller_id: sellerId,
      inventory_items: [req.validatedBody as CreateInventoryItemInput],
    },
  })

  const inventoryItem = await refetchInventoryItem(
    result[0].id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ inventory_item: inventoryItem })
}
