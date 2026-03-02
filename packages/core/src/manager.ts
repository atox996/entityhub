import type { Events } from './events'
import type { Store } from './store'
import type { Entity } from './types'
import EventEmitter from 'eventemitter3'

export class Manager<T extends Entity> extends EventEmitter<Events<T>> implements Store<T> {
  private map = new Map<T['id'], T>()

  create(entity: T): void {
    if (this.map.has(entity.id))
      throw new Error(`Entity ${entity.id} already exists`)
    this.map.set(entity.id, entity)
    this.emit('created', entity)
  }

  read(id: T['id']): T | undefined {
    return this.map.get(id)
  }

  update(id: T['id'], patch: Partial<T> | ((prev: T) => Partial<T>)): void {
    const prev = this.map.get(id)
    if (!prev)
      throw new Error(`Entity ${id} not found`)
    const partial
      = typeof patch === 'function'
        ? patch(prev)
        : patch

    const next = { ...prev, ...partial }
    this.map.set(id, next)
    this.emit('updated', id, prev, next)
  }

  delete(id: T['id']): void {
    const prev = this.map.get(id)
    if (!prev)
      throw new Error(`Entity ${id} not found`)

    this.map.delete(id)
    this.emit('deleted', id, prev)
  }

  list(): T[] {
    return Array.from(this.map.values())
  }

  clear(): void {
    const snapshot = this.list()
    this.map.clear()
    this.emit('cleared', snapshot)
  }

  dispose(): void {
    this.removeAllListeners()
    this.map.clear()
  }
}
