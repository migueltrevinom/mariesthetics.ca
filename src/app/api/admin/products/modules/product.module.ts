import { ProductRepository } from "../repositories/product.repository";
import { Service } from "@/lib/db/models";
import { connectDb } from "@/lib/db/connect";

export async function getProductsList() {
  return ProductRepository.findAllProducts();
}

export async function getProductDetails(id: string) {
  const product = await ProductRepository.findProductById(id);
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
}

export async function createNewProduct(data: any) {
  return ProductRepository.createProduct(data);
}

export async function updateExistingProduct(id: string, data: any) {
  return ProductRepository.updateProduct(id, data);
}

export async function removeProduct(id: string) {
  return ProductRepository.deleteProduct(id);
}

export async function autoGenerateServiceProducts(serviceId: string) {
  await connectDb();
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new Error("Service not found");
  }

  // 1. Full Payment Product
  const fullPayment = await ProductRepository.createProduct({
    name: `${service.name} - Full Payment`,
    description: `Full upfront payment for ${service.name}`,
    kind: "full_payment",
    priceCents: service.priceCents,
    serviceId: service._id,
    active: true,
  });

  // 2. Deposit Product
  const depositProduct = await ProductRepository.createProduct({
    name: `${service.name} - Deposit`,
    description: `Required reservation deposit for ${service.name}`,
    kind: "deposit",
    priceCents: service.depositCents,
    serviceId: service._id,
    active: true,
  });

  // 3. Balance Product (Remaining balance after deposit)
  const remainingBalanceCents = Math.max(0, service.priceCents - service.depositCents);
  const balanceProduct = await ProductRepository.createProduct({
    name: `${service.name} - Remaining Balance`,
    description: `Remaining balance settled after ${service.name} appointment`,
    kind: "balance",
    priceCents: remainingBalanceCents,
    serviceId: service._id,
    active: true,
  });

  return {
    service,
    products: [fullPayment, depositProduct, balanceProduct],
  };
}
