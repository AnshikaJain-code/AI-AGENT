import express from 'express'
import {login_c} from '../controllers/login_controller.js'
 const router_login =express.Router();
 router_login.post("/",login_c);
 export default router_login;