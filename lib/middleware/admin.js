import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

// simple admin check based on username query parameter or request body
export async function adminOnly(req) {
    const url = new URL(req.url);
    let username = url.searchParams.get("username");

    // support POST/PUT with body containing username
    if (!username && req.json) {
        try {
            const body = await req.json();
            username = body.username;
        } catch {
            // ignore parse errors
        }
    }

    if (!username) {
        return NextResponse.json({ message: "username is required for admin routes" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ username }).lean();
    if (!user || user.role !== "admin") {
        return NextResponse.json({ message: "Forbidden: admin access only" }, { status: 403 });
    }

    // ok to proceed
    return null;
}
