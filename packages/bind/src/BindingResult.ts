import type { BindingContext } from './bindingContext';


export class BindingResult {
  isSync: boolean
  isComplete: boolean
  completionPromise: Promise<BindingResult>
  rootNode: Node;
  bindingContext: BindingContext;

  constructor({asyncBindingsApplied, rootNode, bindingContext}) {
    this.rootNode = rootNode;
    this.bindingContext = bindingContext;
    this.isSync = asyncBindingsApplied.size === 0
    this.isComplete = this.isSync;

    if (!this.isSync) {
      this.completionPromise = this.completeWhenBindingsFinish(asyncBindingsApplied)
    }
  }

  async completeWhenBindingsFinish(asyncBindingsApplied: Set<any>) {
    await Promise.all(asyncBindingsApplied)
    this.isComplete = true
    return this
  }
}
