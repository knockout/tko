
import {
    arrayPushAll
} from 'tko.utils';

var dataBind = 'data-bind';


// Performance comparison at http://jsperf.com/markup-interpolation-comparison
function parseInterpolationMarkup(textToParse, outerTextCallback, expressionCallback) {
    function innerParse(text) {
        var innerMatch = text.match(/^([\s\S]*)}}([\s\S]*?)\{\{([\s\S]*)$/);
        if (innerMatch) {
            innerParse(innerMatch[1]);
            outerTextCallback(innerMatch[2]);
            expressionCallback(innerMatch[3]);
        } else {
            expressionCallback(text);
        }
    }

    var outerMatch = textToParse.match(/^([\s\S]*?)\{\{([\s\S]*)}}([\s\S]*)$/);

    if (outerMatch) {
        outerTextCallback(outerMatch[1]);
        innerParse(outerMatch[2]);
        outerTextCallback(outerMatch[3]);
    }
}

function trim(string) {
    return string ? string.trim() : '';
}

function interpolationMarkupPreprocessor(node) {
    var nodes = [];

    function addTextNode(text) {
        if (text) {
            nodes.push(document.createTextNode(text));
        }
    }

    function wrapExpr(expressionText) {
        if (expressionText) {
            nodes.push.apply(nodes, interpolationMarkup.wrapExpression(expressionText, node));
        }
    }

    // only needs to work with text nodes
    if (node.nodeType === 3 && node.nodeValue && node.nodeValue.indexOf('{{') !== -1 && (node.parentNode || {}).nodeName != "TEXTAREA") {
        parseInterpolationMarkup(node.nodeValue, addTextNode, wrapExpr);

        if (nodes.length) {
            if (node.parentNode) {
                for (var i = 0, n = nodes.length, parent = node.parentNode; i < n; ++i) {
                    parent.insertBefore(nodes[i], node);
                }
                parent.removeChild(node);
            }
            return nodes;
        }
    }
}


function wrapExpression(expressionText_, node) {
    var ownerDocument = node ? node.ownerDocument : document,
        closeComment = true,
        binding,
        expressionText = trim(expressionText_),
        firstChar = expressionText[0],
        lastChar = expressionText[expressionText.length - 1],
        result = [],
        matches;

    if (firstChar === '#') {
        if (lastChar === '/') {
            binding = expressionText.slice(1, -1);
        } else {
            binding = expressionText.slice(1);
            closeComment = false;
        }
        matches = binding.match(/^([^,"'{}()\/:[\]\s]+)\s+([^\s:].*)/);
        if (matches) {
            binding = matches[1] + ':' + matches[2];
        }
    } else if (firstChar === '/') {
        // replace only with a closing comment
    } else if (firstChar === '{' && lastChar === '}') {
        binding = "html:" + trim(expressionText.slice(1, -1));
    } else {
        binding = "text:" + trim(expressionText);
    }

    if (binding) {
        result.push(ownerDocument.createComment("ko " + binding));
    }
    if (closeComment) {
        result.push(ownerDocument.createComment("/ko"));
    }
    return result;
}


function attributeInterpolationMarkerPreprocessor(node, provider) {
    function addText(text) {
        if (text) {
            parts.push('"' + text.replace(/"/g, '\\"') + '"');
        }
    }

    function addExpr(expressionText) {
        if (expressionText) {
            attrValue = expressionText;
            parts.push('@' + expressionText);
        }
    }

    if (node.nodeType === 1 && node.attributes.length) {
        var dataBindAttribute = node.getAttribute(dataBind);
        for (var attrs = arrayPushAll([], node.attributes), n = attrs.length, i = 0; i < n; ++i) {
            var attr = attrs[i];
            if (attr.specified && attr.name != dataBind && attr.value.indexOf('{{') !== -1) {
                var parts = [], attrValue = '';
                parseInterpolationMarkup(attr.value, addText, addExpr);

                if (parts.length > 1) {
                    attrValue = '""+' + parts.join('+');
                }

                if (attrValue) {
                    var attrName = attr.name.toLowerCase();
                    var attrBinding = attributeInterpolationMarkup.attributeBinding(attrName, attrValue, provider) || attributeBinding(attrName, attrValue, provider);
                    if (!dataBindAttribute) {
                        dataBindAttribute = attrBinding;
                    } else {
                        dataBindAttribute += ',' + attrBinding;
                    }
                    node.setAttribute(dataBind, dataBindAttribute);
                    // Using removeAttribute instead of removeAttributeNode because IE clears the
                    // class if you use removeAttributeNode to remove the id.
                    node.removeAttribute(attr.name);
                }
            }
        }
    }
}

function attributeBinding(name, value, provider) {
    if (provider.bindingHandlers.get(name)) {
        return name + ':' + value;
    } else {
        return 'attr.' + name + ':' + value;
    }
}


// Exports
export var interpolationMarkup = {
    preprocessor: interpolationMarkupPreprocessor,
    wrapExpression: wrapExpression
};

export var attributeInterpolationMarkup = {
    preprocessor: attributeInterpolationMarkerPreprocessor,
    attributeBinding: attributeBinding
};
