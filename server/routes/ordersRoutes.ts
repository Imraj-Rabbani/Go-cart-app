import express from "express";
import {
    createOrder,
    getAllOrders,
    getOrder,
    getOrders,
    initBkashPayment,
    sslcommerzCancel,
    sslcommerzFail,
    sslcommerzIpn,
    sslcommerzSuccess,
    updateOrderStatus
} from "../controllers/ordersControllers.js";
import { authorize, protect } from "../middleware/auth.js";

const OrderRouter = express.Router()

OrderRouter.post("/sslcommerz/success/:orderId", sslcommerzSuccess)
OrderRouter.post("/sslcommerz/fail/:orderId", sslcommerzFail)
OrderRouter.post("/sslcommerz/cancel/:orderId", sslcommerzCancel)
OrderRouter.post("/sslcommerz/ipn/:orderId", sslcommerzIpn)
OrderRouter.get("/", protect, getOrders)
OrderRouter.get("/admin/all", protect, authorize("admin"), getAllOrders)

OrderRouter.get("/:id", protect, getOrder)

OrderRouter.post("/", protect, createOrder)
OrderRouter.post("/sslcommerz/init", protect, initBkashPayment)

OrderRouter.put("/:id/status", protect,authorize("admin"), updateOrderStatus)

export default OrderRouter
