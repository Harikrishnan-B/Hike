
const express= require('express');
const router =express.Router();
const admincontroller = require("../controllers/admincontroller");
const upload = require("../middleware/multer");


const adminCheck = (req, res, next) => {
    // const admin = req.session.admin;
    // if (!admin) {
    //   return res.redirect("/admin/login");
    // } else {
    next();
    // }
  };

router.get("/login",admincontroller.loginget);
router.post("/login",admincontroller.loginpost);
router.get("/adminhome",adminCheck,admincontroller.adminhome);
router.get("/dashboard",adminCheck,admincontroller.home);
router.get("/adminDashboard",adminCheck,admincontroller.dashboard);
// router.post('/line-graph', admincontroller.lineGraph);
// router.post('/bar-graph', admincontroller.barGraph);
// router.post('/doughnut-graph', admincontroller.doughnutGraph);
// router.post('/doughnut-category-graph', admincontroller.doughnutGraph2);
router.get("/userlist",adminCheck,admincontroller.userlist);
router.get('/blocked/:id',admincontroller.userBlocked);
router.get('/product',adminCheck,admincontroller.productpage);

// router.post('/addproduct',admincontroller.addproductpost);
router.post('/product',adminCheck,upload,admincontroller.addproductpost);
router.get('/adminedit/:id',admincontroller.editproduct);
router.post('/adminedit/:id',upload,admincontroller.editproductpost);

router.post('/delete-image/:id',upload,admincontroller.deleteimageProductEdit);
// router.get('/delete/:id',admincontroller.deleteproductGet);
router.post('/productstatus/:id',admincontroller.productstatus);
router.put('/:id/restore',admincontroller.deleteproductRestore);
router.get("/logout",admincontroller.logout);


// .......................... CateGory.............................

router.get('/category',adminCheck,admincontroller.categorypage);
router.get('/catdelete/:id',admincontroller.categorydelete);
router.post('/newcategory',admincontroller.addCategory);
router.get('/newcategory',admincontroller.categoryListed);
router.get('/categoryEdit/:id',admincontroller.categoryEditget);
router.post('/categoryEdit/:id',admincontroller.categoryEditpost);

// ............................Order..........................

router.get('/adminOrder',adminCheck,admincontroller.orderList);
router.get('/adminOrder/cancel/:id',admincontroller.cancel_order);
router.post('/update-order-status',admincontroller.update_Order_Status);


// .......................Coupon...........................


router.get('/coupon',adminCheck,admincontroller.couponGet);
router.get('/addcoupon',adminCheck,admincontroller.addCoupon);
router.get("/coupoun/delete/:id",adminCheck,admincontroller.couponDelete);
router.post("/addcoupon",adminCheck,admincontroller.CreateCoupoun)


// .................Sales.......................
router.get('/sales',adminCheck,admincontroller.sales);
router.get('/pdf',admincontroller.generatePDF);
router.post('/excel', admincontroller.downloadExcel);



 module.exports = router;