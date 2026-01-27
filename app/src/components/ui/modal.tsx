import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children, footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="relative w-full max-w-2xl bg-brand-dark border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-brand-yellow to-brand-red"></div>

                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight uppercase italic">{title}</h3>
                            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-white">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="py-4 text-white">
                        {children}
                    </div>

                    {footer && (
                        <div className="mt-8 flex justify-end gap-3 border-t border-gray-800 pt-6">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
