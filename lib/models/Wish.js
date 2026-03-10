import mongoose from "mongoose";

const WishSchema = new mongoose.Schema({
    senderName: {
        type: String,
        required: true,
    },
    creator: {
        type: String,
    },
    receiverName: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    mode: {
        type: String,
        required: true,
        enum: ["simple", "fixed", "challenge"],
    },
    amount: {
        type: Number,
    },
    questions: {
        type: Array,
    },
    isClaimed: {
        type: Boolean,
        default: false,
    },
    score: {
        type: Number,
        default: 0,
    },
    bankDetails: {
        accountTitle: String,
        accountNumber: String,
        bankName: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Wish || mongoose.model("Wish", WishSchema);
