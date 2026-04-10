import { expect } from 'chai'
import sinon from 'sinon'

import { useMockForTasks, restoreAfter } from '../helpers/mocha-test-helpers'
import { tasks, options } from '../dist'

function waitForNextTaskCycle() {
  return new Promise<void>(resolve => {
    setTimeout(resolve, 0)
  })
}

describe('Tasks', function () {
  let cleanups: Array<() => void>
  let clock: sinon.SinonFakeTimers

  beforeEach(function () {
    cleanups = []
    clock = sinon.useFakeTimers()
    useMockForTasks(cleanups)
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).to.equal(0)
    while (cleanups.length) {
      cleanups.pop()!()
    }
    clock.restore()
  })

  it('Should run in next execution cycle', function () {
    let runCount = 0
    tasks.schedule(function () {
      runCount++
    })
    expect(runCount).to.equal(0)

    clock.tick(1)
    expect(runCount).to.equal(1)
  })

  it('Should run multiple times if added more than once', function () {
    let runCount = 0
    const func = function () {
      runCount++
    }
    tasks.schedule(func)
    tasks.schedule(func)
    expect(runCount).to.equal(0)

    clock.tick(1)
    expect(runCount).to.equal(2)
  })

  it('Should run scheduled tasks in the order they were scheduled', function () {
    const runValues = new Array<number>()
    const func = function (value: number) {
      runValues.push(value)
    }

    tasks.schedule(func.bind(null, 1))
    tasks.schedule(func.bind(null, 2))

    clock.tick(1)
    expect(runValues).to.deep.equal([1, 2])
  })

  it('Should run tasks again if scheduled after a previous run', function () {
    let runCount = 0
    const func = function () {
      runCount++
    }
    tasks.schedule(func)
    expect(runCount).to.equal(0)

    clock.tick(1)
    expect(runCount).to.equal(1)

    tasks.schedule(func)
    expect(runCount).to.equal(1)

    clock.tick(1)
    expect(runCount).to.equal(2)
  })

  it('Should process newly scheduled tasks during task processing', function () {
    const runValues = new Array<string>()
    const func = function (value: string) {
      runValues.push(value)
      tasks.schedule(function () {
        runValues.push('x')
      })
    }

    tasks.schedule(func.bind(null, 'i'))
    expect(runValues).to.deep.equal([])

    clock.tick(1)
    expect(runValues).to.deep.equal(['i', 'x'])
  })

  it('Should keep correct state if a task throws an exception', function () {
    const runValues = new Array<number>()
    const func = function (value: number) {
      runValues.push(value)
    }
    tasks.schedule(func.bind(null, 1))
    tasks.schedule(function () {
      throw Error('test')
    })
    tasks.schedule(func.bind(null, 2))
    expect(runValues).to.deep.equal([])

    expect(function () {
      clock.tick(1)
    }).to.throw()
    expect(runValues).to.deep.equal([1, 2])
  })

  it('Should stop recursive task processing after a fixed number of iterations', function () {
    const runValues = new Array<string>()
    const func = function () {
      runValues.push('x')
      tasks.schedule(function () {})
      tasks.schedule(func)
    }

    tasks.schedule(func)
    expect(runValues).to.deep.equal([])

    expect(function () {
      clock.tick(1)
    }).to.throw('Too much recursion')

    expect(runValues.length).to.equal(5000)
  })

  it('Should not stop non-recursive task processing', function () {
    const runValues = new Array<string>()
    const func = function () {
      runValues.push('x')
    }

    for (let i = 0; i < 10000; ++i) {
      tasks.schedule(func)
    }
    expect(runValues).to.deep.equal([])

    clock.tick(1)
    expect(runValues.length).to.equal(10000)
  })

  describe('Cancel', function () {
    it('Should prevent task from running', function () {
      let runCount = 0
      const handle = tasks.schedule(function () {
        runCount++
      })
      tasks.cancel(handle)

      clock.tick(1)
      expect(runCount).to.equal(0)
    })

    it('Should prevent only the canceled task', function () {
      let runCount = 0
      const func = function () {
        runCount++
      }
      const handle1 = tasks.schedule(func)
      const handle2 = tasks.schedule(func)
      void handle1
      tasks.cancel(handle2)

      clock.tick(1)
      expect(runCount).to.equal(1)
    })

    it('Should do nothing if task has already run', function () {
      const runValues = new Array<number>()
      const func = function (value: number) {
        runValues.push(value)
      }
      const handle1 = tasks.schedule(func.bind(null, 1))
      expect(runValues).to.deep.equal([])

      clock.tick(1)
      expect(runValues).to.deep.equal([1])

      tasks.schedule(func.bind(null, 2))

      tasks.cancel(handle1)

      clock.tick(1)
      expect(runValues).to.deep.equal([1, 2])
    })

    it('Should work correctly after a task throws an exception', function () {
      const runValues = new Array<number>()
      let handle: number
      const func = function (value: number) {
        runValues.push(value)
      }

      tasks.schedule(func.bind(null, 1))
      tasks.schedule(function () {
        throw Error('test')
      })
      tasks.schedule(function () {
        tasks.cancel(handle)
      })
      handle = tasks.schedule(func.bind(null, 2))
      tasks.schedule(func.bind(null, 3))
      expect(runValues).to.deep.equal([])

      expect(function () {
        clock.tick(1)
      }).to.throw()
      expect(runValues).to.deep.equal([1, 3])
    })
  })

  describe('runEarly', function () {
    it('Should run tasks early', function () {
      const runValues = new Array<number>()
      const func = function (value: number) {
        runValues.push(value)
      }
      tasks.schedule(func.bind(null, 1))
      expect(runValues).to.deep.equal([])

      tasks.runEarly()
      expect(runValues).to.deep.equal([1])
    })

    it('Should run tasks early during task processing', function () {
      const runValues = new Array<number>()
      const func = function (value: number) {
        runValues.push(value)
      }

      tasks.schedule(function () {
        tasks.schedule(func.bind(null, 2))
        expect(runValues).to.deep.equal([])

        tasks.runEarly()
        expect(runValues).to.deep.equal([1, 2])

        tasks.schedule(func.bind(null, 3))
      })
      tasks.schedule(func.bind(null, 1))

      clock.tick(1)
      expect(runValues).to.deep.equal([1, 2, 3])
    })

    it('Should stop recursive task processing after a fixed number of iterations', function () {
      const runValues = new Array<string>()
      const func = function () {
        runValues.push('x')
        tasks.schedule(function () {})
        tasks.schedule(func)
      }

      tasks.schedule(func)
      expect(runValues).to.deep.equal([])

      tasks.runEarly()
      expect(runValues.length).to.equal(5000)

      expect(function () {
        clock.tick(1)
      }).to.throw('Too much recursion')

      expect(runValues.length).to.equal(5000)
    })

    it('Should keep correct state if a task throws an exception', function () {
      const runValues = new Array<number>()
      const func = function (value: number) {
        runValues.push(value)
      }
      tasks.schedule(func.bind(null, 1))
      tasks.schedule(function () {
        expect(runValues).to.deep.equal([1])
        tasks.runEarly()
        expect(runValues).to.deep.equal([1, 2])
        tasks.schedule(func.bind(null, 3))
      })
      tasks.schedule(function () {
        throw Error('test')
      })
      tasks.schedule(func.bind(null, 2))
      expect(runValues).to.deep.equal([])

      expect(function () {
        clock.tick(1)
      }).to.throw()
      expect(runValues).to.deep.equal([1, 2, 3])
    })
  })
})

