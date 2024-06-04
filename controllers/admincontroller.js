
const session = require('express-session');
// const User = require('../models/user');
const UserVerification = require("../models/otp")
const Product = require('../models/product');
const Category=require('../models/category');
const order=require('../models/order');
const Coupoun = require('../models/coupon');
const bcrypt= require('bcrypt');
const bodyparser=require('body-parser');
const user = require('../models/user');
const category = require('../models/category');
const { Collection } = require('mongoose');
const excelJS = require('exceljs');
const product = require('../models/product');

const adminhome=(req,res)=>{
    res.render('admin/adminhome')
}

const home = async(req,res)=>{
    if(req.session.admin){
        try{
        res.render('admin/adminhome')
        }catch(error){
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
    else{
        res.redirect('/login')
    }
}



const dashboard = async (req, res) => {
    try {
        
        const orderCount = await order.countDocuments();
        const customerCount = await user.countDocuments(); 
        const productCount = await product.countDocuments();
        const productPurchaseCounts = await getProductPurchaseCounts();
        const salesreport = await getsalesreport();

        const orderSourceData = await order.aggregate([
            {
              $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
              },
            },
          ]);

        console.log('orderSourceData',orderSourceData);
        console.log('salesreport',salesreport);
        
        const userStats = await user.aggregate([
            {
              $group: {
                _id: {
                  year: { $year: { $toDate: '$_id' } },
                  month: { $month: { $toDate: '$_id' } },
                  day: { $dayOfMonth: { $toDate: '$_id' } },
                },
                count: { $sum: 1 },
              },
            },
            {
              $sort: {
                '_id.year': 1,
                '_id.month': 1,
                '_id.day': 1,
              },
            },
          ]);

          console.log('userstats',userStats);

        res.render('admin/dashboard', { orderCount, customerCount, productCount,salesreport, productPurchaseCounts,orderSourceData,userStats});
        // else {
        //     res.redirect('/admin/login')
        // }
    } catch (error) {
        console.error('Error in dashboard route:', error);
        res.status(500).send('Internal Server Error');
    }
};


const getsalesreport = async () => {
    const pipeline = [
        {
            $unwind: "$items",
        },
        {
            $lookup: {
                from: "products", // Assuming your collection is named 'products'
                localField: "items.product",
                foreignField: "_id",
                as: "productDetails",
            },
        },
        {
            $unwind: "$productDetails",
        },
        {
            $project: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                productName: "$productDetails.name",
                quantity: "$items.quantity",
                totalAmount: "$TotalPrice",
            },
        },
        {
            $group: {
                _id: { date: "$date", productName: "$productName" },
                totalSales: { $sum: "$totalAmount" },
                totalQuantity: { $sum: "$quantity" },
                countOrders: { $sum: 1 },
            },
        }
    ];

    console.log('pipeline:', pipeline); // Log the pipeline to check its structure

    const result = await order.aggregate(pipeline).exec();
    console.log('result:', result); // Log the result to check if data is being returned

    return result;
};


const getProductPurchaseCounts = async () => {
    try {
        const productPurchaseCounts = await order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    count: { $sum: '$items.quantity' }
                }
            },
            {
                $lookup: {
                    from: 'products', // Assuming your collection is named 'products'
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails'
            },
            {
                $project: {
                    _id: 0,
                    productName: '$productDetails.name',
                    purchaseCount: '$count'
                }
            }
        ]);
                
        console.log('productPurchaseCounts',productPurchaseCounts);
        return productPurchaseCounts;
    } catch (error) {
        console.error('Error retrieving product purchase counts:', error);
        throw error;
    }
};





   

const loginget = (req, res) => {
    res.render("admin/adminlogin");
    // if (req.session.admin) {
    //     res.redirect('/admin/adminhome');
    // } else {
    //     res.render("admin/adminlogin.ejs");
    // }
};

const loginpost = (req, res) => {
    const name = 'admin';
    const password = '123';
    if (name === req.body.username && password === req.body.password) {
        // Adding session 
        req.session.admin = req.body.username;
        res.redirect("/admin/userlist");
    } else {
        let msg = null;
        if (req.body.username || req.body.password) {
            // Show error message only if username or password is entered
            msg = 'Invalid username or password :(';
        }
        res.render('admin/adminlogin', { msg: msg, username: req.body.username });
    }
};


