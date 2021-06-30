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
    const waitForFontsToBeOnScreen = Promise.resolve()
    await waitForFontsToBeOnScreen
    await document.fonts.ready
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
