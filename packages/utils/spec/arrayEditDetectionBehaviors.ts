import { compareArrays } from '../dist'

describe('Compare Arrays', function () {
  it('Should recognize when two arrays have the same contents', function () {
    let subject = ['A', {}, function () {}]
    let compareResult = compareArrays(subject, subject.slice(0))

    expect(compareResult.length).toEqual(subject.length)
    for (let i = 0; i < subject.length; i++) {
      expect(compareResult[i].status).toEqual('retained')
      expect(compareResult[i].value).toEqual(subject[i])
    }
  })

  it('Should recognize added items', function () {
    let oldArray = ['A', 'B']
    let newArray = ['A', 'A2', 'A3', 'B', 'B2']
    let compareResult = compareArrays(oldArray, newArray)
    expect(compareResult).toEqual([
      { status: 'retained', value: 'A' },
      { status: 'added', value: 'A2', index: 1 },
      { status: 'added', value: 'A3', index: 2 },
      { status: 'retained', value: 'B' },
      { status: 'added', value: 'B2', index: 4 }
    ])
  })

  it('Should recognize deleted items', function () {
    let oldArray = ['A', 'B', 'C', 'D', 'E']
    let newArray = ['B', 'C', 'E']
    let compareResult = compareArrays(oldArray, newArray)
    expect(compareResult).toEqual([
      { status: 'deleted', value: 'A', index: 0 },
      { status: 'retained', value: 'B' },
      { status: 'retained', value: 'C' },
      { status: 'deleted', value: 'D', index: 3 },
      { status: 'retained', value: 'E' }
    ])
  })

  it('Should recognize mixed edits', function () {
    let oldArray = ['A', 'B', 'C', 'D', 'E']
    let newArray = [123, 'A', 'E', 'C', 'D']
    let compareResult = compareArrays(oldArray, newArray)
    expect(compareResult).toEqual([
      { status: 'added', value: 123, index: 0 },
      { status: 'retained', value: 'A' },
      { status: 'deleted', value: 'B', index: 1 },
      { status: 'added', value: 'E', index: 2, moved: 4 },
      { status: 'retained', value: 'C' },
      { status: 'retained', value: 'D' },
      { status: 'deleted', value: 'E', index: 4, moved: 2 }
    ])
  })

  it('Should recognize replaced array', function () {
    let oldArray = ['A', 'B', 'C', 'D', 'E']
    let newArray = ['F', 'G', 'H', 'I', 'J']
    let compareResult = compareArrays(oldArray, newArray)
    // The ordering of added/deleted items for replaced entries isn't defined, so
    // we'll sort the results first to ensure the results are in a known order for verification.
    compareResult.sort(function (a, b) {
      return a.index - b.index || a.status.localeCompare(b.status)
    })
    expect(compareResult).toEqual([
      { status: 'added', value: 'F', index: 0 },
      { status: 'deleted', value: 'A', index: 0 },
      { status: 'added', value: 'G', index: 1 },
      { status: 'deleted', value: 'B', index: 1 },
      { status: 'added', value: 'H', index: 2 },
      { status: 'deleted', value: 'C', index: 2 },
      { status: 'added', value: 'I', index: 3 },
      { status: 'deleted', value: 'D', index: 3 },
      { status: 'added', value: 'J', index: 4 },
      { status: 'deleted', value: 'E', index: 4 }
    ])
  })

  it('Should support sparse diffs', function () {
    // A sparse diff is exactly like a regular diff, except it doesn't contain any
    // 'retained' items. This still preserves enough information for most things
    // you'd want to do with the changeset.

    let oldArray = ['A', 'B', 'C', 'D', 'E']
    let newArray = [123, 'A', 'E', 'C', 'D']
    let compareResult = compareArrays(oldArray, newArray, { sparse: true })
    expect(compareResult).toEqual([
      { status: 'added', value: 123, index: 0 },
      { status: 'deleted', value: 'B', index: 1 },
      { status: 'added', value: 'E', index: 2, moved: 4 },
      { status: 'deleted', value: 'E', index: 4, moved: 2 }
    ])
  })

  it('Should honor "dontLimitMoves" option', function () {
    // In order to test this, we must have a scenario in which a move is not recognized as such without the option.
    // This scenario doesn't represent the definition of the spec itself and may need to be modified if the move
    // detection algorithm in Knockout is changed.
    let oldArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T']
    let newArray = [1, 2, 3, 4, 'T', 6, 7, 8, 9, 10]

    let compareResult = compareArrays(oldArray, newArray)
    expect(compareResult[compareResult.length - 1]).toEqual({ status: 'deleted', value: 'T', index: 19 })

    compareResult = compareArrays(oldArray, newArray, { dontLimitMoves: true })
    expect(compareResult[compareResult.length - 1]).toEqual({ status: 'deleted', value: 'T', index: 19, moved: 4 })
  })
})
