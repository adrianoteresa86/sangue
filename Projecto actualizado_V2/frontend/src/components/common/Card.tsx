import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  footer,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      {...props}
    >
      {(title || description) && (
        <div className="p-6 border-b border-gray-200">
          {title && <h3 className="text-xl font-bold text-gray-900">{title}</h3>}
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">{footer}</div>}
    </div>
  );
};
