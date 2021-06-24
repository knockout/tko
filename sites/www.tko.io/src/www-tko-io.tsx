import {TkoComponent} from './TkoComponent'

class WwwTkoIo extends TkoComponent {
  get template () {
    return (
      <div class={this.jss.layout}>
        hello ${new Date().toISOString()}
      </div>
    )
  }

  static get css () {
    return {
      layout: {
        padding: '25px',
        backgroundColor: '#fcd4d4',
      }
    }
  }
}

WwwTkoIo.register()

