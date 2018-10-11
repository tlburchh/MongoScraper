var express = require("express");
var exphbs = require("express-handlebars"); 
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");
var Article = require("./models/Article");
var Note = require("./models/Note");
var Saved = require("./models/Saved")



// Initialize Express
var app = express();

// Set the port of our application
// process.env.PORT lets the port be set by Heroku
var PORT = process.env.PORT || 3000;

// Set Handlebars as the default templating engine.
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/mongoscraper", { useNewUrlParser: true });

// Routes

//***************************** */
//GET requests to render Handlebars pages
app.get("/", function(req, res) {
  Article.find({}, function(error, data) {
    var hbsObject = {
      article: data
    };
    // console.log(Article)
    console.log(hbsObject);
    res.render("index", hbsObject);
  });
});

app.get("/saved", function(req, res) {
 
  Saved.find({}) 
  .populate("title", "link")
  .exec(function(error, saved) {
    var hbsObject = {
      saved: saved
    };
    res.render("saved", hbsObject);
  });
});
//********************************** */

app.get("/scrape", function(req, res) {
// Make a request via axios to grab the HTML body from the site of your choice
axios.get("https://www.bbc.com/news/science_and_environment").then(function(response) {

  // Load the HTML into cheerio and save it to a variable
  // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
  var $ = cheerio.load(response.data);

  
  // Select each element in the HTML body from which you want information.
  // NOTE: Cheerio selectors function similarly to jQuery's selectors,
  // but be sure to visit the package's npm page to see how it works
  $("h3.title-link__title").each(function(i, element) {
    // An empty array to save the data that we'll scrape
    var result = {};

    result.title = $(this).children().text();
    result.link = $(this).parent("a").attr("href");
    // result.saved = false;
    // console.log(result);
    db.Article.create(result)
    .then(function(dbArticle) {
      // View the added result in the console
      console.log("dbArticle: " + dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      return res.json(err);
    });
});

// If we were able to successfully scrape and save an Article, send a message to the client
res.send("Scrape Complete");
});
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({}).then(function(article){
    res.json(article);
  }).catch(function(err){
    res.json(err);
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id})
    .populate("note")
    .then(function(article){  
    res.json(article);
  }).catch(function(err){
    res.json(err);
  });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  db.Note.create(req.body)
    .then(function(newNote){
      return db.Article.findOneAndUpdate(
        {
          _id: req.params.id
        }, 
        {
          note: newNote._id
        },
        {
          new:true
        });
      }).then(function(article){
        res.json(article);
      }).catch(function(err){
        res.json(err);
      });
    });



  app.post("/saved/:id", function(req, res) {
      db.Saved.create(req.body)
      .then(function(newSave){
        return db.Article.findOneAndUpdate(
          {
            _id: req.params.id
          }, 
          {
            $set: req.body
          },
          {
            new:true
          });
        }).then(function(article){
          res.json(article);
        }).catch(function(err){
          res.json(err);
        });
      });

    

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});