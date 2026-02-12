import React from 'react';
import { Package2 } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  // Try to load the logo image, fallback to icon if not available
  const [imageError, setImageError] = React.useState(false);

  // Try different image formats
  const logoSources = ['/logo.svg', '/logo.png', '/logo.jpg'];
  const [currentSource, setCurrentSource] = React.useState(0);

  const handleImageError = () => {
    if (currentSource < logoSources.length - 1) {
      setCurrentSource(currentSource + 1);
    } else {
      setImageError(true);
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Logo without background container - just the image/icon */}
      {!imageError ? (
        <img
          src={logoSources[currentSource]}
          alt="LogiCore Logo"
          className={`${sizeClasses[size]} object-contain`}
          onError={handleImageError}
        />
      ) : (
        <div className="p-2 bg-primary rounded-lg">
          <Package2 className={`${sizeClasses[size]} text-white`} />
        </div>
      )}
      {showText && (
        <span className={`font-bold text-foreground ${textSizeClasses[size]}`}>
          LogiCore
        </span>
      )}
    </div>
  );
}