import { computed } from '@tko/computed'
import { observable } from '@tko/observable'

import { TkoComponent } from './TkoComponent'

const fontsLoaded = observable(false)
const opacityUntilFontsLoaded = computed(() => fontsLoaded() ? 1 : 0)

class WwwTkoIo extends TkoComponent {
  get template () {
    this.monitorFontsLoading()
    return <>{this.bodyHTML()}</>
  }

  /**
   * document.fonts.ready is a promise that resolves when all
   * the fonts on the screen are loaded.
   */
  private async monitorFontsLoading () {
    const waitForRender = Promise.resolve()
    await waitForRender
    await document.fonts.ready
    fontsLoaded(true)
  }

  private bodyHTML () {
    const { jss } = this
    return (
      <div class={jss.layout}>
        <div class={jss.head}>
          <div class={jss.brand}>
            TKO
          </div>
        </div>
        <div class={jss.body}>
          How are you?
        </div>
      </div>
    )
  }

  static get cssVars () {
    return {
      '--bg-color': '#aaa',
      '--body-font': 'Roboto',
      '--brand-font': 'Pacifico',
      '--fg-color': 'black',
      '--head-bg-color': '#931d0d',
      '--head-fg-color': 'white',
      '--head-height': '55px',
    }
  }

  static get css () {
    return {
      '@import': [
        `url('https://fonts.googleapis.com/css2?family=Roboto&family=Pacifico&display=swap')`
      ],
      '@global': {
        body: {
          padding: 0,
          margin: 0,
          // opacity: opacityUntilFontsLoaded,
          ...this.cssVars,
        },
      },

      layout: {
        display: 'grid',
        gridTemplateRows: 'var(--head-height) 1fr',
        // backgroundColor: '#fcd4d4',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--fg-color)',
        height: '100%',
        fontFamily: 'var(--body-font)'
      },

      head: {
        display: 'flex',
        alignItems: 'center',
        color: 'var(--head-fg-color)',
        backgroundColor: 'var(--head-bg-color)',
        padding: '0px 1rem',
      },

      brand: {
        fontSize: '1.6rem',
        padding: '0.25em 0.4em',
        textShadow: '0 0 5px #efff6c, 0 0 10px #efff6c',
        fontFamily: 'var(--brand-font)',
      },

      body: {
        padding: '1rem',
      },

      brandFontStrut: {
        opacity: 0,
        fontFamily: 'var(--brand-font)',
      },

      bodyFontStrut: {
        opacity: 0,
        fontFamily: 'var(--body-font)',
      }
    }
  }
}

WwwTkoIo.register()

