'use client'

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Popup = dynamic(() => import("@/components/Popup"), { ssr: false });

export default function LayoutContent({ children }) {
    const [open, setOpen] = React.useState(false);

    return (
        <div className="flex min-h-screen ">
            {/* Left Vertical Ad Section */}
            <aside className="lg:w-32 md:w-16 w-13 bg-emerald-900 sticky top-0 h-screen flex items-center justify-center ">
                <div className="rotate-270 flex items-between gap-30">
                    <button onClick={() => setOpen(true)} className="bg-emerald-500 rounded-full px-2  min-w-56 text-sm text-white cursor-pointer ">
                        Place your ad here!
                    </button>
                    <a href="/" className="bg-emerald-950 shadow-lg rounded-full px-2  min-w-40 text-sm text-white cursor-pointer ">
                        CREATE YOUR WISH
                    </a>
                </div>

            </aside>

            {/* Main Content */}
            <main className="flex-1 relative">
                <div className="absolute flex items-center justify-center">
                    hello
                </div>
                {children}
            </main>

            {/* global popup component */}
            <Popup open={open} setOpen={setOpen} />
        </div>
    );
}
