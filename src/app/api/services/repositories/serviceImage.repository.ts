import { connectDb } from "@/lib/db/connect";
import { ServiceImage } from "@/lib/db/models/ServiceImage";
import { deleteFromDigitalOceanSpaces } from "@/lib/storage/doSpaces";

export class ServiceImageRepository {
  /**
   * Saves a new image document in MongoDB
   */
  static async createImage(data: {
    serviceId: string;
    clientId?: string;
    ipfsHash: string;
    url: string;
    type: "service" | "pre" | "post";
    isPrivate: boolean;
    filename?: string;
    mimeType?: string;
    size?: number;
  }) {
    await connectDb();
    return ServiceImage.create(data);
  }

  /**
   * Retrieves all images associated with a service
   */
  static async getImagesByService(serviceId: string) {
    await connectDb();
    return ServiceImage.find({ serviceId }).sort({ createdAt: 1 });
  }

  /**
   * Deletes an image document from MongoDB and DigitalOcean Spaces
   */
  static async deleteImage(id: string) {
    await connectDb();
    
    // Find the image document first
    const imageDoc = await ServiceImage.findById(id);
    if (!imageDoc) {
      throw new Error("Image profile not found in database.");
    }

    // Attempt deletion from DigitalOcean Spaces
    try {
      if (imageDoc.ipfsHash) {
        await deleteFromDigitalOceanSpaces(imageDoc.ipfsHash);
      }
    } catch (err: any) {
      console.error(`[ServiceImageRepository.deleteImage Storage Delete Warn]: ${err.message}`);
    }

    // Delete image document from DB
    await ServiceImage.findByIdAndDelete(id);
    return imageDoc;
  }
}
