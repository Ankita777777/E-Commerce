 const port = 4000;
const express=require("express");
const app = express();
const mongoose= require("mongoose");
const jwt=require("jsonwebtoken");
const multer= require("multer");
const path=require("path");
const cors= require("cors");
const { log } = require("console");

app.use(express.json());
app.use(cors());

//database connection with mongodb
mongoose.connect("mongodb+srv://ankitadb:panDa123@cluster0.gtqh5gj.mongodb.net/e-commerce")

//API Creation

app.get("/",(req,res)=>{
    res.send("Express App is Running")
})

//Image Storage Engine
const storage= multer.diskStorage({
    destination: path.join(__dirname,'./upload/images'),
    filename:(req,file,cb)=>{
return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload=multer({storage:storage});

//Creatong Upload ENdpoint for images
app.use('/images',express.static(path.join(__dirname,'upload','images')))

app.post("/upload",upload.single('product'),(req,res)=>{
    
     if (!req.file) {
        return res.status(400).json({ 
            success: 0, 
            message: "No file received. Check field name is 'product' and body is form-data" 
        });
    }
    
    res.json({
     success:1,
     image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})

//global error handler
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ success: 0, error: err.message });
});

//Schema for Creating Products

const Product= mongoose.model("Product",{
    id:{
        type:Number,
        required:true
    },
    name:{
        type:String,
        required:true,
    },
    email:{
type:String,
unique:true
},
    image:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
        new_price:{
            type:Number,
            required:true,
        },
        old_price:{
            type:Number,
            required:true
        },
        date:{
            type:Date,
            default:Date.now,
        },
        available:{
            type:Boolean,
            default:true
        }
})

app.post('/addproduct',async(req,res)=>{
    let products= await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id= last_product.id+1;
    }else{
id=1;
    }
    const product= new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price
    });
    console.log(product);
    await product.save();
    console.log("Saved");
res.json({
    success:true,
    name:req.body.name
})
})

//Creating API for deleting products

app.post('/removeproduct',async(req,res)=>{
   await Product.findOneAndDelete({id:req.body.id});
   console.log("Removed");
   res.json({
    success:true,
    name:req.body.name
   })
})

//creating api for getting all products

app.get('/allproducts',async (req,res)=>{
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

//Shema Creating For User Model

const Users= mongoose.model('Users',{
   name:{
    type:String
   },
   email:{
    type:String,
    unique:true
   },
   password:{
    type:String
   },
   cartData:{
    type:Object
   },
   date:{
    type:Date,
    default:Date.now
   }
})

//Creating Endpoint for registering the user
app.post('/signup',async(req,res)=>{
    
  let check = await Users.findOne({email:req.body.email});
  if(check){
    return res.status(400).json({success:false,errors:"existing user Found with same email adress"})
  }
  let cart = {};
  for(let i=0;i<300;i++){
    cart[i]=0;
  }
  const user= new Users({
    name:req.body.username,
    email:req.body.email,
    password:req.body.password,
    cartData:cart
  })

   await user.save();

   const data = {
    user:{
        id:user.id
    }
   }

const token = jwt.sign(data,'secret_ecom');
res.json({success:true,token})

})

//creating endpoint for user login
app.post('/login',async (req,res)=>{
   let user= await Users.findOne({email:req.body.email});
   if(user){
    const passCompare = req.body.password === user.password;
    if(passCompare){
        const data={
            user:{
                id:user.id
            }
        }
        const token= jwt.sign(data,'secret_ecom');
        res.json({success:true,token})
    }
    else{
        res.json({success:false,errors:"Wrong Password"})
    }
   }
   else{
    res.json({success:false,errors:"Wrong Email Id"})
   }
})
//creatinf endpoint for popular in women section
app.get('/popularwomen',async(req,res)=>{
    let products= await Product.find({category:"women"})
    let popular_in_women = products.slice(0,4);
    console.log("Popular in Women fetched");
    res.send(popular_in_women);
})

//creatin middleware to fetch user
const fetchUser = async(req,res,next)=>{
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"Please authentication using valid token"})
    }else{
        try{
            const data= jwt.verify(token,'secret_ecom');
            req.user = data.user;
            next();
        } catch(error){
            res.status(401).send({errors:"please authenticate using a valid token"})
        }
    }
}

//creating endpoint for adding product cartdata
app.post('/addtocart',fetchUser,async(req,res)=>{
 console.log("Added",req.body.itemId)
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] +=1;
     await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData})
     res.send("Added")
})

//creatinf endpoint to remove product from cartdata
app.post('/removefromcart',fetchUser,async(req,res)=>{
console.log("removed",req.body.itemId)
    let userData = await Users.findOne({_id:req.user.id});
    if(   userData.cartData[req.body.itemId] >0)
   userData.cartData[req.body.itemId] -=1;
     await Users.findOneAndDelete({_id:req.user.id},{cartData:userData.cartData})
     res.send("Remove")
})
//Creating endpoint for newcollection data
app.get('/newcollections',async(req,res)=>{
    let products= await Product.find({});
    let newcollections= products.slice(-8);
    console.log("NewCollection Fetched");
    res.send(newcollections);
})

//creating endpoint to get cartdata
app.post('/getcart',fetchUser,async(req,res)=>{
console.log("GetCart");
let userData = await Users.findOne({_id:req.user.id})
res.json(userData.cartData);
})

app.listen(port,(error)=>{
    if(!error){
        console.log("Server Running on Port " + port)
    }
    else{
        console.log("Error : "+error)
    }
})
 
