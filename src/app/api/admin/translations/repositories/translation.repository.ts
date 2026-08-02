import { connectDb } from "@/lib/db/connect";
import { TranslationModel, TranslationDoc } from "@/lib/db/models/Translation";

export class TranslationRepository {
  async findAll(): Promise<TranslationDoc[]> {
    await connectDb();
    return TranslationModel.find({}).sort({ page: 1, key: 1 }).exec();
  }

  async findByPage(page: string): Promise<TranslationDoc[]> {
    await connectDb();
    return TranslationModel.find({ page }).sort({ key: 1 }).exec();
  }

  async upsertTranslation(data: {
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
    await connectDb();
    return TranslationModel.findOneAndUpdate(
      { page: data.page, key: data.key },
      {
        $set: {
          translations: data.translations,
          updatedBy: data.updatedBy,
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    ).exec();
  }

  async seedDefaultTranslations(
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
    await connectDb();
    let count = 0;
    for (const item of items) {
      await TranslationModel.updateOne(
        { page: item.page, key: item.key },
        {
          $setOnInsert: {
            page: item.page,
            key: item.key,
            translations: item.translations,
          },
        },
        { upsert: true }
      );
      count++;
    }
    return count;
  }

  async deleteTranslation(id: string): Promise<boolean> {
    await connectDb();
    const res = await TranslationModel.findByIdAndDelete(id).exec();
    return res !== null;
  }
}

export const translationRepository = new TranslationRepository();
