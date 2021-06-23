import {TkoComponent} from './TkoComponent'

class WwwTkoIo extends TkoComponent {
  get template () { return <span>hello ${new Date().toISOString()}</span> }
}

WwwTkoIo.register()

