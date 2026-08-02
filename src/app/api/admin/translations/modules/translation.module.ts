import { translationRepository } from "../repositories/translation.repository";
import { TranslationDoc } from "@/lib/db/models/Translation";

export async function getAllTranslations(): Promise<TranslationDoc[]> {
  return translationRepository.findAll();
}

export async function getTranslationsByPage(page: string): Promise<TranslationDoc[]> {
  return translationRepository.findByPage(page);
}

export async function saveTranslation(data: {
  page: string;
  key: string;
  translations: {
    en?: string;
    tl?: string;
    pa?: string;
    ar?: string;
    es?: string;
  };
  updatedBy?: string;
}): Promise<TranslationDoc> {
  return translationRepository.upsertTranslation(data);
}

export async function seedTranslations(
  items: Array<{
    page: string;
    key: string;
    translations: {
      en?: string;
      tl?: string;
      pa?: string;
      ar?: string;
      es?: string;
    };
  }>
): Promise<number> {
  return translationRepository.seedDefaultTranslations(items);
}

export async function deleteTranslationById(id: string): Promise<boolean> {
  return translationRepository.deleteTranslation(id);
}
