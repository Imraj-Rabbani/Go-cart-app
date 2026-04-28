import User from "../models/User.js";
export const protect = async (req, res, next) => {
    try {
        const { userId } = await req.auth();
        if (!userId) {
            return res.status(401).json({ success: false, message: "Not authorized to access this route" });
        }
        let user = await User.findOne({ clerkId: userId });
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: "Not authorized to access this route" });
    }
};
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Not authorized to access this" });
        }
        next();
    };
};
