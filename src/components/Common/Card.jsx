import React from 'react';

export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`card p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
