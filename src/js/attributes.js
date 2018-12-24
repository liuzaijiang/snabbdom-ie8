/**
 * 
 * @authors ${author} (${email})
 * @date    2018-11-14
 * @version $Id$
 */

var AttributesModule = {};

(function(AttributesModule) {
	var NamespaceURIs = {
		"xlink": "http://www.w3.org/1999/xlink"
	};

	/*
	从elm的属性中删除vnode中不存在的属性（包括那些boolean类属性，如果新vnode设置为false，同样删除）

	如果oldvnode与vnode用同名属性，则在elm上更新对应属性值

	如果vnode有新属性，则添加到elm中

	如果存在命名空间，则用setAttributeNS设置

	*/
	var booleanAttrs = ["allowfullscreen", "async", "autofocus", "autoplay", "checked", "compact", "controls", "declare",
		"default", "defaultchecked", "defaultmuted", "defaultselected", "defer", "disabled", "draggable",
		"enabled", "formnovalidate", "hidden", "indeterminate", "inert", "ismap", "itemscope", "loop", "multiple",
		"muted", "nohref", "noresize", "noshade", "novalidate", "nowrap", "open", "pauseonexit", "readonly",
		"required", "reversed", "scoped", "seamless", "selected", "sortable", "spellcheck", "translate",
		"truespeed", "typemustmatch", "visible"
	];

	//var booleanAttrsDict = Object.create(null);
	var booleanAttrsDict = {};
	for (var i = 0, len = booleanAttrs.length; i < len; i++) {
		booleanAttrsDict[booleanAttrs[i]] = true;
	}

	//用来对比新，老VNode节点的属性即：VNode.data.attrs
	function updateAttrs(oldVnode, vnode) {
		var key, cur, old, elm = vnode.elm,
			oldAttrs = oldVnode.data.attrs,
			attrs = vnode.data.attrs,
			namespaceSplit;

		//如果旧节点和新节点都不包含属性，立刻返回
		if (!oldAttrs && !attrs) return;
		oldAttrs = oldAttrs || {};
		attrs = attrs || {};

		//遍历新节点的属性
		for (key in attrs) {
			cur = attrs[key];
			old = oldAttrs[key];
			//如果旧的属性和新的属性不同
			if (old !== cur) {
				//如果是boolean类属性，当vnode设置为falsy value时，直接删除，而不是更新值
				if (!cur && booleanAttrsDict[key])
					elm.removeAttribute(key);
				else {
					//否则更新属性值或者添加属性
					//如果存在命名空间
					namespaceSplit = key.split(":");
					if (namespaceSplit.length > 1 && NamespaceURIs.hasOwnProperty(namespaceSplit[0]))
						elm.setAttributeNS(NamespaceURIs[namespaceSplit[0]], key, cur);
					else
						elm.setAttribute(key, cur);
				}
			}
		}
		//remove removed attributes
		// use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
		// the other option is to remove all attributes with value == undefined
		//删除不在新节点属性中的旧节点的属性
		for (key in oldAttrs) {
			if (!(key in attrs)) {
				elm.removeAttribute(key);
			}
		}
	}

	AttributesModule.create = updateAttrs;
	AttributesModule.update = updateAttrs;

})(AttributesModule)