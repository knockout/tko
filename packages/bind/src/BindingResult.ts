

export class BindingResult {
  
  isSync : boolean
  isComplete : boolean
  completionPromise : Promise<BindingResult>
  
  constructor ({asyncBindingsApplied, rootNode, bindingContext}) {
    Object.assign(this, {
      rootNode,
      bindingContext,
      isSync: asyncBindingsApplied.size === 0,
      isComplete: this.isSync
    })

    if (!this.isSync) {
      this.completionPromise = this.completeWhenBindingsFinish(asyncBindingsApplied)
    }
  }

  async completeWhenBindingsFinish (asyncBindingsApplied) {
    await Promise.all(asyncBindingsApplied)
    this.isComplete = true
    return this
  }
}
