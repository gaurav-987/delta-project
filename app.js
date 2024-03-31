if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}


const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing= require("./models/listing.js");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");

const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const listingsRouter=require("./routes/listing.js");
const reviewsRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");
const { error } = require('console');

const dbUrl= process.env.ATLASDB_URL;

main().then(()=>{
console.log("Connected to db");
}).catch(err=>{
    console.log(err);
})

async function main(){
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("ejs",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
      },
      touchAfter: 24 * 36000,
})

store.on("error",()=>{
    console.log("ERROR! in mongo-session store",error);
})

const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+ 7 * 24 * 60 *60 *1000,
        maxAge: 7 * 24 * 60 *60 *1000,
    },
    httpOnly:true,

};


//API creation
// app.get("/",(req,res)=>{
//     res.send("Welcome");
// })

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{                            //Middleware
    res.locals.success=req.flash("success"); 
    res.locals.error=req.flash("error");  
    console.log(res.locals.success);
    res.locals.currUser=req.user;
    next();
})

// app.get("/demouser",async(req,res)=>{
//     let fakeuser=new User({
//         email:"user@gmail.com",
//         username:"gaurav",
//     });

//    let registerUser=await User.register(fakeuser,"helloworld");
//    res.send(registerUser);
// })

// const validateListing=(req,res,next)=>{
//     let {error}=listingSchema.validate(req.body);
//     if(error){
//         let errMsg= error.details.map((el) => el.message).join(",");
//         throw new ExpressError(400,errMsg);
//     }else{
//         next();
//     }
// };

// const validateListing=(req,res,next)=>{
//     let {error}=listingSchema.validate(req.body);
//     if(error){
//         let errMsg= error.details.map((el) => el.message).join(",");
//         throw new ExpressError(400,errMsg);
//     }else{
//         next();
//     }
// };

// const validateReview=(req,res,next)=>{
//     let {error}=reviewSchema.validate(req.body);
//     if(error){
//         let errMsg= error.details.map((el) => el.message).join(",");
//         throw new ExpressError(400,errMsg);
//     }else{
//         next();
//     }
// };

// //index route
// app.get("/listings",wrapAsync(async (req,res)=>{
//    const allListings=await Listing.find({})
//    res.render("./listings/index.ejs",{allListings});
// }))

// //new route
// // app.get("/listings/new",(req,res)=>{
// //     res.render("listings/show.ejs");
// // })

// //new route
// app.get("/listings/new",(req,res)=>{
//     res.render("listings/new.ejs");
// })

// //Show route
// app.get("/listings/:id",wrapAsync(async(req,res)=>{
//    let {id}=req.params;
//    const listing=await Listing.findById(id).populate("reviews");
//    res.render("listings/show.ejs",{listing});
// }))

// //Create Route
// app.post("/listings",validateListing, wrapAsync(async(req,res,next)=>{
//     // if(!req.body.listing){
//     //     throw new ExpressError(400,"Send Valid data for Listing");
//     // }

// // let {title,description,image,price,country,location}=req.body ;
//    const newListing= new Listing(req.body.listing);
//    await newListing.save();
//    res.redirect("/listings"); 
    
// }))

// //Edit Route
// app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
//     let {id}=req.params;
//    const listing=await Listing.findById(id);
//    res.render("listings/edit.ejs",{listing});
// }))

// //Update Route
// app.put("/listings/:id",validateListing, wrapAsync(async(req,res)=>{
//     let {id}=req.params;                            //Extracting id
//     await Listing.findByIdAndUpdate(id,{...req.body.listing});
//     res.redirect(`/listings/${id}`);
// }))

// //Delete Route
// app.delete("/listings/:id",wrapAsync(async(req,res)=>{
//     let {id}=req.params;
//    let deletedListing=await Listing.findByIdAndDelete(id);
//    console.log(deletedListing);
//    res.redirect("/listings");
// }))

// //Reviews
// //post review route
// app.post("/listings/:id/reviews",validateReview,wrapAsync(async(req,res)=>{
//     let listing=await Listing.findById(req.params.id);
//     let newReview=new Review(req.body.review);

//     listing.reviews.push(newReview);

//     await newReview.save();
//     await listing.save();

//   res.redirect(`/listings/${listing._id}`);
// }))

// //Delete Review Route
// app.delete("/listings/:id/reviews/:reviewId",wrapAsync(async(req,res)=>{
//     let {id, reviewId}=req.params;

//     await Listing.findByIdAndUpdate(id, {$pull:{reviews: reviewId}});
//     await Review.findByIdAndDelete(reviewId);

//     res.redirect(`/listings/${id}`);
// }))

app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found !"));
});

app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something Went Wrong"}=err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
});

//Server creation
app.listen(8080,()=>{
    console.log("Server is listening");
});