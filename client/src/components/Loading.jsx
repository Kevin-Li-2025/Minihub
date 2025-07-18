import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className={`${sizeClasses[size]} text-primary-600 animate-spin`} />
      {text && (
        <p className="mt-2 text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
};

export default Loading; 