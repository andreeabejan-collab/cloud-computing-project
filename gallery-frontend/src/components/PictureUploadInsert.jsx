import { useCallback, useId, useRef, useState } from 'react'
import { ImagePlus, Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function buildUploadUrl(listImagesUrl) {
  const fromEnv = import.meta.env.VITE_UPLOAD_URL
  if (fromEnv) return fromEnv
  return listImagesUrl.replace(/\/?images\/?$/i, '') + '/upload'
}

/**
 * Insert / upload images into the gallery.
 * Wire `VITE_UPLOAD_URL` in `.env` if your upload path differs from `…/upload`.
 * Sends multipart field `file` only; categorization is handled by your backend (e.g. AWS).
 */
export function PictureUploadInsert({ listUrl, onUploadSuccess, variant = 'default' }) {
  const isSidebar = variant === 'sidebar'
  const inputId = useId()
  const fileInputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState(null)

  const uploadUrl = buildUploadUrl(listUrl)

  const resetPreviews = useCallback((nextFiles) => {
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url))
      return nextFiles.map((f) => URL.createObjectURL(f))
    })
  }, [])

  const addFiles = useCallback(
    (incoming) => {
      const list = Array.from(incoming).filter((f) => f.type.startsWith('image/'))
      if (!list.length) return
      setFiles((prev) => {
        const merged = [...prev, ...list]
        resetPreviews(merged)
        return merged
      })
    },
    [resetPreviews],
  )

  const clearFiles = useCallback(() => {
    setFiles([])
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url))
      return []
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!files.length) {
      setMessage({ type: 'error', text: 'Choose one or more images first.' })
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      for (const file of files) {
        const body = new FormData()
        body.append('file', file)

        const res = await fetch(uploadUrl, {
          method: 'POST',
          body,
        })

        if (!res.ok) {
          const detail = await res.text().catch(() => '')
          throw new Error(detail || `Upload failed (${res.status})`)
        }
      }

      clearFiles()
      setMessage({
        type: 'success',
        text: 'Upload complete. Your gallery will refresh.',
      })
      onUploadSuccess?.()
    } catch (err) {
      console.error(err)
      setMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Upload failed. Check VITE_UPLOAD_URL and API CORS settings.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card
      className={cn(
        'border-dashed border-2 border-primary/25 bg-card/80 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-3 duration-500 fill-mode-both ease-out motion-reduce:animate-none',
        isSidebar && 'shadow-sm',
      )}
    >
      <CardHeader className={cn(isSidebar && 'space-y-0 p-3 pb-2')}>
        <div className={cn('flex gap-2', isSidebar ? 'flex-col items-stretch' : 'items-center')}>
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary',
              isSidebar ? 'h-9 w-9 self-start' : 'h-10 w-10',
            )}
          >
            <ImagePlus className={cn(isSidebar ? 'h-4 w-4' : 'h-5 w-5')} aria-hidden />
          </span>
          <div className="min-w-0">
            <CardTitle className={cn(isSidebar && 'text-sm font-semibold')}>Add pictures</CardTitle>
            <CardDescription className={cn(isSidebar && 'text-xs leading-snug')}>
              {isSidebar ? (
                'Drop images here or browse. Category is assigned automatically after upload.'
              ) : (
                <>
                  Drag images here or browse. Images are sent as{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">multipart/form-data</code>{' '}
                  with the <code className="rounded bg-muted px-1 py-0.5 text-xs">file</code> field;
                  your AWS pipeline assigns categories.
                </>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className={cn('space-y-4', isSidebar && 'space-y-3 p-3 pt-0')}>
          <div
            className={cn(
              'rounded-lg border-2 border-dashed text-center transition-all duration-300 ease-out',
              isSidebar ? 'p-4' : 'p-8',
              isDragging
                ? 'scale-[1.02] border-primary bg-primary/10 shadow-md'
                : 'border-muted-foreground/25 bg-muted/30 hover:border-primary/40 hover:bg-muted/50',
            )}
            onDragEnter={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              addFiles(e.dataTransfer.files)
            }}
          >
            <Upload
              className={cn(
                'mx-auto mb-2 text-muted-foreground transition-transform duration-300',
                isSidebar ? 'h-8 w-8' : 'h-10 w-10',
                isDragging && 'scale-110 text-primary',
              )}
              aria-hidden
            />
            <p className={cn('text-muted-foreground', isSidebar ? 'text-xs' : 'text-sm')}>
              Drop images or{' '}
              <button
                type="button"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                choose files
              </button>
            </p>
            <Input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files)
              }}
            />
          </div>

          {previews.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {previews.length} file{previews.length !== 1 ? 's' : ''} ready
              </p>
              <ul className="flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <li
                    key={`${src}-${i}`}
                    className={cn(
                      'overflow-hidden rounded-md border border-border shadow-sm animate-in zoom-in-95 fade-in-0 fill-mode-both duration-300 ease-out motion-reduce:animate-none motion-reduce:opacity-100',
                      isSidebar ? 'h-12 w-12' : 'h-16 w-16',
                    )}
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 text-muted-foreground"
                onClick={clearFiles}
              >
                Clear selection
              </Button>
            </div>
          )}

          {message && (
            <p
              className={cn(
                'rounded-md border px-3 py-2 text-sm animate-in fade-in-0 slide-in-from-top-2 duration-300 fill-mode-both motion-reduce:animate-none',
                isSidebar && 'text-xs py-1.5',
                message.type === 'success'
                  ? 'border-primary/30 bg-primary/10 text-foreground'
                  : 'border-destructive/40 bg-destructive/10 text-destructive',
              )}
              role="status"
            >
              {message.text}
            </p>
          )}
        </CardContent>
        <CardFooter
          className={cn(
            'border-t border-border/60 bg-muted/20',
            isSidebar ? 'flex flex-col p-3' : 'flex justify-end p-6 pt-0',
          )}
        >
          <Button
            type="submit"
            disabled={isUploading || !files.length}
            className={cn('gap-2', isSidebar && 'w-full text-xs')}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden />
                {isSidebar ? 'Upload' : 'Upload to gallery'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
