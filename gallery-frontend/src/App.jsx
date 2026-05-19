import React, { useEffect, useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

import { PictureUploadInsert } from '@/components/PictureUploadInsert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  'All Photos',
  'Nature',
  'Architecture',
  'People',
  'Vehicles',
  'Animals',
  'Other',
]

function App() {
  const [images, setImages] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All Photos')
  const [isLoading, setIsLoading] = useState(true)
  const [galleryKey, setGalleryKey] = useState(0)

  const API_URL =
    import.meta.env.VITE_API_URL 

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      const queryCategory = selectedCategory === 'All Photos' ? 'All' : selectedCategory
      const fetchUrl =
        queryCategory === 'All' ? API_URL : `${API_URL}?category=${queryCategory}`

      try {
        const res = await fetch(fetchUrl)
        const data = await res.json()
        if (cancelled) return
        const sorted = Array.isArray(data)
          ? data.sort((a, b) => (b.Timestamp ?? 0) - (a.Timestamp ?? 0))
          : []
        setImages(sorted)
      } catch (err) {
        console.error('Error retrieving gallery data:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [selectedCategory, API_URL, galleryKey])

  return (
    <div className="flex min-h-svh bg-background motion-reduce:transition-none">
      <aside
        className="sticky top-0 flex h-svh max-h-svh w-64 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm animate-in fade-in-0 slide-in-from-left-4 duration-500 motion-reduce:animate-none"
        style={{ animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-sidebar-border px-5 py-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-lg animate-in zoom-in-95 fade-in-0 duration-500 fill-mode-both motion-reduce:animate-none motion-reduce:scale-100 motion-reduce:opacity-100">
            <ImageIcon className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Gallery
            </p>
            <p className="text-base font-semibold text-sidebar-foreground">Image labeler</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <nav className="flex flex-col gap-1 p-3 pb-2" aria-label="Categories">
          {CATEGORIES.map((cat, index) => (
            <React.Fragment key={cat}>
              {cat === 'Other' && (
                <div className="my-2 h-px bg-sidebar-border" role="separator" />
              )}
              <Button
                type="button"
                variant={selectedCategory === cat ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start font-normal transition-[transform,box-shadow,background-color] duration-200 hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none',
                  'motion-reduce:animate-none animate-in fade-in-0 slide-in-from-left-2 fill-mode-both duration-500',
                  selectedCategory === cat && 'bg-sidebar-accent font-medium shadow-sm',
                )}
                style={{
                  animationDelay: `${80 + index * 40}ms`,
                  animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            </React.Fragment>
          ))}
          </nav>

          <div className="border-t border-sidebar-border p-3 pb-4">
            <PictureUploadInsert
              variant="sidebar"
              listUrl={API_URL}
              onUploadSuccess={() => setGalleryKey((k) => k + 1)}
            />
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="border-b border-border/80 bg-card/40 px-8 py-6 backdrop-blur-sm animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-100 fill-mode-both motion-reduce:animate-none">
          <div key={selectedCategory} className="animate-in fade-in-0 slide-in-from-left-3 duration-500 fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {selectedCategory}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Curated media with soft labels.
            </p>
          </div>
        </div>

        <div className="p-8">
          {isLoading ? (
            <Card className="border-border/60 animate-in fade-in-0 zoom-in-95 duration-500 fill-mode-both motion-reduce:animate-none">
              <CardHeader>
                <CardTitle className="text-base font-medium">Loading</CardTitle>
                <CardDescription className="space-y-3">
                  <span className="block">Fetching media from your API…</span>
                  <span
                    className="mx-auto block h-1.5 max-w-xs rounded-full bg-primary/20 animate-pulse motion-reduce:animate-none motion-reduce:bg-muted"
                    aria-hidden
                  />
                </CardDescription>
              </CardHeader>
            </Card>
          ) : images.length === 0 ? (
            <Card className="border-border/60 animate-in fade-in-0 zoom-in-95 duration-500 fill-mode-both motion-reduce:animate-none">
              <CardHeader>
                <CardTitle className="text-base font-medium">No images yet</CardTitle>
                <CardDescription>
                  No verified images in this category, or your API URL still needs to be configured.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div
              className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4 [&>div]:mb-6"
              style={{ columnWidth: '280px' }}
            >
              {images.map((img, i) => {
                const labelParts = img.Labels
                  ? String(img.Labels)
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : []
                return (
                  <Card
                    key={img.ImageID}
                    className={cn(
                      'group inline-block w-full break-inside-avoid overflow-hidden transition-shadow duration-300 hover:shadow-lg motion-reduce:animate-none',
                      'motion-reduce:transition-shadow animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-6 duration-500 fill-mode-both ease-out motion-reduce:animate-none',
                    )}
                    style={{
                      animationDelay: `${Math.min(i, 24) * 45}ms`,
                    }}
                  >
                    <div className="relative overflow-hidden bg-muted">
                      <img
                        src={img.S3Url}
                        alt={img.Labels || img.Category || 'Gallery image'}
                        className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="pointer-events-none absolute left-3 right-3 top-3 flex flex-wrap items-start gap-1.5">
                        {labelParts.slice(0, 2).map((label, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-foreground/55 px-2 py-0.5 text-[11px] font-medium text-background backdrop-blur-sm"
                          >
                            {label}
                          </span>
                        ))}
                        <span className="ml-auto rounded-md bg-emerald-600/85 px-2 py-0.5 text-[11px] font-medium text-white">
                          ✓ Clean
                        </span>
                      </div>
                    </div>
                    <CardContent className="border-t border-border/60 py-3">
                      <p className="truncate text-sm font-medium text-card-foreground">
                        {img.Labels || `${img.Category ?? 'Image'}`}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
