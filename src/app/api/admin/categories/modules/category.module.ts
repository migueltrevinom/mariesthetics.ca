import { CategoryRepository } from "../repositories/category.repository";

export async function getAllCategories() {
  return CategoryRepository.findAll();
}

export async function getActiveCategories() {
  return CategoryRepository.findActive();
}

export async function saveCategory(data: {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  active?: boolean;
  sortOrder?: number;
  imageUrl?: string;
}) {
  return CategoryRepository.upsertCategory(data);
}

export async function removeCategory(id: string) {
  return CategoryRepository.deleteCategory(id);
}
