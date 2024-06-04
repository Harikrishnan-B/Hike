const express = require('express');
const router = express.Router();
const usercontroller = require('../controllers/usercontroller');
const {checkblock} = require("../middleware/checkblock");




router.get("/signup",usercontroller.signup);
router.post("/signup",usercontroller.signuppost);
router.get("/login",usercontroller.loginget);
router.post("/login",usercontroller.loginpost);
router.get("/home",checkblock,usercontroller.home);
router.post("/home",checkblock,usercontroller.homePost);
router.get('/',usercontroller.homebeforelogin);
// router.get("/signout",usercontroller.logout);
router.get('/description/:id',usercontroller.description);
router.get("/Leather",usercontroller.LeatherHome);
router.get("/Clogs",usercontroller.clogHome);
router.get("/Sports",usercontroller.Sports);
router.get("/Sneakers",usercontroller.Sneakers);
router.get('/otpget',usercontroller.mailsender);
router.post('/verifyotp',usercontroller.otpvalidation);
router.get('/resendotp',usercontroller.resendotp)
router.get('/profile',usercontroller.profile);
router.post('/profile',usercontroller.profilePost);
router.get('/logout',usercontroller.logout);
router.get('/forgetPassword',usercontroller.forgetPassword);
router.post('/forgetPassword',usercontroller.forgetPasswordPost);
router.get('/forgetPassOTP',usercontroller.forgetPassOTP);
router.post('/forgetPassOTP',usercontroller.forgetPassOTPpost);
router.post('/forgetPassOTP',usercontroller.forgetPassOTPpost);
router.get('/forgetPassPage',usercontroller.forgetPasswordPage);
router.post('/forgetPasswordPage',usercontroller.forgetPasswordPagePost);


// ................Address............
router.get('/address',usercontroller.address);
router.post('/address',usercontroller.addresspost)
router.post('/addressadd',usercontroller.addresspostadd)
router.get('/security',usercontroller.password)
router.post('/security',usercontroller.passwordpost)
router.get('/deleteaddress/:id',usercontroller.addressdelete);
router.post('/addressEdit/:id',usercontroller.addressEdit);
router.get('/addressEdit/:id',usercontroller.getAddress);
// router.get('/password/',usercontroller. accdPassword);




//............Add-to-cart...............//
router.get('/addcart',usercontroller.cart);
router.post('/addcart/:id',usercontroller.addToCart);
// router.post('/add-to-cart/:id',usercontroller. descriptionPost );
router.post('/removeFromCart/:id', usercontroller.removeProductFromCart);
router.get('/checkout',usercontroller.checkout);
router.post('/createorderraz',usercontroller.createrazorpayorder);
router.post('/failedpay',usercontroller.failedpay);
router.post('/createorder',usercontroller.checkoutPost);
router.get('/confirmOrder',usercontroller.confirmOrder);
router.get('/orderPage',usercontroller.OrderPage);
router.post('/cancelOrder',usercontroller.cancelOrder);
router.get('/wallet',usercontroller.wallet);
router.post('/addWallet',usercontroller.walletAdd );
router.post('/return',usercontroller.orderreturn);
router.get('/orderDetails/:orderId', usercontroller.viewOrderDetails);
router.get('/generateInvoice/:id',usercontroller.generateInvoice)



// .........Wish-List...........
router.get('/wishlist', usercontroller.wishlist);
router.post('/wishlist/:id', usercontroller.wishlistPost);
router.get('/wishdelete/:id',usercontroller.wishDelete);

//..........Coupon..............
router.get('/coupon/:id',usercontroller.coupon)
router.get('/couponRemove',usercontroller.couponRemove)


router.get('/auth/google', usercontroller.loginAuth);
router.get('/auth/google/callback', usercontroller.loginAuthRedirect)




router.get('/footer1', usercontroller.footer1)
router.get('/footer2', usercontroller.footer2)
router.get('/footer3', usercontroller.footer3)
router.get('/footer4', usercontroller.footer4)
router.get('/footer5', usercontroller.footer5)
router.get('/category/:name',usercontroller.cat)








module.exports=router;