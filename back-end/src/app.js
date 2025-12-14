import express from 'express'

let app=express();

app.use(express.json());

app.get("/",(req,res)=>{
    console.log("  Home get api is called ");
    res.send("api is called ")
})
 
export default app;