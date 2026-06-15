'use client';

import { forwardRef } from 'react';

interface A4PageProps {
  children: React.ReactNode;
  backgroundImage?: string;
  backgroundOpacity?: number;
  scale?: number;
  editable?: boolean;
}

export const A4Page = forwardRef<HTMLDivElement, A4PageProps>(
  ({ children, backgroundImage, backgroundOpacity = 1, scale = 1, editable = false }, ref) => {
    return (
      <div
        className="relative mx-auto"
        style={{
          width: '210mm',
          minHeight: '297mm',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        <div
          ref={ref}
          className="relative bg-white shadow-lg overflow-hidden"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
          }}
        >
          {backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center pointer-events-none"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                opacity: backgroundOpacity,
              }}
            />
          )}

          <div className="relative z-10">
            {children}
          </div>

          {editable && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 select-none">
              A4 · 210×297 мм
            </div>
          )}
        </div>
      </div>
    );
  }
);

A4Page.displayName = 'A4Page';
