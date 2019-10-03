
var express = require("express");
var bodyParser =  require("body-parser");
var expressHandlebars = require("express-handlebars");
var mongoose = require("mongoose");
var cheerio = require("cheerio");
var request = require("request");
var path = require("path");

var app = express();
var db = require("./models");

app.use(
    bodyParser.urlencoded({
        extended: false
    })
);
app.use(express.static("public"));
app.set('view engine', 'html');

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsScraper";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

var port = process.env.PORT || 3000;

app.get("/articles", function(req, res) {
    db.Article.find({}, function(error, found) {
        if (error) {
            res.json(error);
        } else {
            res.json(found);
        };
    });
});

app.post("/saved/:id", function(req, res) {
    db.Article.update({_id: req.params.id}, {$set: {saved: true}}, function(error, result) {
        if (error) {
            res.json(error);
        } else {
            res.json(result);
        };
    });
});

app.post("/remove/:id", function(req, res) {
    db.Article.update({_id: req.params.id}, {$set: {saved: false}}, function(error, result) {
        if (error) {
            res.json(error);
        } else {
            res.json(result);
        };
    });
});

app.get("/saved", function(req, res) {
    res.sendFile(path.join(__dirname, "public/saved.html"));
});

app.get("/savedArticles", function(req, res) {
    db.Article.find({saved: true}, function(error, found) {
        if (error) {
            res.json(error);
        } else {
            res.json(found);
        };
    });
});

app.get("/note/:id", function(req, res) {
    db.Article.findOne({_id: req.params.id})
        .populate("notes")
        .then(function(found) {
            res.json(found);
        })
        .catch(function(err) {
            res.json(err);
        });
});

app.post("/note/:id", function(req, res) {
    db.Note.create(req.body)
        .then(function(dbNote) {
            return db.Article.findOneAndUpdate({_id: req.params.id}, {$push: {notes: dbNote._id}});
        })
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err); 
        });
});

app.delete("/note/:id/:articleId", function(req, res) {
    var id = req.params.id;
    var articleId = req.params.articleId;
    db.Article.findOneAndUpdate({_id: articleId}, {$pull: {notes: id}})
        .then(function(dbNote) {
            return db.Note.remove({_id: id});
        })
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

app.get("/scrape", function(req, res) {
    var counter = 0;
    request("https://www.npr.org/sections/news/", function(error, response, html) {
        var $ = cheerio.load(html);
        
        $("div.item-info").each(function(i, element) {
            var result = {};
            result.title = $(element).find("h2").text();
            result.link = $(element).find("h2").children().attr("href");
            result.description = $(element).find("p").children().text();
            db.Article.create(result)
                .then(function(dbArticle) {
                    counter++;
                    console.log(counter);
                })
                .catch(function(err) {
                    res.json(err);
                });
        });
        res.json(counter);
    });
});

app.listen(port, function() {
    console.log("App running on port " + port);
});