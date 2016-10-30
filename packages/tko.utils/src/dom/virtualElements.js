/* eslint no-cond-assign: 0 */
//
// Virtual Elements
//
//
// "Virtual elements" is an abstraction on top of the usual DOM API which understands the notion that comment nodes
// may be used to represent hierarchy (in addition to the DOM's natural hierarchy).
// If you call the DOM-manipulating functions on ko.virtualElements, you will be able to read and write the state
// of that virtual hierarchy
//
// The point of all this is to support containerless templates (e.g., <!-- ko foreach:someCollection -->blah<!-- /ko -->)
// without having to scatter special cases all over the binding and templating code.

// IE 9 cannot reliably read the "nodeValue" property of a comment node (see https://github.com/SteveSanderson/knockout/issues/186)
// but it does give them a nonstandard alternative property called "text" that it can read reliably. Other browsers don't have that property.
// So, use node.text where available, and node.nodeValue elsewhere
import { emptyDomNode, setDomNodeChildren as setRegularDomNodeChildren } from './manipulation.js';
import { removeNode } from './disposal.js';
import { tagNameLower } from './info.js';


var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";

export var startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko(?:\s+([\s\S]+))?\s*-->$/ : /^\s*ko(?:\s+([\s\S]+))?\s*$/;
export var endCommentRegex =   commentNodesHaveTextProperty ? /^<!--\s*\/ko\s*-->$/ : /^\s*\/ko\s*$/;
var htmlTagsWithOptionallyClosingChildren = { 'ul': true, 'ol': true };

export function isStartComment(node) {
    return (node.nodeType == 8) && startCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
}

export function isEndComment(node) {
    return (node.nodeType == 8) && endCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
}

export function getVirtualChildren(startComment, allowUnbalanced) {
    var currentNode = startComment;
    var depth = 1;
    var children = [];
    while (currentNode = currentNode.nextSibling) {
        if (isEndComment(currentNode)) {
            depth--;
            if (depth === 0)
                return children;
        }

        children.push(currentNode);

        if (isStartComment(currentNode))
            depth++;
    }
    if (!allowUnbalanced)
        throw new Error("Cannot find closing comment tag to match: " + startComment.nodeValue);
    return null;
}

function getMatchingEndComment(startComment, allowUnbalanced) {
    var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
    if (allVirtualChildren) {
        if (allVirtualChildren.length > 0)
            return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
        return startComment.nextSibling;
    } else
        return null; // Must have no matching end comment, and allowUnbalanced is true
}

function getUnbalancedChildTags(node) {
    // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
    //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
    var childNode = node.firstChild, captureRemaining = null;
    if (childNode) {
        do {
            if (captureRemaining)                   // We already hit an unbalanced node and are now just scooping up all subsequent nodes
                captureRemaining.push(childNode);
            else if (isStartComment(childNode)) {
                var matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true);
                if (matchingEndComment)             // It's a balanced tag, so skip immediately to the end of this virtual set
                    childNode = matchingEndComment;
                else
                    captureRemaining = [childNode]; // It's unbalanced, so start capturing from this point
            } else if (isEndComment(childNode)) {
                captureRemaining = [childNode];     // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
            }
        } while (childNode = childNode.nextSibling);
    }
    return captureRemaining;
}

export var allowedBindings = {};
export var hasBindingValue = isStartComment;

export function childNodes(node) {
    return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
}

export function emptyNode(node) {
    if (!isStartComment(node))
        emptyDomNode(node);
    else {
        var virtualChildren = childNodes(node);
        for (var i = 0, j = virtualChildren.length; i < j; i++)
            removeNode(virtualChildren[i]);
    }
}

export function setDomNodeChildren(node, childNodes) {
    if (!isStartComment(node))
        setRegularDomNodeChildren(node, childNodes);
    else {
        emptyNode(node);
        var endCommentNode = node.nextSibling; // Must be the next sibling, as we just emptied the children
        for (var i = 0, j = childNodes.length; i < j; i++)
            endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
    }
}

export function prepend(containerNode, nodeToPrepend) {
    if (!isStartComment(containerNode)) {
        if (containerNode.firstChild)
            containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
        else
            containerNode.appendChild(nodeToPrepend);
    } else {
        // Start comments must always have a parent and at least one following sibling (the end comment)
        containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
    }
}

export function insertAfter(containerNode, nodeToInsert, insertAfterNode) {
    if (!insertAfterNode) {
        prepend(containerNode, nodeToInsert);
    } else if (!isStartComment(containerNode)) {
        // Insert after insertion point
        if (insertAfterNode.nextSibling)
            containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
        else
            containerNode.appendChild(nodeToInsert);
    } else {
        // Children of start comments must always have a parent and at least one following sibling (the end comment)
        containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
    }
}

export function firstChild(node) {
    if (!isStartComment(node)) {
        return node.firstChild;
    }
    if (!node.nextSibling || isEndComment(node.nextSibling)) {
        return null;
    }
    return node.nextSibling;
}


export function lastChild(node) {
    var nextChild = firstChild(node),
        lastChildNode;

    do {
        lastChildNode = nextChild;
    } while (nextChild = nextSibling(nextChild));

    return lastChildNode;
}

export function nextSibling(node) {
    if (isStartComment(node))
        node = getMatchingEndComment(node);
    if (node.nextSibling && isEndComment(node.nextSibling))
        return null;
    return node.nextSibling;
}

export function previousSibling(node) {
    var depth = 0;
    do {
        if (node.nodeType === 8) {
            if (isStartComment(node)) {
                if (--depth === 0) {
                    return node;
                }
            } else if (isEndComment(node)) {
                depth++;
            }
        } else {
            if (depth === 0) { return node; }
        }
    } while (node = node.previousSibling);
    return;
}

export function virtualNodeBindingValue(node) {
    var regexMatch = (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(startCommentRegex);
    return regexMatch ? regexMatch[1] : null;
}

export function normaliseVirtualElementDomStructure(elementVerified) {
    // Workaround for https://github.com/SteveSanderson/knockout/issues/155
    // (IE <= 8 or IE 9 quirks mode parses your HTML weirdly, treating closing </li> tags as if they don't exist, thereby moving comment nodes
    // that are direct descendants of <ul> into the preceding <li>)
    if (!htmlTagsWithOptionallyClosingChildren[tagNameLower(elementVerified)])
        return;

    // Scan immediate children to see if they contain unbalanced comment tags. If they do, those comment tags
    // must be intended to appear *after* that child, so move them there.
    var childNode = elementVerified.firstChild;
    if (childNode) {
        do {
            if (childNode.nodeType === 1) {
                var unbalancedTags = getUnbalancedChildTags(childNode);
                if (unbalancedTags) {
                    // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
                    var nodeToInsertBefore = childNode.nextSibling;
                    for (var i = 0; i < unbalancedTags.length; i++) {
                        if (nodeToInsertBefore)
                            elementVerified.insertBefore(unbalancedTags[i], nodeToInsertBefore);
                        else
                            elementVerified.appendChild(unbalancedTags[i]);
                    }
                }
            }
        } while (childNode = childNode.nextSibling);
    }
}
