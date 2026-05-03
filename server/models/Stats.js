import mongoose from "mongoose"

const statsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sureOkumaSayilari: { type: Map, of: Number, default: {} },  // örn: "1": 5
  ayetOkumaSayilari: { type: Map, of: Number, default: {} }   // örn: "1_1": 3
}, { timestamps: true })

export default mongoose.model("Stats", statsSchema)
