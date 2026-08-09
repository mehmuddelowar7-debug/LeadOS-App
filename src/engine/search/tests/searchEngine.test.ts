// @ts-ignore
import { describe, it, expect } from 'vitest'
import { searchEngine } from '../index'
import type { SearchResult } from '../types'

const dummyIndex: SearchResult[] = [
  {
    id: '1',
    type: 'candidate',
    title: 'Priya Sharma',
    subtitle: '9876543210',
    route: '/contacts/1',
    priority: 5,
    keywords: ['Marketing']
  },
  {
    id: '2',
    type: 'candidate',
    title: 'Priyanka Patel',
    subtitle: '9876500000',
    route: '/contacts/2',
    priority: 5
  },
  {
    id: '3',
    type: 'action',
    title: 'Add Candidate',
    route: '/contacts/new',
    priority: 10
  }
]

describe('Search Engine Engine', () => {
  it('returns items by priority when query is empty', () => {
    const results = searchEngine('', dummyIndex)
    expect(results.length).toBe(3)
    expect(results[0].title).toBe('Add Candidate') // priority 10
  })

  it('matches exact name over prefix name', () => {
    const index: SearchResult[] = [
      ...dummyIndex,
      { id: '4', type: 'candidate', title: 'Priya', route: '/c/4', priority: 5 }
    ]
    const results = searchEngine('Priya', index)
    expect(results[0].title).toBe('Priya') // Exact match
    expect(results[1].title).toBe('Priya Sharma') // Prefix match
  })

  it('prioritizes exact phone match heavily', () => {
    const results = searchEngine('9876543210', dummyIndex)
    expect(results[0].title).toBe('Priya Sharma')
    expect(results[0].rankScore).toBeGreaterThan(99)
  })

  it('matches fuzzy keywords', () => {
    const results = searchEngine('mktg', dummyIndex)
    expect(results.length).toBe(1)
    expect(results[0].title).toBe('Priya Sharma')
  })
})
