
import { BindingHandler } from '@tko/bind'
import loader from '@monaco-editor/loader'

class MonacoHandler extends BindingHandler {
  constructor (params: any) {
    super(params)
    this.initMonaco()
  }

  async initMonaco () {
    const monaco = await loader.init()
    await new Promise(r => setTimeout(r, 200))
    const editor = monaco.editor.create(this.$element, {
      value: '// some comment',
      language: 'typescript',
    })

    editor.onDidChangeModelContent(console.info)
    // temp1.getModel().getValue()
    console.log(`editor`, editor)
  }
}

MonacoHandler.registerAs('monaco-handler')
