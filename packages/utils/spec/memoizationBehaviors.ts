import { expect } from 'chai'

import { memoization } from '../dist'

function parseMemoCommentHtml(commentHtml) {
  commentHtml = commentHtml.replace('<!--', '').replace('-->', '')
  return memoization.parseMemoText(commentHtml)
}

describe('Memoization', function () {
  it('Should only accept a function', function () {
    expect(function () {
      memoization.memoize({})
    }).to.throw()
  })

  it('Should return an HTML comment', function () {
    const result = memoization.memoize(function () {})
    expect(typeof result).to.equal('string')
    expect(result.substring(0, 4)).to.equal('<!--')
  })

  it('Should call the function when unmemoizing', function () {
    let didCall = false
    const memo = memoization.memoize(function () {
      didCall = true
    })
    memoization.unmemoize(parseMemoCommentHtml(memo))
    expect(didCall).to.equal(true)
  })

  it('Should not be able to unmemoize more than once', function () {
    const memo = memoization.memoize(function () {})
    memoization.unmemoize(parseMemoCommentHtml(memo))

    expect(function () {
      memoization.unmemoize(parseMemoCommentHtml(memo))
    }).to.throw()
  })

  it('Should be able to find memos in a DOM tree and unmemoize them, passing the memo node as a param', function () {
    const containerNode = document.createElement('DIV')
    let didCall = false
    containerNode.innerHTML =
      'Hello '
      + memoization.memoize(function (domNode) {
        expect(domNode.parentNode).to.equal(containerNode)
        didCall = true
      })
    memoization.unmemoizeDomNodeAndDescendants(containerNode)
    expect(didCall).to.equal(true)
  })

  it('After unmemoizing a DOM tree, removes the memo nodes', function () {
    const containerNode = document.createElement('DIV')
    containerNode.innerHTML = 'Hello ' + memoization.memoize(function () {})

    expect(containerNode.childNodes.length).to.equal(2)
    memoization.unmemoizeDomNodeAndDescendants(containerNode)
    expect(containerNode.childNodes.length).to.equal(1)
  })
})
