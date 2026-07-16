import { handleUploadImage, handleDeleteImage } from "../controllers/imagesController";
import { withManagerAuth } from "@/lib/auth/jwt";

export const POST = withManagerAuth(handleUploadImage);
export const DELETE = withManagerAuth(handleDeleteImage);
