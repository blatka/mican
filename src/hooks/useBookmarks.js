import { useState, useCallback } from 'react'

const KEY = 'mican_summit_bookmarks'

function load() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY)) ?? [])
  } catch {
    return new Set()
  }
}

function save(set) {
  localStorage.setItem(KEY, JSON.stringify([...set]))
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(load)

  const toggle = useCallback((id) => {
    setBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      save(next)
      return next
    })
  }, [])

  const isBookmarked = useCallback((id) => bookmarks.has(id), [bookmarks])

  return { bookmarks, toggle, isBookmarked }
}
