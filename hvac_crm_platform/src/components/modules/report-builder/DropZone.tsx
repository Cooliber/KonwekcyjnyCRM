import React from 'react';
import { useDrop } from 'react-dnd';
import { 
  Plus, 
  Database,
  BarChart3,
  Target
} from 'lucide-react';

interface DropZoneProps {
  onDrop: (item: any) => void;
  accepts: string[];
  children?: React.ReactNode;
  className?: string;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function DropZone({ 
  onDrop, 
  accepts, 
  children, 
  className = '',
  placeholder = 'Drop items here',
  icon: Icon = Database
}: DropZoneProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: accepts,
    drop: (item: any, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) return;
      onDrop(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const getDropZoneStyle = () => {
    if (isOver && canDrop) {
      return 'border-blue-500 bg-blue-50 border-solid';
    }
    if (canDrop) {
      return 'border-blue-300 bg-blue-25 border-dashed';
    }
    return 'border-gray-300 border-dashed hover:border-gray-400';
  };

  return (
    <div
      ref={drop}
      className={`
        min-h-32 border-2 rounded-lg p-4 transition-all duration-200
        ${getDropZoneStyle()}
        ${className}
      `}
    >
      {children || (
        <div className="text-center text-gray-500 py-8">
          <Icon className={`w-12 h-12 mx-auto mb-3 transition-colors ${
            isOver && canDrop ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <p className="text-sm font-medium">{placeholder}</p>
          <p className="text-xs mt-1">
            {isOver && canDrop 
              ? 'Release to add' 
              : `Drag ${accepts.join(' or ')} here`
            }
          </p>
        </div>
      )}
    </div>
  );
}
