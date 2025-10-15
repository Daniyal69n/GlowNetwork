'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function WhatsAppContact({ phoneNumber = '', displayName = '' }) {
	const [open, setOpen] = useState(false);

	const tel = phoneNumber.replace(/\D/g, '');
	const waLink = tel ? `https://wa.me/${tel}` : '#';

	const copyNumber = async () => {
		try {
			await navigator.clipboard.writeText(phoneNumber);
			setOpen(true);
		} catch (_) {
			// ignore
		}
	};

	return (
		<div className="fixed bottom-5 right-5 z-50">
			<div className="flex flex-col items-end gap-2">
				{open && (
					<div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 w-64 border border-gray-100">
						<div className="flex items-center gap-3 mb-3">
							<div className="relative w-6 h-6">
								<Image src="/glow-network-logo.png" alt="Logo" fill className="object-contain" />
							</div>
							<div className="text-sm">
								<p className="font-semibold">{displayName || 'Contact'}</p>
								<p className="text-gray-600 break-all">{phoneNumber || 'Set your number'}</p>
							</div>
						</div>
						<div className="flex gap-2">
							<a
								href={waLink}
								target="_blank"
								rel="noopener noreferrer"
								className="flex-1 bg-[#25D366] text-white text-sm font-medium px-3 py-2 rounded-lg hover:opacity-90 text-center"
							>
								Chat on WhatsApp
							</a>
							<button onClick={copyNumber} className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">
								Copy
							</button>
						</div>
					</div>
				)}
				<button
					onClick={() => setOpen(v => !v)}
					className="rounded-full w-14 h-14 shadow-lg flex items-center justify-center bg-[#25D366] hover:opacity-90"
					aria-label="WhatsApp contact"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="26" height="26">
						<path d="M20.52 3.48A11.78 11.78 0 0012.06 0C5.43 0 .06 5.37.06 12a11.9 11.9 0 001.62 6l-1.68 6 6.17-1.62a12 12 0 005.89 1.56h.01c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.58-8.46zM12.07 22.03h-.01a9.96 9.96 0 01-5.08-1.39l-.36-.21-3.66.96.98-3.56-.24-.37A10 10 0 1122.07 12c0 5.52-4.49 10.03-10 10.03zm5.61-7.54c-.31-.15-1.85-.91-2.14-1.01-.29-.11-.5-.15-.71.15-.21.3-.82 1.01-1 1.22-.18.2-.37.23-.68.08-.31-.15-1.3-.48-2.48-1.53-.92-.82-1.54-1.83-1.72-2.14-.18-.31-.02-.48.13-.63.13-.13.31-.34.46-.51.15-.17.2-.29.3-.49.1-.2.05-.37-.03-.52-.08-.15-.71-1.7-.97-2.33-.26-.63-.52-.54-.71-.55l-.6-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.08 4.5.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.85-.76 2.11-1.49.26-.73.26-1.36.18-1.49-.08-.13-.28-.2-.59-.35z"/>
					</svg>
				</button>
			</div>
		</div>
	);
}


