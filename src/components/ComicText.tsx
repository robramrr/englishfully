import React from 'react';

interface ComicTextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'light' | 'normal' | 'bold';
}

const ComicText: React.FC<ComicTextProps> = ({
  children,
  className = '',
  size = 'lg',
  weight = 'normal',
}) => {
  const baseClasses = weight === 'bold' ? 'comic-text-bold' : 'comic-text';
  
  const sizeClasses = {
    sm: 'text-lg md:text-xl lg:text-2xl',
    md: 'text-lg md:text-xl lg:text-2xl',
    lg: 'text-lg md:text-xl lg:text-2xl',
    xl: 'text-xl md:text-2xl lg:text-3xl',
  };
  
  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    bold: 'font-bold',
  };
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${weightClasses[weight]} ${className}`;
  
  return (
    <p className={classes}>
      {children}
    </p>
  );
};

export default ComicText;
