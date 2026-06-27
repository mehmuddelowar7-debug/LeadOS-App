import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { useIsFetching } from '@tanstack/react-query'
import { usePerformanceStore } from '@/hooks/usePerformanceStore'
import { IS_PERF_MODE } from './PerformanceProfiler'

export function RouteTracker() {
  const location = useLocation()
  const isFetching = useIsFetching()
  const isFetchingRef = useRef(isFetching)
  const navStartRef = useRef<number>(0)
  const state = usePerformanceStore()

  useEffect(() => {
    isFetchingRef.current = isFetching
  }, [isFetching])

  // System observers (FPS, Long Tasks, Paint)
  useEffect(() => {
    if (!IS_PERF_MODE) return

    // FPS Counter
    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number
    const measureFps = () => {
      const now = performance.now()
      frameCount++
      if (now - lastTime >= 1000) {
        state.setFps(frameCount)
        frameCount = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(measureFps)
    }
    rafId = requestAnimationFrame(measureFps)

    // Long Tasks
    let longTaskObserver: PerformanceObserver | null = null
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            state.addLongTask(entry.duration, entry.name, entry.startTime)
          }
        })
      })
      longTaskObserver.observe({ type: 'longtask', buffered: true })
    } catch (e) { /* Safari doesn't support longtask */ }

    // Web Vitals (Paint)
    let paintObserver: PerformanceObserver | null = null
    try {
      paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-paint') state.setWebVital('fp', entry.startTime)
          if (entry.name === 'first-contentful-paint') state.setWebVital('fcp', entry.startTime)
        })
      })
      paintObserver.observe({ type: 'paint', buffered: true })
    } catch (e) { }

    let lcpObserver: PerformanceObserver | null = null
    try {
      lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        state.setWebVital('lcp', lastEntry.startTime)
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch (e) { }

    return () => {
      cancelAnimationFrame(rafId)
      longTaskObserver?.disconnect()
      paintObserver?.disconnect()
      lcpObserver?.disconnect()
    }
  }, []) // run once

  // Navigation Tracker
  useEffect(() => {
    if (!IS_PERF_MODE) return

    const pathname = location.pathname === '/' ? 'Home' : 
                     location.pathname === '/insights' ? 'Insights' :
                     location.pathname === '/network' ? 'Network' :
                     location.pathname.replace('/', '').charAt(0).toUpperCase() + location.pathname.slice(2)
                     
    state.setCurrentScreen(pathname)
    
    const navStart = performance.now()
    navStartRef.current = navStart
    
    requestAnimationFrame(() => {
      const reactMountTime = performance.now() - navStart
      
      const checkDataReady = () => {
        if (isFetchingRef.current === 0) {
          const dataReadyTime = performance.now() - navStart
          const totalTime = dataReadyTime 
          state.setLastNavTime(totalTime)
          
          console.table({
            [pathname]: {
              'Nav (ms)': 0,
              'Mount (ms)': reactMountTime.toFixed(1),
              'Data (ms)': dataReadyTime.toFixed(1),
              'Total (ms)': totalTime.toFixed(1)
            }
          })
        } else {
          setTimeout(checkDataReady, 10)
        }
      }
      checkDataReady()
    })
  }, [location.pathname])

  return null
}
