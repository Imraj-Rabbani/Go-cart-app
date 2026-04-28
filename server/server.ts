import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import { clerkMiddleware } from '@clerk/express'
import { clerkWebhook } from "./controllers/webhooks.js";
import makeAdmin from "./scripts/makeAdmin.js";
import ProductRouter from "./routes/productRoutes.js";
import CartRouter from "./routes/cartRoutes.js"
import OrderRouter from "./routes/ordersRoutes.js";
import AddressRouter from "./routes/addressRoutes.js";
import AdminRouter from "./routes/adminRoutes.js";
import StoreRouter from "./routes/storeRoutes.js";
import StoreOwnerRouter from "./routes/storeOwnerRoutes.js";
import DesignRouter from "./routes/designRoutes.js";

const app = express();

//Connect to mongoDB
await connectDB();

app.post('/api/clerk', express.raw({type: 'application/json'}), clerkWebhook)

// Middleware
app.use(cors())
app.use(express.json());
app.use(clerkMiddleware())

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use("/api/products",ProductRouter);
app.use("/api/cart", CartRouter)
app.use("/api/orders", OrderRouter)
app.use("/api/addresses", AddressRouter)
app.use('/api/admin', AdminRouter)
app.use("/api/stores", StoreRouter)
app.use("/api/store-owner", StoreOwnerRouter)
app.use("/api/designs", DesignRouter)


await makeAdmin();

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
