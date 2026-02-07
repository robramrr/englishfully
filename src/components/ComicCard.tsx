import React from 'react';

interface ComicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  animated?: boolean;
}

const ComicCard: React.FC<ComicCardProps> = ({
  children,
  className = '',
  variant = 'default',
  animated = false,
}) => {
  const baseClasses = 'comic-card';
  
  const variantClasses = {
    default: 'bg-[var(--comic-white)]',
    primary: 'comic-bg-primary text-white',
    secondary: 'comic-bg-secondary text-white',
    accent: 'comic-bg-accent text-white',
  };
  
  const animatedClasses = animated ? 'comic-bounce' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${animatedClasses} ${className}`;
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default ComicCard;
