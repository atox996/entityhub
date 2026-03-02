import type { Entity } from './types'

export interface Events<T extends Entity = Entity> {
  created: (anno: T) => void
  updated: (id: T['id'], prev: T, next: T) => void
  deleted: (id: T['id'], prev: T) => void
  cleared: (snapshot: T[]) => void
}
