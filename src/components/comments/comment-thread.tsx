/**
 * CommentThread Component
 * Displays comments with real-time updates and @mention support
 */

'use client'

import { useState, useRef } from 'react'
import { api } from '@/trpc/react'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, Trash2, Edit2, X } from 'lucide-react'
import { MentionTextarea } from './mention-textarea'

interface CommentThreadProps {
  organizationId: string
  matrixId?: string
  taskId?: string
  className?: string
}

interface Comment {
  id: string
  content: string
  mentions: string[]
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    name: string
    email: string
    userId: string
  }
}

export function CommentThread({
  organizationId,
  matrixId,
  taskId,
  className = '',
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch comments
  const { data: commentsData, refetch } = api.comment.list.useQuery({
    organizationId,
    matrixId,
    taskId,
    limit: 50,
  })

  const comments = commentsData?.comments || []

  // Listen for real-time comment events
  useRealtime({
    matrixId: matrixId || '',
    enabled: !!matrixId,
    onCommentUpdate: () => {
      // Refetch comments when new comments are added
      refetch()
    },
  })

  // Create comment mutation
  const createComment = api.comment.create.useMutation({
    onSuccess: () => {
      setNewComment('')
      refetch()
      // Scroll to bottom after adding new comment
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 100)
    },
  })

  // Update comment mutation
  const updateComment = api.comment.update.useMutation({
    onSuccess: () => {
      setEditingId(null)
      setEditContent('')
      refetch()
    },
  })

  // Delete comment mutation
  const deleteComment = api.comment.delete.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const handleSubmit = () => {
    if (!newComment.trim()) return

    // Extract mentions from content (simple @mention pattern)
    const mentionPattern = /@(\w+)/g
    const mentions = [...newComment.matchAll(mentionPattern)]
      .map(match => match[1])
      .filter((m): m is string => m !== undefined)

    createComment.mutate({
      organizationId,
      matrixId,
      taskId,
      content: newComment,
      mentions: mentions.length > 0 ? mentions : undefined,
    })
  }

  const handleUpdate = (commentId: string) => {
    if (!editContent.trim()) return

    const mentionPattern = /@(\w+)/g
    const mentions = [...editContent.matchAll(mentionPattern)]
      .map(match => match[1])
      .filter((m): m is string => m !== undefined)

    updateComment.mutate({
      id: commentId,
      organizationId,
      content: editContent,
      mentions: mentions.length > 0 ? mentions : undefined,
    })
  }

  const handleDelete = (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    deleteComment.mutate({ id: commentId, organizationId })
  }

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditContent('')
  }

  const getInitials = (name: string = 'U') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const formatCommentContent = (content: string, mentions: string[]) => {
    // Highlight mentions in the content
    let formatted = content
    mentions.forEach(mention => {
      const pattern = new RegExp(`@${mention}\\b`, 'g')
      formatted = formatted.replace(
        pattern,
        `<span class="text-blue-600 font-medium">@${mention}</span>`
      )
    })
    return formatted
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </CardTitle>
        <CardDescription>
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4" ref={scrollRef}>
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No comments yet</p>
                <p className="text-xs text-muted-foreground">Be the first to comment!</p>
              </div>
            ) : (
              comments.map(comment => (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                >
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(comment.author.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(comment.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => startEditing(comment)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {editingId === comment.id ? (
                      <div className="space-y-2 mt-2">
                        <MentionTextarea
                          organizationId={organizationId}
                          matrixId={matrixId}
                          value={editContent}
                          onChange={setEditContent}
                          className="min-h-[60px] text-sm"
                          placeholder="Edit your comment..."
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(comment.id)}
                            disabled={updateComment.isPending}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className="text-sm text-foreground whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: formatCommentContent(comment.content, comment.mentions),
                        }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* New Comment Input */}
        <div className="space-y-2 pt-4 border-t">
          <MentionTextarea
            organizationId={organizationId}
            matrixId={matrixId}
            value={newComment}
            onChange={setNewComment}
            placeholder="Add a comment... Type @ to mention someone"
            className="min-h-[80px]"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <div className="flex items-center justify-end">
            <Button
              onClick={handleSubmit}
              disabled={createComment.isPending || !newComment.trim()}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Comment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
