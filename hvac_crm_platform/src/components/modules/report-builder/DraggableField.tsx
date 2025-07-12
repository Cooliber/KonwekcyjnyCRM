import React from 'react';
import { useDrag } from 'react-dnd';
import { 
  Database, 
  Type, 
  Hash, 
  Calendar, 
  ToggleLeft,
  GripVertical
} from 'lucide-react';

interface DraggableFieldProps {
  table: string;
  field: string;
  type: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function DraggableField({ table, field, type, icon: Icon }: DraggableFieldProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'field',
    item: { 
      type: 'field', 
      table, 
      field, 
      dataType: type,
      id: `${table}.${field}`
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getTypeIcon = () => {
    if (Icon) return Icon;
    
    switch (type) {
      case 'string': return Type;
      case 'number': return Hash;
      case 'date': return Calendar;
      case 'boolean': return ToggleLeft;
      default: return Database;
    }
  };

  const TypeIcon = getTypeIcon();

  const getTypeColor = () => {
    switch (type) {
      case 'string': return 'text-blue-600';
      case 'number': return 'text-green-600';
      case 'date': return 'text-purple-600';
      case 'boolean': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div
      ref={drag}
      className={`flex items-center space-x-2 p-2 rounded cursor-move transition-all ${
        isDragging 
          ? 'opacity-50 bg-blue-100 shadow-lg' 
          : 'hover:bg-gray-50 hover:shadow-sm'
      }`}
    >
      <GripVertical className="w-3 h-3 text-gray-400" />
      <TypeIcon className={`w-4 h-4 ${getTypeColor()}`} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 truncate block">
          {field}
        </span>
        <span className="text-xs text-gray-500">
          {table}
        </span>
      </div>
      <span className={`text-xs px-2 py-1 rounded ${
        type === 'string' ? 'bg-blue-100 text-blue-800' :
        type === 'number' ? 'bg-green-100 text-green-800' :
        type === 'date' ? 'bg-purple-100 text-purple-800' :
        type === 'boolean' ? 'bg-orange-100 text-orange-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {type}
      </span>
    </div>
  );
}