// ..............<<<<<<<<<<<   DashBoard   >>>>>>>>>>>............

const userlist= async (req,res)=>{  
try{
    console.log("entered");
     const users= await user.find({ });
     console.log(users)
    res.render('admin/userlist',{users})

}
catch(err){
    console.error(err)
}
}

const userBlocked = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log(userId);
        const foundUser = await user.findById(userId);
        console.log(foundUser);
        if (!foundUser) {
            console.log("User Not Found");
            return res.status(404).json({ message: 'User not found' });
        } else {
            console.log("else");
            foundUser.isBlocked = !foundUser.isBlocked;
            await foundUser.save();
            res.redirect('/admin/userlist')
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

            
    





const productpage= async(req,res)=>{
    try{
        // if(req.session.admin){
            const products= await Product.find({ }); 
            // res.render('admin/product');
        // }

        
        const category =await Category.find({});
        // console.log(category);
         // res.render('admin/adminedit',{category});
            //  console.log(products);
        res.render('admin/product',{products,category});
    }catch(error){
        console.log(error);
}
}


// const addproductpost = async (req, res) => {
//     try {
//         console.log(req.body);
//         const { name, description, price, category, stock } = req.body;
      
//         let product_images = [];
//         if (req.files && req.files.length > 0) {
//             const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
//             product_images = fileUrls;
//         }
//         const newproduct = new Product({
//         name,
//         description,
//         price,
//         category,
//         stock,
//         product_images
//         });

        
//         if(newproduct.price && newproduct.stock >0){
//         const savedProduct = await newproduct.save();
//         }


//      res.redirect('/admin/product');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: 'Internal server error.' });
//     }
// };

const addproductpost = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        // Destructure and validate request body
        const { name, description, price: rawPrice, category, stock: rawStock } = req.body;
        
        if (!name || !description || !rawPrice || !category || !rawStock) {
            return res.status(400).send({ message: 'All fields are required.' });
        }

        // Convert price and stock to appropriate types
        const price = parseFloat(rawPrice);
        const stock = parseInt(rawStock, 10);

        if (isNaN(price) || isNaN(stock) || price <= 0 || stock < 0) {
            return res.status(400).send({ message: 'Invalid price or stock.' });
        }

        // Initialize product_images array
        let product_images = [];
        if (req.files && req.files.length > 0) {
            const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
            product_images = fileUrls;
        }

        // Create new product instance
        const newProduct = new Product({
            name,
            description,
            price,
            category,
            stock,
            product_images
        });

        // Save the product
        const savedProduct = await newProduct.save();
        console.log('Product saved:', savedProduct);

        // Redirect after successful save
        res.redirect('/admin/product');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
};



 const editproduct = async (req,res)=>{
    try{
          const editproduct= req.params.id;
        const product =await Product.findById(editproduct);
        const category= await Category.find({})
        console.log(product);
        

         return res.render('admin/adminedit',{product,category});

    }catch(error){
        console.log(error)
    }
 } 


const editproductpost = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("productid"+id);
        const {
            name,
            description,
            category,
            price,
            offer,
            stock
        } = req.body;      
        let productImagesNew = [];
        const existingProduct = await Product.findById(id);
        const existingImages = existingProduct.product_images || [];
        for (const file of req.files) {
            const fileUrls = req.files.map(file => `/uploads/${file.filename}`);

            productImagesNew = fileUrls
        }
        
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        existingProduct.name = name;
        existingProduct.description = description;
        existingProduct.category = category;
        existingProduct.price = price;
        existingProduct.offer = offer;
        existingProduct.stock = stock;
        existingProduct.product_images = productImagesNew.concat(existingImages);
        const updatedProduct = await existingProduct.save();
        res.redirect('/admin/product');
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}




// const editproductpost = async (req, res) => {
//     try {
//         const { id } = req.params;  // Ensure the ID is correctly retrieved
//         const { name, description, category, price, stock } = req.body;

