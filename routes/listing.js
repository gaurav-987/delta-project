const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
// const ExpressError=require("../utils/ExpressError.js");
// const {listingSchema,reviewSchema}=require("../schema.js");
const Listing= require("../models/listing.js");
const {isloggedIn, isOwner, validateListing}=require("../middleware.js");

const listingController=require("../controllers/listing.js");
const multer  = require('multer')
const {storage}=require("../cloudConfig.js");
const upload = multer({ storage });
const EventEmitter = require('events');

const axios = require('axios');

EventEmitter.defaultMaxListeners = 15;


// Disable SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Make HTTP request without SSL verification
axios.get('https://localhost:8080/listings')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });

router.route("/")
   .get(wrapAsync(listingController.index))                                            //index route
   .post(isloggedIn , upload.single('listing[image]'),validateListing, wrapAsync(listingController.createListing));     //create route

//new route
router.get("/new",isloggedIn,listingController.renderNewForm)   

router.route("/:id")
    .get(wrapAsync(listingController.showListing))                                                //show route
    .put(isloggedIn ,isOwner,upload.single('listing[image]'), validateListing, wrapAsync(listingController.updateListing))       //update route
    .delete(isloggedIn ,isOwner,wrapAsync(listingController.destroyListing));                    //delete route

//index route
// router.get("/",wrapAsync(listingController.index))
 
 //new route
 // app.get("/listings/new",(req,res)=>{
 //     res.render("listings/show.ejs");
 // })
 
 
 //Show route
//  router.get("/:id",wrapAsync(listingController.showListing))
 
 //Create Route
//  router.post("/",isloggedIn ,validateListing, wrapAsync(listingController.createListing))
 
 //Edit Route
 router.get("/:id/edit",isloggedIn,isOwner, wrapAsync(listingController.renderEditForm))
 
 //Update Route
//  router.put("/:id",isloggedIn ,isOwner, validateListing, wrapAsync(listingController.updateListing))
 
 //Delete Route
//  router.delete("/:id",isloggedIn ,isOwner,wrapAsync(listingController.destroyListing))
 

 module.exports=router;