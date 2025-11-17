'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableTaskRowProps {
  id: string;
  children: React.ReactNode;
  isDragging?: boolean;
}

export function DraggableTaskRow({
  id,
  children,
  isDragging = false,
}: DraggableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-b last:border-b-0 relative',
        isBeingDragged && 'opacity-50 bg-blue-50'
      )}
    >
      {/* Drag Handle Cell */}
      <td
        className="w-8 border-r cursor-grab active:cursor-grabbing hover:bg-gray-50"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center justify-center h-full py-3">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </td>
      {children}
    </tr>
  );
}
