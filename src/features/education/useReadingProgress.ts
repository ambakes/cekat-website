import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { BREAKPOINTS, STORAGE_KEYS } from '../../config';
import { readJSON, removeStored, writeJSON } from '../../lib/storage';
import { educationChapters } from './chapters';
import { resolveReadingBookmark } from './readingModel';

const chapterIds = educationChapters.map((chapter) => chapter.id);

export function useReadingProgress(content: RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(educationChapters[0].id);
  const [resumeId, setResumeId] = useState(() => resolveReadingBookmark(readJSON(STORAGE_KEYS.reading), chapterIds));
  const [compact, setCompact] = useState(() => window.matchMedia(`(max-width: ${BREAKPOINTS.education}px)`).matches);

  useEffect(() => {
    const container = content.current;
    if (!container) return;
    let frame: number | null = null;
    let timer: number | null = null;
    let currentProgress = 0;
    let currentId = educationChapters[0].id;
    let disposed = false;
    const query = window.matchMedia(`(max-width: ${BREAKPOINTS.education}px)`);
    const sections = chapterIds.map((id) => document.getElementById(id)).filter((section): section is HTMLElement => section !== null);
    const save = () => {
      if (currentProgress <= .02 || currentProgress >= .995) return;
      if (writeJSON(STORAGE_KEYS.reading, { id: currentId })) setResumeId(currentId);
    };
    const update = () => {
      if (disposed) return;
      frame = null;
      const headerHeight = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 76;
      const top = container.getBoundingClientRect().top + window.scrollY;
      const start = top - headerHeight;
      const end = top + container.offsetHeight - window.innerHeight;
      currentProgress = Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start)));
      const marker = window.scrollY + Math.min(320, window.innerHeight * .35);
      currentId = educationChapters[0].id;
      for (const section of sections) if (section.getBoundingClientRect().top + window.scrollY <= marker) currentId = section.id;
      setProgress(currentProgress);
      setActiveId(currentId);
      if (timer !== null) window.clearTimeout(timer);
      if (currentProgress >= .995) {
        removeStored(STORAGE_KEYS.reading);
        setResumeId(null);
      } else if (currentProgress > .02) timer = window.setTimeout(save, 550);
    };
    const schedule = () => { if (!disposed && frame === null) frame = window.requestAnimationFrame(update); };
    const compactChanged = () => setCompact(query.matches);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pagehide', save);
    query.addEventListener('change', compactChanged);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    observer?.observe(container);
    void document.fonts?.ready.then(() => { if (!disposed) schedule(); });
    update();
    return () => {
      disposed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (timer !== null) window.clearTimeout(timer);
      observer?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pagehide', save);
      query.removeEventListener('change', compactChanged);
    };
  }, [content]);

  return { progress, activeId, resumeId, showJump: compact && progress > .015 && progress < .995 };
}
