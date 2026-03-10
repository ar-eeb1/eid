'use client'
import React from 'react'

// controlled popup component; visibility and close handler are passed in
const Popup = ({ open, setOpen }) => {
    if (!open) return null;

    return (
        <div>
            {/* Popup */}
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">

                {/* Popup Box */}
                <div className="bg-white p-6 rounded-lg shadow-lg w-[350px] relative">

                    {/* Close Button */}
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute top-2 right-3 text-gray-500 text-xl"
                    >
                        ✕
                    </button>

                    <h2 className="text-xl font-bold mb-4">Contact Me</h2>

                    <div className="space-y-2 text-gray-700">
                        <p>Email: areebamir.pk@gmail.com</p>
                        <p>Phone: +92 370 0182844</p>
                        <p className='hover:text-orange-500'>Website: <a target='blank' href="https://bit.ly/4cz6CBt">Areeb Portfolio</a></p>
                        <a className='hover:text-green-500' target='_blank' href="https://wa.me/923700182844?text=Hi%20I%20want%20to%20place%20advertisement%20on%20your%20website">Contact Whatsapp: 03700182844</a>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Popup
