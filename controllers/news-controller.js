var express = require("express");
var router = express.Router();

var cheerio = require("cheerio");
var request = require("request");

router.get("/", function(req, res) {
	// var articlesArray = [];
	var articlesArray = [{link:'www.google.com', title: 'google'}, {link:'www.yahoo.com', title:'yahoo'}];
      var hbsObject = {
        data: articlesArray
      };
      // render handle bars object, check for 
    res.render("index", hbsObject);
});

router.get("/scrape", function(req, res) {
    request("http://www.nytimes.com", function(error, response, html) {
        var $ = cheerio.load(html);
        var results = [];

        $(".story-heading").each(function(i, element) {

            var articleTitle = $(element).text().trim();
            var articleLink = $(element).children().attr("href");
            // add description
            if (articleLink !== undefined) {
                results.push({
                    title: articleTitle,
                    link: articleLink
                });
            }
        });


        // var hbsObject = {
        //     data: results
        // };
        // console.log(hbsObject);
        // res.render("Index", hbsObject);
        // redirect to / route
        res.json(results);
    });
});

module.exports = router;