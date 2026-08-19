import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

type QueryLike = {
  graph: (input: {
    entity: string
    fields: string[]
    filters: Record<string, unknown>
  }) => Promise<{ data: Array<Record<string, unknown>> }>
}

type ScopeLike = {
  resolve: (key: string) => QueryLike
}

type InventoryItemLike = Record<string, unknown> & {
  offers?: Array<Record<string, unknown> | null> | null
}

export const refetchInventoryItem = async (
  inventoryItemId: string,
  scope: ScopeLike,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [inventoryItem],
  } = await query.graph({
    entity: "inventory_item",
    filters: { id: inventoryItemId },
    fields,
  })

  return sanitizeInventoryItem((inventoryItem as InventoryItemLike | undefined) ?? null)
}

export const validateSellerInventoryItem = async (
  scope: ScopeLike,
  sellerId: string,
  inventoryItemId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerInventoryItem],
  } = await query.graph({
    entity: "inventory_item_seller",
    filters: {
      seller_id: sellerId,
      inventory_item_id: inventoryItemId,
    },
    fields: ["seller_id"],
  })

  if (!sellerInventoryItem) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inventory item with id: ${inventoryItemId} was not found`
    )
  }
}

export const sanitizeInventoryItem = <T extends InventoryItemLike | null>(
  inventoryItem: T
): T => {
  if (!inventoryItem) {
    return inventoryItem
  }

  const offers = Array.isArray(inventoryItem.offers)
    ? inventoryItem.offers.filter(
        (offer): offer is Record<string, unknown> => Boolean(offer)
      )
    : inventoryItem.offers

  return {
    ...inventoryItem,
    offers,
  } as T
}