//         let productImagesNew = [];
//         if (req.files && req.files.image) {
//             if (!Array.isArray(req.files.image)) {
//                 req.files.image = [req.files.image];  // Ensure it's an array
//             }
//             for (const file of req.files.image) {
//                 productImagesNew.push(file.filename);
//             }
//         }

//         const existingProduct = await Product.findById(id);
//         if (!existingProduct) {
//             return res.status(404).json({ error: 'Product not found' });
//         }

//         existingProduct.name = name;
//         existingProduct.description = description;
//         existingProduct.category = category;
//         existingProduct.price = price;
//         existingProduct.stock = stock;

//         if (productImagesNew.length > 0) {
//             existingProduct.product_images = [...existingProduct.product_images, ...productImagesNew];
//         }

//         const updatedProduct = await existingProduct.save();
//         res.redirect('/admin/product');
//     } catch (error) {
//         console.error('Error updating product:', error);
//         return res.status(500).json({ error: 'Internal Server Error' });
//     }
// };


// const editproductpost = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const {
//             name,
//             description,
//             category,
//             price,
//             stock
//         } = req.body;

//         let productImagesNew = [];
//         const existingProduct = await Product.findById(id);
//         const existingImages = existingProduct.product_images || [];

//         if (!existingProduct) {
//             return res.status(404).json({ error: 'Product not found' });
//         }

//         if (req.files && req.files.image) {
//             req.files.image.forEach(file => {
//                 productImagesNew.push(file.filename);
//             });
//         }

//         existingProduct.name = name;
//         existingProduct.description = description;
//         existingProduct.category = category;
//         existingProduct.price = price;
//         existingProduct.stock = stock;
//         existingProduct.product_images = existingImages.concat(productImagesNew);

