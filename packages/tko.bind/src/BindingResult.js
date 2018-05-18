

export class BindingResult {
  constructor ({asyncBindingsApplied}) {
    this.isSync = asyncBindingsApplied.size === 0
    this.isComplete = this.isSync

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
