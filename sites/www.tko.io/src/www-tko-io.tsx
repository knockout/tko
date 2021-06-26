import {TkoComponent} from './TkoComponent'
import { observable } from '@tko/observable'

class WwwTkoIo extends TkoComponent {
  get template () {
    return <>{this.afterFontsLoad(this.bodyHTML())}</>
  }

  async afterFontsLoad (html /* : JSX */) {
    const o = observable(this.fontStrutHTML)
    console.log('bef', document.fonts.check('1em Roboto'))
    document.fonts?.ready
      .then(() => {
        o(html)
        console.log('aft', document.fonts.check('1em Roboto'))
      })

    return o
  }

  /**
   * Show text with the fonts, so document.fonts.ready
   * queues
   */
  get fontStrutHTML () {
    const { jss } = this
    return (
      <>
        <div class={jss.brandFontStrut}>.</div>
        <div class={jss.bodyFontStrut}>.</div>
      </>
    )
  }

  bodyHTML () {
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
      '@global': {
        body: {
          padding: 0,
          margin: 0,
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

