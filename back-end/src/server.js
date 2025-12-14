import app from './app.js'
import connectDB from "./config/db.js";
import signup_router from "./routes/user_signup.js"
import login_router from "./routes/user_login.js"
import cors from "cors"
let port=5000;

connectDB();
app.use(cors());
app.use("/signup",signup_router);
app.use("/login",login_router);
app.listen(port,()=>{
    console.log(`server is running on ${port}...`)
    
})