describe('Tasks options.taskScheduler', function () {
  let cleanups: Array<() => void>
  let clock: sinon.SinonFakeTimers | undefined

  beforeEach(function () {
    cleanups = []
    clock = undefined
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).to.equal(0)
    while (cleanups.length) {
      cleanups.pop()!()
    }
    clock?.restore()
  })

  it('Should process tasks asynchronously', async function () {
    let runCount = 0
    function func() {
      runCount++
    }
    tasks.schedule(func)
    expect(runCount).to.equal(0)

    await waitForNextTaskCycle()
    expect(runCount).to.equal(1)

    tasks.schedule(func)
    expect(runCount).to.equal(1)

    await waitForNextTaskCycle()
    expect(runCount).to.equal(2)
  })

  it('Should run only once for a set of tasks', function () {
    let counts = [0, 0]

    clock = sinon.useFakeTimers()
    restoreAfter(cleanups, options, 'taskScheduler')
    options.taskScheduler = function (callback) {
      ++counts[0]
      setTimeout(callback, 0)
    }

    function func() {
      ++counts[1]
    }

    tasks.schedule(func)
    expect(counts).to.deep.equal([1, 0])
    tasks.schedule(func)
    expect(counts).to.deep.equal([1, 0])
    clock.tick(1)
    expect(counts).to.deep.equal([1, 2])

    counts = [0, 0]
    tasks.schedule(func)
    tasks.schedule(func)
    clock.tick(1)
    expect(counts).to.deep.equal([1, 2])

    counts = [0, 0]
    tasks.schedule(func)
    expect(counts).to.deep.equal([1, 0])

    tasks.runEarly()
    expect(counts).to.deep.equal([1, 1])

    tasks.schedule(func)
    expect(counts).to.deep.equal([1, 1])

    clock.tick(1)
    expect(counts).to.deep.equal([1, 2])
  })
})
