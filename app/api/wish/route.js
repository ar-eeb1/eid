import dbConnect from "@/lib/mongodb";
import Wish from "@/lib/models/Wish";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const data = await req.json();
        await dbConnect();

        const wish = new Wish(data);
        await wish.save();

        return NextResponse.json({ id: wish._id }, { status: 201 });
    } catch (error) {
        console.error("Error creating wish:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const creator = searchParams.get("creator");

        if (!creator) {
            return NextResponse.json(
                { message: "Creator is required" },
                { status: 400 }
            );
        }

        await dbConnect();
        const wishes = await Wish.find({ creator }).sort({ createdAt: -1 }).lean();

        return NextResponse.json(wishes, { status: 200 });
    } catch (error) {
        console.error("Error fetching user wishes:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
