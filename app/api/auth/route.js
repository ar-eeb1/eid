import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { username, password, action } = await req.json();

        if (!username || !password || !action) {
            return NextResponse.json(
                { message: "Username, password and action are required" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find the user
        let user = await User.findOne({ username });

        if (action === "signup") {
            if (user) {
                return NextResponse.json({ message: "Username already exists" }, { status: 409 });
            }
            user = new User({ username, password });
            await user.save();
            return NextResponse.json({ user, message: "User created successfully" }, { status: 201 });
        } else if (action === "login") {
            if (!user) {
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }
            if (user.password !== password) {
                return NextResponse.json({ message: "Invalid password" }, { status: 401 });
            }
            return NextResponse.json({ user, message: "Login successful" }, { status: 200 });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Auth Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
