import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button, Icon } from './ui';

interface QrScannerProps {
    onScan: (decodedText: string) => void | boolean | Promise<void | boolean>;
    onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const resolvingRef = useRef(false);

    useEffect(() => {
        scannerRef.current = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scannerRef.current.render(
            async (decodedText) => {
                if (resolvingRef.current) return;
                resolvingRef.current = true;
                try {
                    const result = await onScan(decodedText);
                    if (result !== false && scannerRef.current) {
                        await scannerRef.current.clear();
                        onClose();
                    }
                } finally {
                    resolvingRef.current = false;
                }
            },
            (error) => {
                // console.error(error);
            }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <h3 className="font-extrabold text-slate-900">Scan QR Code</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close QR scanner">
                        <Icon name="x" className="h-5 w-5" />
                    </Button>
                </div>
                <div className="p-4">
                    <div id="qr-reader" className="overflow-hidden rounded-lg border border-slate-200"></div>
                    <p className="mt-4 text-center text-xs font-medium text-slate-500">Point your camera at the inventory QR code.</p>
                </div>
            </div>
        </div>
    );
}
