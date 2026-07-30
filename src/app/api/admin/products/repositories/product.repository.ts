import { connectDb } from "@/lib/db/connect";
import { Product } from "@/lib/db/models";

export class ProductRepository {
  static async findAllProducts() {
    await connectDb();
    return Product.find().sort({ createdAt: -1 }).populate("serviceId").lean();
  }

  static async findProductById(id: string) {
    await connectDb();
    return Product.findById(id).populate("serviceId").lean();
  }

  static async findProductsByServiceId(serviceId: string) {
    await connectDb();
    return Product.find({ serviceId }).sort({ priceCents: 1 }).lean();
  }

  static async createProduct(data: any) {
    await connectDb();
    return Product.create(data);
  }

  static async updateProduct(id: string, data: any) {
    await connectDb();
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  static async deleteProduct(id: string) {
    await connectDb();
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }
}
