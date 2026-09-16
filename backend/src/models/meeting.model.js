import mongoose, { Schema } from "mongoose";


const meetingSchema = new Schema(
    {
        user_id: { type: String },
        meetingCode: { type: String, required: true },
        date: { type: Date, default: Date.now, required: true }
    }
)

meetingSchema.index({ user_id: 1, date: -1 });

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };