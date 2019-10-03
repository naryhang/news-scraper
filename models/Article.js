var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: "This article has already been scraped"
    },
    link: {
        type: String
    },
    description: {
        type: String
    },
    saved: {
        type: Boolean,
        default: false
    },
    notes: [
        {
        type: Schema.Types.ObjectId,
        ref: "Note"
        }
    ]
});

var Article = mongoose.model("Article", ArticleSchema);


module.exports = Article;