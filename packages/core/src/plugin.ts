import type EventEmitter3 from 'eventemitter3'
import type { Events } from './events'
import type { Store } from './store'
import type { Entity } from './types'

export interface PluginContext<T extends Entity = Entity>
  extends Store<T>,
  Pick<EventEmitter3<Events<T>>, 'on' | 'off' | 'once'> {}

export interface Plugin<T extends Entity = Entity> {
  name: string
  install: (ctx: PluginContext<T>) => void
  uninstall?: (ctx: PluginContext<T>) => void
}
