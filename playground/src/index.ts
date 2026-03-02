/* eslint-disable no-console */
import type { Entity } from 'entityhub'
import { HistoryPlugin } from '@entityhub/plugin'
import { EntityHub } from 'entityhub'

interface MyEntity extends Entity {
  id: number
  name: string
}

const core = new EntityHub<MyEntity>()
core.use(new HistoryPlugin())

core.on('created', (entity) => {
  console.log('created:', entity)
})

core.on('updated', (id, prev, next) => {
  console.log('updated:', id, 'prev=', prev, 'next=', next)
})

core.on('deleted', (id, prev) => {
  console.log('deleted:', id, 'prev=', prev)
})

core.on('cleared', () => {
  console.log('cleared')
})

console.log('canUndo:', core.history.canUndo())
console.log('canRedo:', core.history.canRedo())

console.log('\n=== create ===')
core.create({ id: 1, name: 'Alice' })

console.log('canUndo:', core.history.canUndo())
console.log('canRedo:', core.history.canRedo())

console.log('\n=== update ===')
core.update(1, () => ({ name: 'Alice v2' }))

console.log('\n=== delete ===')
core.delete(1)

// ======================================================
// Undo
// ======================================================

console.log('\n=== undo 1 ===')
core.history.undo()

console.log('canUndo:', core.history.canUndo())
console.log('canRedo:', core.history.canRedo())

console.log('\n=== undo 2 ===')
core.history.undo()

console.log('\n=== undo 3 ===')
core.history.undo()

console.log('canUndo:', core.history.canUndo())
console.log('canRedo:', core.history.canRedo())

// ======================================================
// Redo
// ======================================================

console.log('\n=== redo 1 ===')
core.history.redo()

console.log('\n=== redo 2 ===')
core.history.redo()

console.log('\n=== redo 3 ===')
core.history.redo()

console.log('canUndo:', core.history.canUndo())
console.log('canRedo:', core.history.canRedo())

console.log('\n=== undo once ===')
core.history.undo()

console.log('\n=== create new entity (should clear redo stack) ===')
core.create({ id: 2, name: 'Bob' })

console.log('canUndo:', core.history.canUndo())
console.log('canRedo:', core.history.canRedo())

console.log('\n=== try redo (should do nothing) ===')
core.history.redo()
