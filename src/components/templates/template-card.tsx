'use client';

import { MatrixCategory } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Users, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  category: MatrixCategory;
  taskCount: number;
  memberRoleCount: number;
  onUseTemplate: (templateId: string) => void;
  onPreview?: (templateId: string) => void;
}

const categoryColors: Record<MatrixCategory, string> = {
  SOFTWARE_DEVELOPMENT: 'bg-blue-100 text-blue-800 border-blue-300',
  PROJECT_MANAGEMENT: 'bg-purple-100 text-purple-800 border-purple-300',
  MARKETING: 'bg-pink-100 text-pink-800 border-pink-300',
  HR: 'bg-green-100 text-green-800 border-green-300',
  FINANCE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PRODUCT: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  IT_SECURITY: 'bg-red-100 text-red-800 border-red-300',
  EVENT_PLANNING: 'bg-orange-100 text-orange-800 border-orange-300',
  CONTENT: 'bg-teal-100 text-teal-800 border-teal-300',
  PROCUREMENT: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  CUSTOM: 'bg-gray-100 text-gray-800 border-gray-300',
};

const categoryLabels: Record<MatrixCategory, string> = {
  SOFTWARE_DEVELOPMENT: 'Software Development',
  PROJECT_MANAGEMENT: 'Project Management',
  MARKETING: 'Marketing',
  HR: 'Human Resources',
  FINANCE: 'Finance',
  PRODUCT: 'Product',
  IT_SECURITY: 'IT Security',
  EVENT_PLANNING: 'Event Planning',
  CONTENT: 'Content',
  PROCUREMENT: 'Procurement',
  CUSTOM: 'Custom',
};

export function TemplateCard({
  id,
  name,
  description,
  category,
  taskCount,
  memberRoleCount,
  onUseTemplate,
  onPreview,
}: TemplateCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      {/* Category Badge */}
      <div className="mb-3">
        <span
          className={cn(
            'inline-block px-2 py-1 rounded text-xs font-medium border',
            categoryColors[category]
          )}
        >
          {categoryLabels[category]}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-lg mb-2">{name}</h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <ListChecks className="h-4 w-4" />
          <span>{taskCount} tasks</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{memberRoleCount} roles</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => onUseTemplate(id)}
          className="flex-1"
          size="sm"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Use Template
        </Button>
        {onPreview && (
          <Button
            onClick={() => onPreview(id)}
            variant="outline"
            size="sm"
          >
            Preview
          </Button>
        )}
      </div>
    </div>
  );
}
