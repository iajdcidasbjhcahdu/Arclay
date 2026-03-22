import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product"; // Import to register schema
import User from "@/models/User"; // Import to register schema
import { withAdminProtection } from "@/lib/auth";

// GET all orders (admin)
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;
        const orderStatus = searchParams.get("orderStatus");
        const paymentStatus = searchParams.get("paymentStatus");
        const search = searchParams.get("search") || "";

        await connectDB();

        // Auto-cleanup: Delete pending Razorpay/Stripe orders older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        await Order.deleteMany({
            paymentMethod: { $in: ['razorpay', 'stripe'] },
            paymentStatus: 'pending',
            createdAt: { $lt: sevenDaysAgo }
        });

        // Build match stage
        const matchStage = {
            $or: [
                { paymentMethod: 'cod' },
                {
                    paymentMethod: { $in: ['razorpay', 'stripe'] },
                    paymentStatus: { $ne: 'pending' }
                }
            ]
        };

        if (orderStatus) {
            matchStage.orderStatus = orderStatus;
        }

        if (paymentStatus) {
            matchStage.paymentStatus = paymentStatus;
        }

        // Build aggregation pipeline
        const pipeline = [
            { $match: matchStage },
            // Lookup user data
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
            // Add string version of _id for search
            {
                $addFields: {
                    orderIdStr: { $toString: '$_id' }
                }
            }
        ];

        // Add search conditions if search term exists
        if (search) {
            const searchLower = search.toLowerCase();
            pipeline.push({
                $match: {
                    $or: [
                        // Match partial order ID (last 8 characters shown in UI)
                        { orderIdStr: { $regex: search, $options: 'i' } },
                        // Match user email
                        { 'userInfo.email': { $regex: search, $options: 'i' } },
                        // Match user name
                        { 'userInfo.name': { $regex: search, $options: 'i' } },
                        // Match user phone
                        { 'userInfo.phone': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        // Get total count
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await Order.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        // Add sorting and pagination
        pipeline.push(
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            // Lookup product data for items
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            // Reshape to match expected format
            {
                $project: {
                    _id: 1,
                    user: {
                        _id: '$userInfo._id',
                        name: '$userInfo.name',
                        email: '$userInfo.email',
                        phone: '$userInfo.phone'
                    },
                    items: 1,
                    shippingAddress: 1,
                    paymentMethod: 1,
                    paymentStatus: 1,
                    paymentId: 1,
                    orderStatus: 1,
                    totalAmount: 1,
                    couponCode: 1,
                    discountAmount: 1,
                    notes: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        );

        const orders = await Order.aggregate(pipeline);

        return Response.json({
            success: true,
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get admin orders error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);

// POST - Create order from POS
async function postHandler(req) {
    try {
        const body = await req.json();
        const { items, customerInfo, paymentMethod, paymentStatus, orderStatus, notes } = body;

        if (!items || items.length === 0) {
            return Response.json(
                { success: false, message: "Order must have at least one item" },
                { status: 400 }
            );
        }

        await connectDB();

        // For POS, we don't require a user login
        // Create a guest user or use a placeholder
        let guestUser;
        try {
            // Try to find user by phone, or create a guest user
            const User = (await import("@/models/User")).default;
            guestUser = await User.findOne({ phone: customerInfo?.phone });

            if (!guestUser && customerInfo?.phone) {
                // Create a guest user
                guestUser = await User.create({
                    name: customerInfo?.name || "POS Customer",
                    email: `pos_${Date.now()}@example.com`,
                    phone: customerInfo?.phone || "0000000000",
                    isGuest: true,
                });
            }
        } catch (userErr) {
            console.error("User lookup error:", userErr);
            // Continue without user - use null
            guestUser = null;
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = items.map(item => {
            const price = item.price || 0;
            subtotal += price * item.quantity;
            return {
                product: item.product,
                name: item.name,
                price,
                quantity: item.quantity,
                variant: item.variant || null,
            };
        });

        const total = subtotal;

        // Create order
        const order = await Order.create({
            user: guestUser?._id || null,
            items: orderItems,
            shippingAddress: {
                fullName: customerInfo?.name || "POS Customer",
                phone: customerInfo?.phone || "0000000000",
                addressLine1: "POS Sale",
                addressLine2: "",
                city: "N/A",
                state: "N/A",
                pincode: "000000",
                country: "India",
            },
            subtotal: subtotal,
            shippingFee: 0,
            discountAmount: 0,
            totalAmount: total,
            paymentMethod: paymentMethod || "cash",
            paymentStatus: paymentStatus || "paid",
            orderStatus: orderStatus || "confirmed",
            notes: notes || "POS Walk-in Sale",
        });

        return Response.json({
            success: true,
            message: "Order created successfully",
            order,
        });
    } catch (error) {
        console.error("Create POS order error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

export const POST = withAdminProtection(postHandler);
