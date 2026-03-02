import type { Plugin } from './plugin'
import type { Entity } from './types'
import { Manager } from './manager'

export class EntityHub<T extends Entity> extends Manager<T> {
  private plugins: Plugin<T>[] = []
  private pluginMap = new Map<string, Plugin<T>>()

  use(plugin: Plugin<T>): this {
    if (this.pluginMap.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already installed`)
    }

    plugin.install(this)

    this.plugins.push(plugin)
    this.pluginMap.set(plugin.name, plugin)

    return this
  }

  override dispose(): void {
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      this.plugins[i]?.uninstall?.(this)
    }

    this.plugins.length = 0
    this.pluginMap.clear()

    super.dispose()
  }
}

export * from './manager'
export type * from './plugin'
export type * from './types'
