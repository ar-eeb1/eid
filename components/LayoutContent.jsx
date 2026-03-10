'use client'

import React from "react";
import dynamic from "next/dynamic";

const Popup = dynamic(() => import("@/components/Popup"), { ssr: false });

export default function LayoutContent({ children }) {
    const [open, setOpen] = React.useState(false);

    return (
        <div className="flex min-h-screen">
            {/* Left Vertical Ad Section */}
            <aside className="lg:w-32 md:w-16 w-13 bg-emerald-900 sticky top-0 h-screen flex items-center justify-center">
                <button onClick={() => setOpen(true)} className="bg-emerald-500 rounded-full px-2 rotate-90 min-w-56 text-sm text-white cursor-pointer ">
                    Place your ad here!
                </button>
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
