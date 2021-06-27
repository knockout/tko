import { observable } from '@tko/observable'
import { computed } from '@tko/computed'

import { TkoComponent } from './TkoComponent'

export abstract class WithFontsView extends TkoComponent {
  static fontsLoaded = observable(false)

  protected abstract bodyHTML: any

  /**
   * document.fonts.ready is a promise that resolves when all
   * the fonts on the screen are loaded.
   */
  private async monitorFontsLoading () {
    const waitForRender = Promise.resolve()
    await waitForRender
    console.log(`Fonts loading: ?`, document.fonts.check('1rem Pacifico'))
    await document.fonts.ready
    console.log(`Fonts ready: ?`, document.fonts.check('1rem Pacifico'))
    WithFontsView.fontsLoaded(true)
  }

  static get css () {
    const { fontsLoaded } = this
    const opacityUntilFontsLoaded = computed(() => fontsLoaded() ? 1 : 0)

    return {
      ...super.css,


      '@global': {
        body: {
          opacity: opacityUntilFontsLoaded,
        },
      },
    }
  }

  get template () {
    this.monitorFontsLoading()
    return <>{this.bodyHTML()}</>
  }
}
