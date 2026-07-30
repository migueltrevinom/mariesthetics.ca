import { NextResponse } from "next/server";
import {
  getProductsList,
  getProductsByService,
  createNewProduct,
  updateExistingProduct,
  removeProduct,
  autoGenerateServiceProducts,
} from "../modules/product.module";

export async function handleGetProducts(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    let products;
    if (serviceId) {
      products = await getProductsByService(serviceId);
    } else {
      products = await getProductsList();
    }
    return NextResponse.json({ products });
  } catch (err: any) {
    console.error("[Product Controller GET Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function handleCreateProduct(
  req: Request,
  validatedData: any
): Promise<NextResponse> {
  try {
    const product = await createNewProduct(validatedData);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    console.error("[Product Controller Create Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to create product" }, { status: 500 });
  }
}

export async function handleUpdateProduct(
  req: Request,
  validatedData: any,
  params?: { id?: string }
): Promise<NextResponse> {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }
    const product = await updateExistingProduct(id, validatedData);
    return NextResponse.json({ product });
  } catch (err: any) {
    console.error("[Product Controller Update Error]:", err.message);
    const status = err.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: err.message || "Failed to update product" }, { status });
  }
}

export async function handleDeleteProduct(
  req: Request,
  params?: { id?: string }
): Promise<NextResponse> {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }
    const product = await removeProduct(id);
    return NextResponse.json({ product, message: "Product deleted successfully" });
  } catch (err: any) {
    console.error("[Product Controller Delete Error]:", err.message);
    const status = err.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: err.message || "Failed to delete product" }, { status });
  }
}

export async function handleGenerateServiceProducts(
  req: Request,
  validatedData: { serviceId: string }
): Promise<NextResponse> {
  try {
    const result = await autoGenerateServiceProducts(validatedData.serviceId);
    return NextResponse.json({
      message: `Generated ${result.products.length} product variants for ${result.service.name}`,
      products: result.products,
    });
  } catch (err: any) {
    console.error("[Product Controller Generate Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to generate products" }, { status: 500 });
  }
}
