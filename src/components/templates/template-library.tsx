'use client'

import { useState, useMemo } from 'react'
import { MatrixCategory } from '@prisma/client'
import { TemplateCard } from './template-card'
import { predefinedTemplates } from '@/lib/templates/predefined-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'

interface TemplateLibraryProps {
  onUseTemplate: (templateId: string) => void
  onPreviewTemplate?: (templateId: string) => void
}

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'SOFTWARE_DEVELOPMENT', label: 'Software Development' },
  { value: 'PROJECT_MANAGEMENT', label: 'Project Management' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'HR', label: 'Human Resources' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'IT', label: 'IT' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'SALES', label: 'Sales' },
  { value: 'CUSTOMER_SUCCESS', label: 'Customer Success' },
]

export function TemplateLibrary({ onUseTemplate, onPreviewTemplate }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const filteredTemplates = useMemo(() => {
    return predefinedTemplates.filter((template) => {
      // Filter by search query
      const matchesSearch =
        searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by category
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, categoryFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">RACI Template Library</h2>
        <p className="text-gray-600">
          Choose from {predefinedTemplates.length} pre-configured RACI templates to get started
          quickly
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-2">No templates found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              id={template.id}
              name={template.name}
              description={template.description}
              category={template.category}
              taskCount={template.tasks.length}
              memberRoleCount={template.memberRoles.length}
              onUseTemplate={onUseTemplate}
              onPreview={onPreviewTemplate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
