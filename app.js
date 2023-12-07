const express = require('express');
const app = express();
const http = require('http').createServer(app);
const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");

const formidable = require("formidable");
const fileSystem = require("fs");
const {getVideoDurationInSeconds } = require("get-video-duration")

const expressSession = require('express-session');
app.use(expressSession({
	"key": "user_id",
	"secret": "User secret object Id",
	"resave": true,
	"saveUninitialized": true
}));

// a function to return user's document
function getUser(userId, callBack) {
	database.collection("users").findOne({
		"_id": ObjectId(userId)
	}, function (error, result) {
		if (error) {
			console.log(error);
			return;
		}
		if (callBack != null) {
			callBack(result);
		}
	});
}

app.use(bodyParser.json({
    limit: "10000mb"
}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: "10000mb",
    parameterLimit: 1000000
}))
const { get, result, parseInt } = require('lodash');

app.set('view engine', 'ejs');
app.use(express.static('public'));


http.listen(3000, function () {

    mongoClient.connect("mongodb://127.0.0.1:27017", function (err, client) {
        database = client.db("Carea");
        

        app.get('/',(req, res) => {
            let y;let x
            let users = database.collection('users');
            users.count().then((count) => {
                y=count;
            });
            let videos = database.collection('video');
            videos.count().then((count) => {
                x =count;
            });
            database.collection("mails").find({}).sort({}).toArray(function (error1, mails) {
        
                res.render('index', {
                    "isLogin": req.session.user_id ? true : false,
                    "navMenu": true,
                    "users": y,
                    "videos": x,
                    "mails": mails
                });
            });
        })
        app.get('/register',(req, res) => {
            if (req.session.user_id) {
				res.redirect("/");
				return;
			}
			res.render("register", {
				"error": "",
                "errorE": "",
				"errorP": ""
			});
        })
        app.post('/register', (req, res) => {
            var name = req.body.name;
			var email = req.body.email;
			var password = req.body.password;
            var Cpassword = req.body.Cpassword;


			if (name == ""  || email == "" || password == "") {
				res.render("register", {
					"error": "Please fill all fields",
                    "errorE": "",
                    "errorP": ""
				});
				return;
			}
            if (password != Cpassword) {
				res.render("register", {
					"errorP": "Retry Passwod not match",
                    "error": "",
                    "errorE": ""
				});
				return;
			}
            //Check if email already exists
            database.collection("users").findOne({
                "email": req.body.email
            }, (err, user)=> {
                if (user == null) {
                    // not exists

                    // convert password to hash
                    bcrypt.hash(req.body.password, 10, (err, hash)=> {
                        database.collection("users").insertOne({
                            "name": req.body.name,
                            "email": req.body.email,
                            "password": hash,
                            "image": "",
                            "videos":[]
                        }, (err, data)=> {
                            res.redirect("/login");
                        });
                    });
                } else {
                    //exists
                    res.render("register", {
						"errorE": "Email already exists",
                        "error": "",
				        "errorP": ""
					});
                }
            });
        });
        app.get('/login', (req, res) => {
            res.render('login', {
                "error": "",
                "errorP": "",
                "errorE": "",
            });
        })
        app.post('/login', (req,res)=>{
            // check if email exists
            var email = req.body.email;
			var password = req.body.password;

            if (email == "" || password == "") {
				res.render("login", {
					"error": "Please fill all fields",
                    "errorP": "",
                    "errorE": "",
				});
				return;
			}

            database.collection("users").findOne({
                "email": req.body.email
            }, (err, user)=>{
                if(user == null) {
                    res.render("login", {
						"errorE": "Email does not exist",
                        "error": "",
                        "errorP": ""
					});
                }else {
                    // compare hashed password
                    bcrypt.compare(req.body.password, user.password, (err, isVerify)=>{
                        if(isVerify) {
                            //save user id in session
                            req.session.user_id = user._id;
                            res.redirect("/");
                        } else {
                            res.render("login", {
								"errorP": "Password is not correct",
                                "error": "",
                                "errorE": "",
							});
                        }
                    });
                }
            });
        });
        app.get('/videoPage',(req, res) => {
            res.render('videoPage');
        })
        app.get("/profile", (req, res) => {
            
			if (req.session.user_id) {
				database.collection("users").findOne({
					"_id": ObjectId(req.session.user_id)
				}, function (error1, user) {
					res.render("profile", {
						"isLogin": true,
						"user": user,
						"headerClass": "single-channel-page",
						"footerClass": "ml-0",
						"isMyChannel": true,
						"message": req.query.message ? req.query.message : "",
						"error": req.query.error ? req.query.error : "",
						"url": req.url
					});
				});
			} else {
				res.redirect("/login");
			}
		});
        app.get('/logout',(req, res) => {
            req.session.destroy();
            res.redirect('/');
        })
        app.get('/dataScience',(req, res) => {
            database.collection("video").find({}).sort({"createdAt": -1}).toArray(function (error1, videos) {
				res.render("CdataScience", {
					"isLogin": req.session.user_id ? true : false,
                    "navMenu": false,
					"videos": videos,
					"url": req.url
				});
			});
        })
        app.get('/web',(req, res) => {
            database.collection("video").find({}).sort({"createdAt": -1}).toArray(function (error1, videos) {
				res.render("Cweb", {
					"isLogin": req.session.user_id ? true : false,
                    "navMenu": false,
					"videos": videos,
					"url": req.url
				});
			});
        })
        app.get('/programation',(req, res) => {
            
            database.collection("video").find({}).sort({"createdAt": -1}).toArray(function (error1, videos) {
				res.render("Cprogramation", {
					"isLogin": req.session.user_id ? true : false,
                    "navMenu": false,
					"videos": videos,
					"url": req.url
				});
			});
			
        })
        app.get('/network',(req, res) => {
            database.collection("video").find({}).sort({"createdAt": -1}).toArray(function (error1, videos) {
				res.render("Cnetwork", {
					"isLogin": req.session.user_id ? true : false,
                    "navMenu": false,
					"videos": videos,
					"url": req.url
				});
			});
        })
        app.get('/upload',(req, res) => {
            if (req.session.user_id) {
				database.collection("users").findOne({
					"_id": ObjectId(req.session.user_id)
				}, function (error1, user) {
					res.render("upload", {
						"isLogin": true
					});
				});
			} else {
				res.redirect("/login");
			}
        })
        app.post("/upload-video",(req, res) => {
            //check if user is logged in
            if (req.session.user_id) {
                const formData = new formidable.IncomingForm();
                formData.maxFileSize = 1000 * 1024 * 1204;
                formData.parse(req, (err, fields, files)=> {
                    const title = fields.title;
                    const description = fields.description;
                    const tags = fields.tags;
                    const category = fields.category;

                    const oldPathThumbnail = files.thumbnail.filepath;
                    const thumbnail = "public/thumbnails/" + new Date().getTime() + "-"  +
                                        files.thumbnail.originalFilename;
                    
                    fileSystem.rename(oldPathThumbnail, thumbnail, (err)=>{
                        //
                    })

                    const oldPathVideo = files.video.filepath;
                    const newPath = "public/videos/" + new Date().getTime() * "-"  +
                                        files.video.originalFilename;
                    fileSystem.rename(oldPathVideo, newPath, (err)=>{
                        // get user data to save in videos document

                        getUser(req.session.user_id, (user)=>{
                            const currentTime = new Date().getTime();

                            // get video duration
                            getVideoDurationInSeconds(newPath).then((duration)=>{
                                const hours = Math.floor(duration / 60 / 60);
                                const minutes = Math.floor(duration / 60) - (hours * 60);
                                const seconds = Math.floor(duration % 60);

                                // insert  in database

                                database.collection("video").insertOne({
                                    "user": {
                                        "_id": user._id,
                                        "name": user.name,
                                        "image": user.image,
                                        "subscribers": user.subscribers,
                                    },
                                    "filePath": newPath,
                                    "thumbnail": thumbnail,
                                    "title": title,
                                    "description": description,
                                    "tags": tags,
                                    "category": category,
                                    "createdAt" : currentTime,
                                    "minutes": minutes,
                                    "seconds": seconds,
                                    "hours": hours,
                                    "watch": currentTime,
                                    "views": 0,
                                    "playlist": "",
                                    "likers": [],
                                    "dislikers": [],
                                    "comments": []
                                }, (err, data)=>{
                                    // insert in users collection too

                                    database.collection("users").updateOne({
                                        "_id": ObjectId(req.session.user_id)
                                    }, {
                                        $push: {
                                            "videos": {
                                                "_id": data.insertedId,
                                                "title": title,
                                                "views": 0,
                                                "thumbnail": thumbnail,
                                                "watch": currentTime,
                                                "filePath": newPath,
                                            }
                                        }
                                    });
                                    res.redirect("profile");
                                });
                            });
                        })
                    })
                })
            }
            else {
                res.redirect("/login");
            }
            
        });
        app.get("/watch/:watch", (req, res)=>{
            if (req.session.user_id) {
                database.collection("video").findOne({
                    "watch": parseInt(req.params.watch)
                }, function (err, video) {
                    if (video == null) {
                        res.render("404", {
                            "message": "Video does not exist.",
                            "url": req.url
                        });
                    } else {
                        database.collection("video").updateOne({
                            "_id": ObjectId(video._id)
                        }, {
                            $inc: {
                                "views": 1
                            }
                        })

                        database.collection("video").find({}).sort({"createdAt": -1}).toArray(function (error1, videos) {
                            res.render("video-page", {
                                "isLogin": req.session.user_id ? true : false,
                                "navMenu": false,
                                "videos": videos,
                                "video": video
                            });
                        });
                        
                    }
                });
            } else {
				res.redirect("/login");
			}
        })
        app.post("/search", (req, res)=>{
            var searchKey = req.body.searchKey;
            console.log(searchKey)
            database.collection("video").find({}).sort({}).toArray(function (error1, videos) {
				res.render("searchResult", {
					"isLogin": req.session.user_id ? true : false,
                    "navMenu": false,
					"videos": videos,
					"url": req.url,
                    "searchKey":searchKey
				});
			});
        });
        app.post("/mail", (req, res)=>{

            var Fname = req.body.Fname;
			var Lname = req.body.Lname;
			var mail = req.body.mail;
            var message = req.body.message;
            var addtional = req.body.addtional;
            console.log(req.body.Fname);
            database.collection("mails").insertOne({
                "Fname": req.body.Fname,
                "Lname": req.body.Lname,
                "mail": mail,
                "message": message,
                "addtional": addtional
            }, (err, data)=> {
                res.redirect("/");
            });
			
        })
        app.use((req, res) => {
            res.render('404');
        })
    });

})