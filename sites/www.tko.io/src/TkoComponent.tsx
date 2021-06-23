import { tko } from './tko'

export abstract class TkoComponent extends tko.components.ComponentABC {
  get template () { return <span>hello ${new Date().toISOString()}</span> }
}
