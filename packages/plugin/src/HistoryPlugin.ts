import type { Entity, Plugin, PluginContext } from 'entityhub'

/**
 * A reversible operation used by the history system.
 *
 * Each command must be idempotent and symmetric:
 * - `redo` reapplies the change
 * - `undo` reverts the change
 *
 * Commands are generated automatically from core events.
 */
interface Command {
  /**
   * Re-apply the original change.
   */
  redo: () => void

  /**
   * Revert the original change.
   */
  undo: () => void
}

declare module 'entityhub' {
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface EntityHub<T extends Entity = Entity> {
    /**
     * History controller providing undo/redo capabilities.
     *
     * This API is automatically installed by {@link HistoryPlugin}.
     *
     * Notes:
     * - History is recorded automatically via core events.
     * - Entities are stored by reference (no cloning is performed).
     * - Mutating entities outside the core may break undo consistency.
     */
    history: {
      /**
       * Undo the most recent operation.
       *
       * Does nothing if there is no operation to undo.
       */
      undo: () => void

      /**
       * Redo the most recently undone operation.
       *
       * Does nothing if there is no operation to redo.
       */
      redo: () => void

      /**
       * Whether an undo operation is currently available.
       */
      canUndo: () => boolean

      /**
       * Whether a redo operation is currently available.
       */
      canRedo: () => boolean
    }
  }
}

/**
 * Plugin that enables automatic undo/redo support for a Core instance.
 *
 * This plugin:
 * - Listens to core events (`created`, `updated`, `deleted`, `cleared`)
 * - Automatically generates reversible commands
 * - Maintains undo and redo stacks
 *
 * Design principles:
 * - Event-driven (no manual record API)
 * - No cloning or freezing (performance-first)
 * - Assumes entities are treated as immutable by consumers
 *
 * @typeParam T - Entity type managed by the core.
 */
export class HistoryPlugin<T extends Entity> implements Plugin<T> {
  /**
   * Plugin name.
   */
  name = 'history'

  /**
   * Stack of executed commands that can be undone.
   */
  private undoStack: Command[] = []

  /**
   * Stack of undone commands that can be redone.
   */
  private redoStack: Command[] = []

  /**
   * Internal flag to prevent recording during undo/redo execution.
   */
  private silent = 0

  /**
   * Install the plugin into the core.
   *
   * Registers event listeners and exposes `core.history`.
   */
  install(ctx: PluginContext<T>) {
    // ---- Automatic recording from events ----

    ctx.on('created', (entity) => {
      if (this.silent > 0)
        return

      this.push({
        redo: () => ctx.create(entity),
        undo: () => ctx.delete(entity.id),
      })
    })

    ctx.on('updated', (id, prev, next) => {
      if (this.silent > 0)
        return

      this.push({
        redo: () => ctx.update(id, () => next),
        undo: () => ctx.update(id, () => prev),
      })
    })

    ctx.on('deleted', (id, entity) => {
      if (this.silent > 0)
        return

      this.push({
        redo: () => ctx.delete(id),
        undo: () => ctx.create(entity),
      })
    })

    ctx.on('cleared', (snapshot) => {
      if (this.silent > 0)
        return

      this.push({
        redo: () => ctx.clear(),
        undo: () => {
          for (const entity of snapshot) {
            ctx.create(entity)
          }
        },
      })
    })

    // ---- Public API ----

    Object.defineProperty(ctx, 'history', {
      value: {
        undo: () => this.undo(),
        redo: () => this.redo(),
        canUndo: () => this.undoStack.length > 0,
        canRedo: () => this.redoStack.length > 0,
      },
      configurable: true,
    })
  }

  /**
   * Uninstall the plugin.
   *
   * Clears all stored history.
   */
  uninstall() {
    this.undoStack.length = 0
    this.redoStack.length = 0
  }

  /**
   * Push a new command onto the undo stack.
   *
   * Clears the redo stack, as new operations invalidate redo history.
   */
  private push(command: Command): void {
    this.undoStack.push(command)
    this.redoStack.length = 0
  }

  /**
   * Undo the most recent command.
   *
   * Execution is performed in silent mode to avoid
   * generating additional history entries.
   */
  private undo(): void {
    const command = this.undoStack.pop()
    if (!command)
      return

    this.silent++
    try {
      command.undo()
    }
    finally {
      this.silent--
    }

    this.redoStack.push(command)
  }

  /**
   * Redo the most recently undone command.
   *
   * Execution is performed in silent mode to avoid
   * generating additional history entries.
   */
  private redo(): void {
    const command = this.redoStack.pop()
    if (!command)
      return

    this.silent++
    try {
      command.redo()
    }
    finally {
      this.silent--
    }

    this.undoStack.push(command)
  }
}
