import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";
import { adminOnly } from "@/lib/middleware/admin";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get("username");
        const search = searchParams.get("search");

        await dbConnect();

        // Find the requester to check role
        const requester = await User.findOne({ username });

        if (!requester || (requester.role !== "admin" && requester.role !== "master")) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        // Admin stats (needed for both admin and master)
        const totalUsers = await User.countDocuments();
        const totalPaid = await User.countDocuments({ isPaid: true });

        if (requester.role === "master") {
            // Master can see all users, including passwords
            const query = {};
            if (search) {
                query.username = { $regex: search, $options: "i" };
            }
            const users = await User.find(query).sort({ createdAt: -1 });
            return NextResponse.json({ users, totalUsers, totalPaid }, { status: 200 });
        }

        return NextResponse.json({ totalUsers, totalPaid }, { status: 200 });
    } catch (error) {
        console.error("Admin API error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PATCH(req) {
    try {
        const { searchParams } = new URL(req.url);
        const requesterUsername = searchParams.get("username");
        const body = await req.json();
        const { userId, isPaid } = body;

        await dbConnect();

        // Check if requester is master
        const requester = await User.findOne({ username: requesterUsername });
        if (!requester || requester.role !== "master") {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { isPaid },
            { new: true }
        ).select("-password");

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error("Admin PATCH error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
