import React from 'react';

interface ComicButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'warning' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const ComicButton: React.FC<ComicButtonProps> = ({
  children,
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const baseClasses = 'comic-button inline-block text-center no-underline cursor-pointer';
  
  const variantClasses = {
    primary: 'comic-bg-primary text-white hover:brightness-110',
    secondary: 'comic-bg-secondary text-white hover:brightness-110',
    accent: 'comic-bg-accent text-white hover:brightness-110',
    warning: 'comic-bg-warning text-black hover:brightness-110',
    success: 'comic-bg-success text-white hover:brightness-110',
    danger: 'comic-bg-danger text-white hover:brightness-110',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-base',
    md: 'px-6 py-3 text-lg',
    lg: 'px-8 py-4 text-xl',
  };
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-[var(--comic-shadow-md)]' 
    : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;
  
  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  
  return (
    <button 
      onClick={onClick} 
      className={classes}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default ComicButton;
