import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";
import { adminOnly } from "@/lib/middleware/admin";

export async function GET(req) {
    try {
        // middleware returns a response if not allowed
        const reject = await adminOnly(req);
        if (reject) {
            return reject;
        }

        await dbConnect();
        const totalUsers = await User.countDocuments();
        const totalPaid = await User.countDocuments({ isPaid: true });

        return NextResponse.json({ totalUsers, totalPaid }, { status: 200 });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
