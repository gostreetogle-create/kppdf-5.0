'use client';

import { forwardRef, useState, type ReactNode } from 'react';
import Image, { type ImageProps } from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  size?: AvatarSize;
  fallback?: ReactNode;
  initials?: string;
  src?: ImageProps['src'];
  alt?: string;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ size = 'md', fallback, initials, src, alt, className }, ref) => {
    const [imgError, setImgError] = useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted',
          sizeStyles[size],
          className,
        )}
      >
        {src && !imgError ? (
          <Image
            src={src}
            alt={alt || ''}
            fill
            sizes="100%"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : initials ? (
          <span className="font-medium text-muted-foreground">{initials}</span>
        ) : fallback ? (
          fallback
        ) : (
          <User className="h-1/2 w-1/2 text-muted-foreground" />
        )}
      </div>
    );
  },
);
Avatar.displayName = 'Avatar';
