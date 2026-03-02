import type { Entity } from './types'

export interface Store<T extends Entity = Entity> {
  create: (anno: T) => void
  read: (id: T['id']) => T | undefined
  update: (id: T['id'], patch: Partial<T> | ((prev: T) => Partial<T>)) => void
  delete: (id: T['id']) => void
  list: () => T[]
  clear: () => void
}