//         const updatedProduct = await existingProduct.save();
//         res.redirect('/admin/product');
//     } catch (error) {
//         console.error('Error updating product:', error);
//         return res.status(500).json({ error: 'Internal Server Error' });
//     }
// };





 
const productstatus = async (req, res) => {
    try {
        const productId = req.params.id;
        const sendData = req.body; // Corrected to access the whole req.body object
        console.log(sendData);
        console.log(productId);
        const product = await Product.findById(productId);    
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // Soft delete the product by updating the delete field
        await Product.findByIdAndUpdate(productId, { islisted: sendData.islisted }); // Access islisted from sendData
        console.log("Successfully updated product status");

        res.status(200).json({ message: 'Product status updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};


const deleteproductRestore = async (req, res) => {
    try {
        const products = await Product.find({ delete: false }); // Filter out soft-deleted products
        res.status(200).json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};



const categorypage= async(req,res)=>{
    try{
        const categories= await Category.find({ }); 
        for (const cat of categories) {
            if (cat.catoffer !== undefined) {
                const offerPercentage = cat.catoffer !== 0 ? cat.catoffer / 100 : 0;

                const products = await Product.find({ category: cat.name });

                for (const prod of products) {
                    prod.price = Math.floor(prod.price)
                    prod.offer = prod.price - prod.price * offerPercentage;
                    await prod.save();
                }

                await cat.save();
            }
        }
        console.log(categories);
        res.locals.categories=categories;
        res.render('admin/category');

    }catch(err){
        console.error(err);
    }
}



const addCategory = async (req, res) => {
    try {
        const categoryName = req.body.category.toLowerCase();
        const categoryDiscount = req.body.catoffer;
        
        const existingCategory = await category.findOne({
            $or: [
                { name: categoryName },
                { name: { $regex: new RegExp('^' + categoryName + '$', 'i') } }
            ]
        });
        
        if (existingCategory) {
            return res.json({ error: 'Category already exists.' });
        }
        
        let data = { name: categoryName, isListed: true,catoffer:categoryDiscount };
        await category.create(data);
        
        res.json({ success: true, message: 'Category added successfully.' });
    } catch (error) {
        console.error('Error occurred while adding category:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


const categoryListed = async (req, res) => {
    try {
        const categoryName = req.params.name;
        const categoryListed = await user.findOne({ name: categoryName });

        if (!categoryListed) {
            console.log("User Not Found");
            return res.status(404).json({ message: 'User not found' });
        } else {
            console.log("else");
            categoryListed.isUnlisted = !categoryListed.isUnlisted;
            const updatedList = await categoryListed.save();
            console.log(categoryListed.isUnlisted);
            res.redirect('/admin/category');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const logout = (req, res) => {
    // Destroy session
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            return;
        }
        // Redirect to login page after session is destroyed
        res.redirect('/admin/adminlogin');
    });
};


const categoryEditget = async (req, res) => {
    console.log("hello mahn");
    try {
      const id = req.params.id;
    //   console.log("id", id);
      const category = await Category.findById(id);
      console.log(category);
      await Category.findById(id).then((x) => {
        // console.log(x);
        let message
        res.render("admin/CategoryEdit", { category: category ,message : ""});
      });
    } catch (error) {
      console.log(error);
    }
  };

  const categoryEditpost = async (req, res) => {
    try {
        const categoryId = req.params.id; 
        const newName = req.body.editCategoryName;
        const discount = req.body.editCategoryDiscount;
        const category = await Category.findById(categoryId); 

        if (!newName.trim()) {
            return res.status(400).render("admin/CategoryEdit", { message: "Category name cannot be empty", category: category });
        }
        if (category) {
            const existingCategory = await Category.findOne({
                $or: [
                    { name: newName },
                    { name: { $regex: new RegExp('^' + newName + '$', 'i') } }
                ]
            });   
            if (existingCategory) {
                // return res.json({ error: 'Category already exists.' });
                return res.status(400).render("admin/CategoryEdit", { message: "Category already exists", category: category });

                // return  res.render( { category: category ,message : ""});

            }

            category.name = newName; 
            category.catoffer = discount; 
            await category.save(); 
            return res.redirect('/admin/category'); 
        } else {
            return res.status(400).send("Category not found"); 
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error"); 
    }
}


const categorydelete = async (req,res)=>{
const catid = req.params.id;

    try {
        const deletedCategory = await Category.findByIdAndDelete(catid);
        res.redirect('/admin/category');

    } catch (err) {
        // Handle errors
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }

}


const deleteimageProductEdit = async (req, res) => {
    try {
      const id = req.params.id;
      const indexToRemove = req.body.index;
      const unsetQuery = { $unset: { [`images.${indexToRemove}`]: 1 } };
      await Product.findByIdAndUpdate(id, unsetQuery);
      await Product.findByIdAndUpdate(id, { $pull: { image: null } }); 
      const updatedProduct = await Product.findById(id);
  
      if (updatedProduct) {
        console.log(updatedProduct);
        res
          .status(200)
          .json({
            success: true,
            message: "Image deleted successfully",
            data: updatedProduct,
          });
      } else {
        res
          .status(404)
          .json({ success: false, message: "Index not found in image array" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error"});
  }
  };


  const orderList= async (req,res)=>{     
    try{
        res.locals.orders=await order.find({}).populate('items.product').sort({ createdAt: -1 })    
        res.render('admin/adminOrder',{dark:4})        
    }
    catch(err){
    console.error(err)
    }
    }

// const orderList = async (req, res) => {
//     try {
//         const orders = await order.find({}).populate('items.product').sort({ createdAt: 1 });
//         console.log(orders);
//         res.locals.orders = orders;
//         res.render('admin/adminOrder', { dark: 4 });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Internal Server Error');
//     }
// };


  const cancel_order=async(req,res)=>{
        try {
            let a=await order.findOne({order:req.params.id}).select('status')
            a.status.order=false
            a.markModified('status.order');
            a.save()
            res.redirect('/admin/adminOrder')
        } catch (error) {
            console.log(error)
            res.send(error)
        }
    }

    const update_Order_Status = async(req,res)=>{
        try {
            const { orderId, itemId, status } = req.body;
            console.log(req.body);
            // Find the order by orderId and update the status of the item with itemId
            const Order = await order.findOneAndUpdate(
                { '_id': orderId, 'items._id': itemId },
                { $set: { 'items.$.status': status } },
                { new: true }
            );   
            if (!Order) {
                return res.status(404).json({ error: 'Order not found or item not present in order' });
            }   
            return res.json(Order);
        } catch (error) {
            console.error('Error updating order status:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

    }

   const couponGet = async (req,res)=>{
        try {
            const coupons = await Coupoun.find();
            res.render('admin/adminCoupon',{coupons})

        } catch (error) {
            
        }
    }

    const addCoupon = async(req,res)=>{
        try {
            const coupons = await Coupoun.find();
            res.render('admin/addCoupon',{coupons})
            
        } catch (error) {
            
        }
    }


  
  
  const CreateCoupoun = async (req, res) => {
    try {
                console.log('Received data:', req.body);
                const { couponCode, discountAmount, discountType, expiryDate } = req.body;
        
                // Create a new coupon instance with the received data
                const couponDetails = new Coupoun({
                    couponName:couponCode,
                    couponPercent:discountType,
                    maxValue: discountAmount,
                    expiryDate:expiryDate,
                });
                               
                await couponDetails.save();
        
                // Send a success response
                res.status(201).json({ message: "Coupon created successfully" });              
                 
            } catch (error) {
                // Handle errors
                console.error('Error creating coupon:', error);
                res.status(500).json({ message: "Coupon creation failed: " + error.message });
            }
  };


const couponDelete = async (req, res) => {
    try {
        const couponId = req.params.id; 
        await Coupoun.findByIdAndDelete(couponId);
       return  res.redirect('/admin/coupon');
        
    } catch (error) {
        // Handle errors
        console.error('Error deleting coupon:', error);
        res.status(500).json({ message: 'Coupon deletion failed: ' + error.message });
    }
};


// const sales = async(req,res)=>{
//     try {

//         res.render('admin/salesReport')
        
//     } catch (error){
        
//     }
// }


// const sales = async (req, res) => {
//     try {
//       const startDate = req.query.startDate;
//       const endDate = req.query.endDate;
//       let salesReport = [];
//       const query = {};
//        let orderlist = await order.find({}).populate('items.product')
//       if (startDate && endDate) {
//         query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
//       } else if (startDate) {
//         query.createdAt = { $gte: new Date(startDate) };
//       } else if (endDate) {
//         query.createdAt = { $lte: new Date(endDate) };
//       }
      
//       salesReport = orderList.map((order) => {
//         let orderDetails = {};
//         order.products.forEach((productList) => {
//           order.proCartDetail.forEach((value) => {
//             orderDetails = {
//               name: productList.name,
//               address: order.address,
//               quantity: productList.quantity,
//               price: productList.realPrice,
//               createdAt: order.createdAt,
//               totalprice: value.OriginalPrice,
//               paymentMethod: order.payment,
//             };
//           });
//         });
  
//         orderDetails.payment = order.payment;
//         return orderDetails;
//       });
//       console.log(salesReport, "sales report new object");
//       req.session.salesReport = salesReport;  
//       res.render("admin/salesReport", { salesReport });
//     } catch (error) {
//       console.error("Error generating sales report:", error);
//       res.status(500).send("Internal server error");
//     }
//   };




const sales = async (req, res) => {
    try {
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        let salesReport = [];
        // const query = {};
        let orderQuery = {};
        if (startDate && endDate) {
            orderQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (startDate) {
            orderQuery.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            orderQuery.createdAt = { $lte: new Date(endDate) };
        }

        // Fetch orders with populated product details
        let orderList = await order.find(orderQuery).populate('items.product');
      
        salesReport = orderList.map((order) => {
            console.log('uyfftffgfgfgfg',order.items)
            // Map over each order to extract relevant details
            return order.items.map((item) => {
                return {
                    name: item.product.name,
                    address: order.shippingAddress,
                    quantity: item.quantity,
                    price: item.unitPrice,
                    createdAt: order.createdAt,
                    totalprice: order.TotalPrice,
                    paymentMethod: order.paymentMethod,
                };
            });
        }).flat(); // Flatten the array since we have nested arrays due to mapping over items
        console.log(salesReport, "sales report new object");
        req.session.salesReport = salesReport;
        res.render("admin/salesReport", { salesReport });
    } catch (error) {
        console.error("Error generating sales report:", error);
        res.status(500).send("Internal server error");
    }
};




const generatePDF = async (req, res) => {
    try {
      const doc = new PDFDocument();
  
      const salesReport = req.session.salesReport;
      const username = req.session.username;
      if (!Array.isArray(salesReport)) {
        salesReport = [];
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="sales_report.pdf"');
      doc.pipe(res);
  
      // Styling
      doc.font("Helvetica-Bold");
      const headerColor = "#333";
      const rowColor = "#666";
  
      // Add content to the PDF document
      doc.fontSize(24).fillColor(headerColor).text("iStore", { align: "center" }).moveDown();
      doc.fontSize(20).fillColor(headerColor).text("Sales Report", { align: "center" }).moveDown();
  
      for (let i = 0; i < salesReport.length; i++) {
        const report = salesReport[i];
  
        const paymentMethod = report.payment.method
          .map((x) => {
            return x.mode;
          })
          .join(" ,");
  
        doc.moveDown().fillColor(rowColor);
        doc.text(`Product Name: ${report.name}`);
        doc.text(`Price: ${report.price}`);
  
        if (report.totalprice !== undefined) {
          doc.text(`OfferPrice: ${report.payment.method.reduce((acc, x) => acc + parseFloat(x.amount), 0)}`);
  
          doc.text("Offer Price: Not Available");
        }
        doc.text(`Quantity: ${report.quantity}`);
  
        if (report.address && report.address.length > 0) {
          const address = report.address[0];
          doc.text(`Customer Name: ${address.name}`);
          doc.text(`House Name: ${address.housename}`);
          doc.text(`City: ${address.city}`);
          doc.text(`Postal Code: ${address.zipcode}`);
        } else {
          doc.text("Address Not Available");
        }
  
        const formattedDate = new Date(report.createdAt).toLocaleDateString('en-GB');
  
        doc.text(`Date of Purchase: ${formattedDate}`);
        doc.text(`Payment Method: ${paymentMethod}`);
        doc
          .strokeColor(rowColor)
          .lineWidth(1)
          .moveTo(50, doc.y + 15)
          .lineTo(550, doc.y + 15)
          .stroke();
      }
  
      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  const downloadExcel = async (req, res) => {
    try {
      const salesReport = req.session.salesReport;
      if (!Array.isArray(salesReport) || salesReport.length === 0) {
        throw new Error("Data is empty or not an array");
      }
  
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");
  
      worksheet.columns = [
        { header: "Product Name", key: "name", width: 20 },
        { header: "Date", key: "createdAt", width: 15 },
        { header: "Quantity", key: "quantity", width: 15 },
        { header: "Price", key: "price", width: 15 },
        { header: "Customer Name", key: "customerName", width: 20 },
        { header: "House Name", key: "housename", width: 20 },
        { header: "Postal Code", key: "zipcode", width: 15 },
        { header: "Payment Method", key: "paymentMethod", width: 20 },
      ];
  
      salesReport.forEach((item) => {
        const address = item.address && item.address.length > 0 ? item.address[0] : {};
  
        const formattedDate = item.createdAt ? new Date(item.createdAt).toISOString().split("T")[0] : "";
  
        const paymentMethod = item.payment.method.map((x) => {
          return x.mode;
        });
  
        worksheet.addRow({
          name: item.name || "",
          createdAt: formattedDate,
          quantity: item.quantity || "",
          price: Buffer.from("₹" + item.price).toString('base64'),
          customerName: address.name || "",
          housename: address.housename || "",
          city: address.city || "",
          postalCode: address.zipcode || "",
          paymentMethod: paymentMethod.join(", "),
        });
      });
  
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=sales_report.xlsx"); 
      await workbook.xlsx.write(res);
  
      res.end();
    } catch (error) {
      console.error("Error generating Excel:", error.message);
      res.status(500).send("Internal Server Error: " + error.message);
    }
  };

    module.exports={
    dashboard ,
    loginget,
    loginpost,
    adminhome,
    categorydelete,
    home,
    userlist,
    userBlocked,
    logout,
    productpage,
    addproductpost,
    editproduct,
    editproductpost,
    deleteproductRestore,
    productstatus,
    categorypage,
    addCategory,
    categoryListed,
    categorydelete,
    categoryEditget,
    categoryEditpost,
    deleteimageProductEdit,
    orderList,
    cancel_order,
    update_Order_Status,
    couponGet,
    addCoupon,
    couponDelete,
    CreateCoupoun,
    sales,
    generatePDF,
    downloadExcel,
  
    }


