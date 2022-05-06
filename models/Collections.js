const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const collectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: false
    },
    contractAddress: {
      type: String,
      required: true,
      index: true,
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    tokenType: {
      type: String,
      required: true,
    },
    nftId: {
      type: String,
      required: true,
      index: true,
    },
    original: {
      type: Boolean,
      default: true,
    },
    chainId: {
      type: Number,
      required: true,
      index: true,
    },
    royalty: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

collectionSchema.index({ contractAddress: 1, chainId: 1}, { unique: true });

const Collection = (module.exports = mongoose.model("Collection", collectionSchema));
