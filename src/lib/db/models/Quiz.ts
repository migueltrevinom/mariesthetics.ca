import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const QuizOptionSchema = new Schema({
  optionId: { type: String, required: true },
  optionText: { type: String, required: true },
  icon: { type: String, default: "✨" },
  recommendedServiceId: { type: Schema.Types.ObjectId, ref: "Service", default: null },
  scoreWeight: { type: Number, default: 1 },
});

const QuizQuestionSchema = new Schema({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  subtitle: { type: String, default: "" },
  order: { type: Number, default: 0 },
  options: [QuizOptionSchema],
});

const QuizSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    questions: [QuizQuestionSchema],
    createdById: { type: Schema.Types.ObjectId, ref: "Manager", default: null },
  },
  { timestamps: true }
);

export type QuizDoc = InferSchemaType<typeof QuizSchema> & {
  _id: Types.ObjectId;
};

export const Quiz = models.Quiz || model("Quiz", QuizSchema);
