import dbConnect from "@/lib/mongodb";
import Wish from "@/lib/models/Wish";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    try {
        const p = await params;
        await dbConnect();

        const wish = await Wish.findById(p.id).lean();

        if (!wish) {
            return NextResponse.json(
                { message: "Wish not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(wish, { status: 200 });
    } catch (error) {
        console.error("Error fetching wish:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(req, { params }) {
    try {
        const p = await params;
        const body = await req.json();
        await dbConnect();

        const wish = await Wish.findByIdAndUpdate(
            p.id,
            {
                $set: {
                    isClaimed: body.isClaimed,
                    score: body.score,
                    bankDetails: body.bankDetails,
                },
            },
            { new: true }
        );

        if (!wish) {
            return NextResponse.json(
                { message: "Wish not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(wish, { status: 200 });
    } catch (error) {
        console.error("Error updating wish:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
