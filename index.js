var express = require('express');
var app = express();
var AWS = require('aws-sdk');

//Add access key and secret access key
AWS.config.accessKeyId = "your access key";
AWS.config.secretAccessKey = "your secret access key";

//add region 
AWS.config.update({region: 'your region'});
var s3 = new AWS.S3();
// for parsing form data in json format
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// setup handlebars environment in express
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({ defaultLayout: '', extname: '.hbs' }));
var imageGallery =[];


function getImages(req,resp){
    var readParams = {
        //add bucket name
        Bucket : 'your bucket name',
      };              
                                   
 // Call S3 to create the bucket
s3.listObjects(readParams, function(err, data) {
   if (err) {
      console.log("Error", err);
   } else {
      console.log("Success", data);
     

      var contents = data.Contents;
      contents.forEach(function (content) {
          //add your bucketname here in the url
        imageGallery.push("https://bucketname.s3.amazonaws.com/"+content.Key);
       
      });
      console.log("Success", imageGallery);
      resp.render('display.hbs',{images:imageGallery});
   }
});

}


app.get("/", function(req, res) {
 
    console.log(imageGallery);
    getImages(req,res);

});
// start the web server and listen for request
app.listen(3000, function() {
    console.log('Web server started on port 3000...');
});