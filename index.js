var express = require('express');
var app = express();
var AWS = require('aws-sdk');
var NodeWebcam = require("node-webcam");

AWS.config.loadFromPath('./s3_config.json');

//add region 
var regionName = 'region code here';
//add bucket name
var bucketName = 'bucket name here'
var readParams = {
    Bucket: bucketName
};

AWS.config.update({ region: regionName });

var s3 = new AWS.S3();
s3.headBucket(readParams, function (err, data) {
    if (err) {     // Create bucket if a bucket of the given name doesn't exist yet
        var createParams = {
            Bucket: bucketName,
            ACL: 'public-read',
            CreateBucketConfiguration: {
                LocationConstraint: regionName
            }
        }
        s3.createBucket(createParams, (err, data) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log('Bucket created: ' + bucketName)
                console.log(data);
            }
        })
    }
    else {
        console.log('Bucket exists');
    }

    s3 = new AWS.S3({ params: { Bucket: bucketName } });
});


// for parsing form data in json format
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// setup handlebars environment in express
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({ defaultLayout: '', extname: '.hbs' }));
var imageGallery = [];


function getImages(req, resp) {

    imageGallery = []

    // Getting image urls
    s3.listObjects(readParams, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data);


            var contents = data.Contents;
            contents.forEach(function (content) {
                var listingParams = {
                    Bucket: bucketName,
                    Key: content.Key
                }

                s3.getSignedUrl('getObject', listingParams, (err, url) => {
                    imageGallery.push(url);
                })
            });
            console.log("Success", imageGallery);
            resp.render('display.hbs', { images: imageGallery });
        }
    });

}

function takeAndUpload(req, res) {

    var opts = {
        callbackReturn: "buffer",
        output: "jpeg"
    }

    NodeWebcam.capture("test_picture", opts, function (err, data) {
        if (err) {
            console.log(err);
        }

        console.log(data);
        var input = JSON.parse(JSON.stringify(req.body));
        var imgName = input.imageName;

        var imgData = {
            Key: imgName + ".jpeg",
            // ACL: 'public-read',
            Body: new Buffer(data, 'base64'),
            ContentEncoding: 'base64',
            ContentType: 'image/jpeg'
        };

        s3.upload(imgData, function (err, data) {
            fail = '';
            if (err) {
                console.log(err);
                console.log('Error uploading data: ', data);
                res.render('webcam.hbs', {
                    page: req.url,
                    'img': imgName,
                    'fail': 'fail'
                })
            } else {
                console.log(data);
                console.log('succesfully uploaded the image!');
                res.render('uploadSuccess.hbs', {
                    page: req.url,
                    'img': imgName
                })
            }
        });
    });
}


app.get("/", function (req, res) {

    console.log(imageGallery);
    getImages(req, res);

});

app.get("/webcam", function (req, res) {
    res.render("webcam.hbs", {
        page: req.url
    });
});

app.post("/upload", function (req, res) {
    try {
        takeAndUpload(req, res);
    }
    catch (err) {
        console.log(err)
        console.log('failed')
    }
});

// start the web server and listen for request
app.listen(3000, function () {
    console.log('Web server started on port 3000...');
});