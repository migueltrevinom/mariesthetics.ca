import { Schema, models, model, type InferSchemaType, type Types } from "mongoose";

const QuizAnswerItemSchema = new Schema({
  questionId: { type: String, required: true },
  optionId: { type: String, required: true },
  selectedText: { type: String, default: "" },
});

const QuizSubmissionSchema = new Schema(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null, index: true },
    guest: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    answers: [QuizAnswerItemSchema],
    recommendedServiceId: { type: Schema.Types.ObjectId, ref: "Service", required: true, index: true },
    convertedToBooking: { type: Boolean, default: false, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export type QuizSubmissionDoc = InferSchemaType<typeof QuizSubmissionSchema> & {
  _id: Types.ObjectId;
};

export const QuizSubmission =
  models.QuizSubmission || model("QuizSubmission", QuizSubmissionSchema);
