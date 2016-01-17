
import { memoization } from '../index.js'


function parseMemoCommentHtml(commentHtml) {
    commentHtml = commentHtml.replace("<!--", "").replace("-->", "");
    return memoization.parseMemoText(commentHtml);
}

describe('Memoization', function() {
    it("Should only accept a function", function () {
        var threw = false;
        try { memoization.memoize({}) }
        catch (ex) { threw = true; }
        expect(threw).toEqual(true);
    });

    it("Should return an HTML comment", function () {
        var result = memoization.memoize(function () { });
        expect(typeof result).toEqual("string");
        expect(result.substring(0, 4)).toEqual("<!--");
    });

    it("Should call the function when unmemoizing", function () {
        var didCall = false;
        var memo = memoization.memoize(function () { didCall = true });
        memoization.unmemoize(parseMemoCommentHtml(memo));
        expect(didCall).toEqual(true);
    });

    it("Should not be able to unmemoize more than once", function () {
        var memo = memoization.memoize(function () { });
        memoization.unmemoize(parseMemoCommentHtml(memo));

        var threw = false;
        try { memoization.unmemoize(parseMemoCommentHtml(memo)) }
        catch (ex) { threw = true; }
        expect(threw).toEqual(true);
    });

    it("Should be able to find memos in a DOM tree and unmemoize them, passing the memo node as a param", function () {
        var containerNode = document.createElement("DIV");
        var didCall = false;
        containerNode.innerHTML = "Hello " + memoization.memoize(function (domNode) {
            expect(domNode.parentNode).toEqual(containerNode);
            didCall = true;
        });
        memoization.unmemoizeDomNodeAndDescendants(containerNode);
        expect(didCall).toEqual(true);
    });

    it("After unmemoizing a DOM tree, removes the memo nodes", function () {
        var containerNode = document.createElement("DIV");
        containerNode.innerHTML = "Hello " + memoization.memoize(function () { });

        expect(containerNode.childNodes.length).toEqual(2);
        memoization.unmemoizeDomNodeAndDescendants(containerNode);
        expect(containerNode.childNodes.length).toEqual(1);
    });
});
