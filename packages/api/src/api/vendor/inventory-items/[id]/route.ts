import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { InventoryTypes } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import {
  deleteInventoryItemWorkflow,
  updateInventoryItemsWorkflow,
} from "@medusajs/core-flows"

import { refetchInventoryItem, validateSellerInventoryItem } from "../helpers"

type SellerScopedRequest<T = unknown> = AuthenticatedMedusaRequest<T> & {
  seller_context: {
    seller_id: string
  }
}

export async function GET(req: SellerScopedRequest, res: MedusaResponse) {
  const { id } = req.params

  await validateSellerInventoryItem(req.scope, req.seller_context.seller_id, id)

  const inventoryItem = await refetchInventoryItem(
    id,
    req.scope,
    req.queryConfig.fields
  )

  if (!inventoryItem) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inventory item with id: ${id} was not found`
    )
  }

  res.json({ inventory_item: inventoryItem })
}

export async function POST(req: SellerScopedRequest, res: MedusaResponse) {
  const { id } = req.params

  await validateSellerInventoryItem(req.scope, req.seller_context.seller_id, id)
  const { id: _ignoredId, ...updateData } =
    req.validatedBody as InventoryTypes.UpdateInventoryItemInput & { id?: string }

  await updateInventoryItemsWorkflow(req.scope).run({
    input: {
      updates: [
        {
          ...updateData,
          id,
        },
      ],
    },
  })

  const inventoryItem = await refetchInventoryItem(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ inventory_item: inventoryItem })
}

export async function DELETE(req: SellerScopedRequest, res: MedusaResponse) {
  const { id } = req.params

  await validateSellerInventoryItem(req.scope, req.seller_context.seller_id, id)

  await deleteInventoryItemWorkflow(req.scope).run({
    input: [id],
  })

  res.json({
    id,
    object: "inventory_item",
    deleted: true,
  })
}
