import React from 'react';

interface ComicTitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  animated?: boolean;
}

const ComicTitle: React.FC<ComicTitleProps> = ({
  children,
  level = 1,
  className = '',
  animated = false,
}) => {
  const baseClasses = 'comic-title';
  
  const sizeClasses = {
    1: 'text-5xl md:text-6xl',
    2: 'text-4xl md:text-5xl',
    3: 'text-3xl md:text-4xl',
    4: 'text-2xl md:text-3xl',
    5: 'text-xl md:text-2xl',
    6: 'text-lg md:text-xl',
  };
  
  const animatedClasses = animated ? 'comic-wiggle' : '';
  
  const classes = `${baseClasses} ${sizeClasses[level]} ${animatedClasses} ${className}`;
  
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  
  return (
    <Tag className={classes}>
      {children}
    </Tag>
  );
};

export default ComicTitle;
