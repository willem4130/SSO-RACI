/**
 * MentionTextarea Component
 * Textarea with @mention autocomplete support
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { api } from '@/trpc/react'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface MentionTextareaProps {
  organizationId: string
  matrixId?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

interface Member {
  id: string
  name: string
  email: string
  userId: string
}

export function MentionTextarea({
  organizationId,
  matrixId,
  value,
  onChange,
  placeholder = 'Type @ to mention someone...',
  className = '',
  onKeyDown,
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch mentionable members
  const { data: members = [] } = api.comment.getMentionableMembers.useQuery(
    {
      organizationId,
      matrixId,
      query: mentionQuery,
    },
    {
      enabled: showSuggestions,
    }
  )

  // Detect @ mentions
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const text = value
    const cursorPos = textarea.selectionStart

    // Find the last @ before cursor
    const textBeforeCursor = text.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex === -1) {
      setShowSuggestions(false)
      return
    }

    // Check if there's a space after @
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
    if (textAfterAt.includes(' ')) {
      setShowSuggestions(false)
      return
    }

    // Show suggestions
    setMentionQuery(textAfterAt)
    setShowSuggestions(true)
    setSelectedIndex(0)
  }, [value, cursorPosition])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }

  const insertMention = (member: Member) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const text = value
    const cursorPos = textarea.selectionStart

    // Find the @ before cursor
    const textBeforeCursor = text.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    // Replace from @ to cursor with mention
    const beforeMention = text.substring(0, lastAtIndex)
    const afterCursor = text.substring(cursorPos)
    const newValue = `${beforeMention}@${member.name} ${afterCursor}`

    onChange(newValue)
    setShowSuggestions(false)

    // Set cursor position after mention
    setTimeout(() => {
      const newCursorPos = lastAtIndex + member.name.length + 2
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && members.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % members.length)
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + members.length) % members.length)
        return
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(members[selectedIndex]!)
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        setShowSuggestions(false)
        return
      }
    }

    // Call parent onKeyDown
    onKeyDown?.(e)
  }

  const getInitials = (name: string = 'U') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && members.length > 0 && (
        <Card className="absolute bottom-full left-0 mb-2 w-64 max-h-48 overflow-auto shadow-lg z-50">
          <div className="p-1">
            {members.map((member, index) => (
              <button
                key={member.id}
                onClick={() => insertMention(member)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Help Text */}
      {!showSuggestions && (
        <p className="text-xs text-muted-foreground mt-1">
          Type @ to mention someone, ↑↓ to navigate, Enter to select
        </p>
      )}
    </div>
  )
}
