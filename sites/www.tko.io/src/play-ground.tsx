import { EsbuildComponent } from "./EsbuildComponent"
import { observable } from "@tko/observable"
import './monacoHandler'

class PlayGround extends EsbuildComponent {
  private input = observable('')

  async result () {
    try {
      const { code, warnings } = await this.compile(this.input())
      if (warnings.length) {
        console.warn('WARNINGS', ...warnings)
      }
      return code
    } catch (err) {
      console.error
    }
  }

  get template () {
    const { jss } = this
    const result = this.computed(() => this.result()).extend({ deferred: true })
    return (
      <div class={jss.layout}>
        <div class={jss.input} ko-monaco-handler>
        </div>
        <div class={jss.result}>
          {result}
        </div>
        <div class={jss.warnings}>
          {this.warnings}
        </div>
        <div class={jss.errors}>
          {this.errors}
        </div>
      </div>
    )
  }

  static get css () {
    return {
      layout: {},
      input: {},
      result: {},
    }
  }
}

PlayGround.register()
