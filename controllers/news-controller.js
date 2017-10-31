const express = require("express");
const router = express.Router();

const cheerio = require("cheerio");
const request = require("request");

const mongoose = require("mongoose");
mongoose.Promise = Promise;

const Article = require("../models/Article.js");
const Note = require("../models/Note.js");

mongoose.connect("mongodb://localhost/news");
const db = mongoose.connection;

db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

db.once("open", function() {
    console.log("Mongoose connection successful.");
});

router.get("/", (req, res) => {
    Article.find({}, function(error, doc) {

        let savedCheck = 0;

        for (var i = 0; i < doc.length; i++) {
            if (doc[i].saved === false) {
                savedCheck++;
            }
        }

        if (savedCheck === 0) {
            hbsObj = {
                data: []
            };
            error ? console.error(error) : res.render("index", hbsObj);
        } else {
            hbsObj = {
                data: doc
            };
            error ? console.error(error) : res.render("index", hbsObj);
        }
    });
});

router.get("/scrape", (req, res) => {
    request("http://www.nytimes.com", function(error, response, html) {
        const $ = cheerio.load(html);
        const results = [];

        $(".story-heading").each((i, element) => {

            const articleTitle = $(element).text().trim();
            const articleLink = $(element).children().attr("href");
            const articleSummary = $(element).siblings('.summary').text().trim();

            if (articleLink !== undefined && articleSummary !== '') {
                results.push({
                    title: articleTitle,
                    link: articleLink,
                    summary: articleSummary
                });
            }
        });

        Article.insertMany(results)
            .then(function(docs) {
                // console.log(docs);
            })
            .catch(function(err) {
                console.error(err);
            });

        res.json(results.length);
    });
});

router.post("/save", function(req, res) {
    Article.update({
        _id: req.body.data
    }, {
        $set: {
            saved: true
        }
    }).exec(function(err, doc) {
        (err) ? console.log(err): res.json(true);
    });
});

router.get('/clear', (req, res) => {
    // removes all unsaved articles from the db
    Article.remove({
        saved: false
    }, (err, docs) => {
        res.json(true);
    });
});

router.get('/savedArticles', (req, res) => {
    Article.find({
        saved: true
    }, (err, docs) => {
        hbsObj = {
            data: docs
        }
        res.render('savedArticles', hbsObj);
    });
});

router.post('/deleteArticle', (req, res) => {
    console.log(req.body.data);
    Article.remove({
        _id: req.body.data
    }, (err, docs) => {
        res.json(true);
    });
});

router.post('/notes', (req, res) => {
    console.log(req.body.data);

    Article.find({note})

    Note.find({
        _id: req.body.data
    }, (error, docs) => {
        console.log('Docs', docs);

        if (docs.length === 0) {
            hbsObj = {
                data: []
            };
            error ? console.error(error) : res.json(hbsObj);
        }
        // else {
        //     hbsObj = {
        //         data: doc
        //     };
        //     error ? console.error(error) : res.render("index", hbsObj);
        // }
    });
});

router.post('/saveNote/', (req, res) => {
    console.log(req.body);
    console.log(req.body.body);

    var newNote = new Note({
        body: req.body.body
    });

    newNote.save((err, doc) => {
        if (err) {
            console.error(err)
        } else {

            Article.findOneAndUpdate({}, {
                $push: {
                    "notes": doc._id
                }
            }, {
                new: true
            }, function(err, newdoc) {
                // Send any errors to the browser
                if (err) {
                    res.send(err);
                }
                // Or send the newdoc to the browser
                else {
                    res.send(newdoc);
                }
            });
        }
    });
});

module.exports = router;