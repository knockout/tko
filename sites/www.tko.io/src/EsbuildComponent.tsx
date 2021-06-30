
import * as esbuild from 'esbuild-wasm'
import { observable, observableArray } from '@tko/observable'

import {TkoComponent} from './TkoComponent'


const wasmURL = './esbuild.wasm'

export class EsbuildComponent extends TkoComponent {
  private esbuildInitialized: Promise<void>
  protected code = observable('')
  protected warnings = observableArray([])
  protected errors = observableArray([])

  constructor () {
    super()
    this.esbuildInitialized = Promise.resolve(this.initializeEsbuild())
  }

  async initializeEsbuild () {
    await esbuild.initialize({ wasmURL })
  }

  protected async compile (code: string) {
    try {
      await this.esbuildInitialized
    } catch (err) {
      this.errors.push(err)
    }
    try {
      const r = await esbuild.transform(code)
      this.warnings(r.warnings)
      this.errors([])
      return r
    } catch (err: esbuild.TransformFailure) {
      this.warnings(err.warnings)
      this.errors(err.errors)
      return { code: '' }
    }
  }
}
