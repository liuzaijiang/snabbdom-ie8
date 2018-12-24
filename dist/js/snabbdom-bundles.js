if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun /* , thisArg*/ ) {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var res = [];
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++) {
      if (i in t) {
        var val = t[i];
        if (fun.call(thisArg, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
}


if (!Array.prototype.forEach) {

  Array.prototype.forEach = function(callback, thisArg) {

    var T, k;

    if (this == null) {
      throw new TypeError(' this is null or not defined');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== "function") {
      throw new TypeError(callback + ' is not a function');
    }

    if (arguments.length > 1) {
      T = thisArg;
    }

    k = 0;

    while (k < len) {

      var kValue;

      if (k in O) {
        kValue = O[k];
        callback.call(T, kValue, k, O);
      }
      k++;
    }
  };
}

function addEventListener(ele, event, fn) {
  if (ele.attachEvent) {
    ele.attachEvent('on' + event, fn);
  } else if (ele.addEventListener) {
    ele.addEventListener(event, fn, false);
  }
}

function removeEventListener(ele, event, fn) {
  if (ele.detachEvent) {
    ele.detachEvent('on' + event, fn);
  } else if (ele.removeEventListener) {
    ele.removeEventListener(event, fn, false);
  }
}
var isModule = {
	array: function(s) {
		return (Array.isArray && Array.isArray(s)) || Object.prototype.toString.call(s) == '[object Array]';
	},
	primitive: function(s) {
		return typeof s === 'string' || typeof s === 'number';
	}
};
/**
 * 
 * @authors ${author} (${email})
 * @date    2018-11-14
 * @version $Id$
 */
/*
将elm上存在于oldvnode中但不存在于vnode中不存在的style置空

如果vnode.style中的delayed与oldvnode的不同，则更新delayed的属性值，并在下一帧将elm的style设置为该值，从而实现动画过渡效果

非delayed和remove的style直接更新

vnode被destroy时，直接将对应style更新为vnode.data.style.destory的值

vnode被reomve时，如果style.remove不存在，直接调用全局remove钩子进入下一个remove过程
如果style.remove存在，那么我们就需要设置remove动画过渡效果，等到过渡效果结束之后，才调用下一个remove过程


*/

var StyleModule = {};

(function(StyleModule) {
	//如果存在requestAnimationFrame，则直接使用，以优化性能，否则用setTimeout
	var raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || setTimeout;
	var nextFrame = function(fn) {
		raf(function() {
			raf(fn);
		});
	};

	//通过nextFrame来实现动画效果
	function setNextFrame(obj, prop, val) {
		nextFrame(function() {
			obj[prop] = val;
		});
	}

	function updateStyle(oldVnode, vnode) {
		var cur, name, elm = vnode.elm,
			oldStyle = oldVnode.data.style,
			style = vnode.data.style;
		//如果oldvnode和vnode都没有style，直接返回
		if (!oldStyle && !style) return;
		oldStyle = oldStyle || {};
		style = style || {};
		var oldHasDel = 'delayed' in oldStyle;
		//遍历oldvnode的style
		for (name in oldStyle) {
			//如果vnode中无该style，则置空
			if (!style[name]) {
				elm.style[name] = '';
			}
		}
		//如果vnode的style中有delayed且与oldvnode中的不同，则在下一帧设置delayed的参数
		for (name in style) {
			cur = style[name];
			if (name === 'delayed') {
				for (name in style.delayed) {
					cur = style.delayed[name];
					if (!oldHasDel || cur !== oldStyle.delayed[name]) {
						setNextFrame(elm.style, name, cur);
					}
				}
			}
			//如果不是delayed和remove的style，且不同于oldvnode的值，则直接设置新值
			else if (name !== 'remove' && cur !== oldStyle[name]) {
				elm.style[name] = cur;
			}
		}
	}

	//设置节点被destory时的style
	function applyDestroyStyle(vnode) {
		var style, name, elm = vnode.elm,
			s = vnode.data.style;
		if (!s || !(style = s.destroy)) return;
		for (name in style) {
			elm.style[name] = style[name];
		}
	}
	//删除效果，当我们删除一个元素时，先回调用删除过度效果，过渡完才会将节点remove
	function applyRemoveStyle(vnode, rm) {
		var s = vnode.data.style;
		//如果没有style或没有style.remove
		if (!s || !s.remove) {
			//直接调用rm，即实际上是调用全局的remove钩子
			rm();
			return;
		}
		var name, elm = vnode.elm,
			idx, i = 0,
			maxDur = 0,
			compStyle, style = s.remove,
			amount = 0,
			applied = [];
		//设置并记录remove动作后删除节点前的样式
		for (name in style) {
			applied.push(name);
			elm.style[name] = style[name];
		}
		compStyle = getComputedStyle(elm);
		//拿到所有需要过渡的属性
		var props = compStyle['transition-property'].split(', ');
		//对过渡属性计数，这里applied.length >=amount，因为有些属性是不需要过渡的
		for (; i < props.length; ++i) {
			if (applied.indexOf(props[i]) !== -1) amount++;
		}
		//当过渡效果的完成后，才remove节点，调用下一个remove过程
		addEventListener(elm, 'transitionend', function(ev) {
			if (ev.target === elm) --amount;
			if (amount === 0) rm();
		})
	}

	StyleModule.create = updateStyle;
	StyleModule.update = updateStyle;
	StyleModule.destroy = applyDestroyStyle;
	StyleModule.remove = applyRemoveStyle;

})(StyleModule)
/**
 * 
 * @authors ${author} (${email})
 * @date    2018-11-14
 * @version $Id$
 */

/*
	类模块提供了一种简单的方法来动态切换元素上的类。它期望类数据属性中的对象。
	对象应该将类名映射到布尔类，该布尔值指示类是否应该留在或保留在VNoad上。
	h('a', {class: {active: true, selected: false}}, 'Toggle');
*/

var ClassModule = {};

(function(ClassModule) {
	function updateClass(oldVnode, vnode) {
		var cur, name, elm = vnode.elm,
			oldClass = oldVnode.data.vClass,
			klass = vnode.data.vClass;

		//如果旧节点和新节点都没有class，直接返回
		if (!oldClass && !klass) return;
		oldClass = oldClass || {};
		klass = klass || {};
		//从旧节点中删除新节点不存在的类
		for (name in oldClass) {
			if (!klass[name]) {
				if (elm.classList) {
					elm.classList.remove(name);
				} else { //兼容IE8
					elm.className = elm.className.replace(name, "");
				}
			}
		}
		//如果新节点中对应旧节点的类设置为false，则删除该类，如果新设置为true，则添加该类
		for (name in klass) {
			cur = klass[name];
			if (cur !== oldClass[name]) {
				if (elm.classList) {
					elm.classList[cur ? 'add' : 'remove'](name);
				} else { //兼容IE8
					if (cur) { //add 
						elm.className += ' ' + name;
					} else { //remove
						elm.className = elm.className.replace(name, "");
					}
				}
			}
		}
	}


	ClassModule.create = updateClass;
	ClassModule.update = updateClass;

})(ClassModule)
var PropsModule = {};
(function(PropsModule) {
	function updateProps(oldVnode, vnode) {
		var key, cur, old, elm = vnode.elm,
			oldProps = oldVnode.data.props,
			props = vnode.data.props;
		//如果新旧节点都不存在属性，则直接返回
		if (!oldProps && !props) return;
		oldProps = oldProps || {};
		props = props || {};
		//删除旧节点中新节点没有的属性
		for (key in oldProps) {
			if (!props[key]) {
				delete elm[key];
			}
		}
		//更新属性
		for (key in props) {
			cur = props[key];
			old = oldProps[key];
			//如果新旧节点属性不同，且对比的属性不是value或者elm上对应属性和新属性也不同，那么就需要更新
			if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
				elm[key] = cur;
			}
		}
	}

	PropsModule.create = updateProps;
	PropsModule.update = updateProps;

})(PropsModule)
//snabbdom中对事件处理做了一层包装，真实DOM的事件触发的是对vnode的操作
//主要途径是
// createListner => 返回handler作事件监听生成器 =>handler上绑定vnode =>将handler作真实DOM的事件处理器
//真实DOM事件触发后 => handler获得真实DOM的事件对象 => 将真实DOM事件对象传入handleEvent => handleEvent找到
//对应的vnode事件处理器，然后调用这个处理器从而修改vnode


//对vnode进行事件处理

var EventlistenerModule = {};

(function(EventlistenerModule) {
	function invokeHandler(handler, vnode, event) {
		if (typeof handler === "function") {
			// call function handler
			//将事件处理器在vnode上调用
			handler.call(vnode, event, vnode);
		}
		//存在事件绑定数据或者存在多事件处理器
		else if (typeof handler === "object") {

			//说明只有一个事件处理器
			if (typeof handler[0] === "function") {
				//如果绑定数据只有一个，则直接将数据用call的方式调用，提高性能
				//形如on:{click:[handler,1]}
				if (handler.length === 2) {
					handler[0].call(vnode, handler[1], event, vnode);
				}
				//如果存在多个绑定数据，则要转化为数组，用apply的方式调用，而apply性能比call差
				//形如:on:{click:[handler,1,2,3]}
				else {
					var args = handler.slice(1);
					args.push(event);
					args.push(vnode);
					handler[0].apply(vnode, args);
				}
			} else {
				//如果存在多个相同事件的不同处理器，则递归调用
				//如on：{click:[[handeler1,1],[handler,2]]}
				for (var i = 0; i < handler.length; i++) {
					invokeHandler(handler[i], vnode, event);
				}
			}
		}
	}

	/**
	 *
	 * @param event 真实dom的事件对象
	 * @param vnode
	 */
	function handleEvent(event, vnode) {
		var name = event.type,
			on = vnode.data.on;

		// 如果找到对应的vnode事件处理器，则调用
		if (on && on[name]) {
			invokeHandler(on[name], vnode, event);
		}
	}
	//事件监听器生成器，用于处理真实DOM事件
	function createListener(vnode) { //兼容IE8，访问不到handler.vnode,得传进来
		return function handler(event) {
			if (handler.vnode) {
				handleEvent(event, handler.vnode);
			} else {
				handleEvent(event, vnode);
			}
		}
	}
	//更新事件监听
	function updateEventListeners(oldVnode, vnode) {
		var oldOn = oldVnode.data.on,
			oldListener = oldVnode.listener,
			oldElm = oldVnode.elm,
			on = vnode && vnode.data.on,
			elm = vnode && vnode.elm,
			name;

		//如果新旧事件监听器一样，则直接返回
		if (oldOn === on) {
			return;
		}

		if (oldOn && oldListener) {
			if (!on) {
				//如果新节点上没有事件监听，则将旧节点上的事件监听都删除
				for (name in oldOn) {
					// remove listener if element was changed or existing listeners removed
					removeEventListener(oldElm, name, oldListener)
				}
			} else {
				//删除旧节点中新节点不存在的事件监听
				for (name in oldOn) {
					// remove listener if existing listener removed
					if (!on[name]) {
						removeEventListener(oldElm, name, oldListener)
					}
				}
			}
		}

		//经过上面的筛选，剔除了旧节点上无用在的监听事件
		//增加新节点上的监听事件
		if (on) {
			//如果oldvnode上已经有listener，则vnode直接复用，否则则新建事件处理器
			var listener = vnode.listener = oldVnode.listener || createListener(vnode);
			// update vnode for listener
			//在事件处理器上绑定vnode
			listener.vnode = vnode;

			// if element changed or added we add all needed listeners unconditionally‘
			//如果oldvnode上没有事件处理器
			if (!oldOn) {
				for (name in on) {
					// add listener if element was changed or new listeners added
					//直接将vnode上的事件处理器添加到elm上
					addEventListener(elm, name, listener);
				}
			} else {
				for (name in on) {
					// add listener if new listener added
					//否则添加oldvnode上没有的事件处理器
					if (!oldOn[name]) {
						addEventListener(elm, name, listener)
					}
				}
			}
		}
	}

	EventlistenerModule.create = updateEventListeners;
	EventlistenerModule.update = updateEventListeners;
	EventlistenerModule.destroy = updateEventListeners;


})(EventlistenerModule)
var DatasetModule = {};
(function(DatasetModule) {
	function updateDataset(oldVnode, vnode) {
		var elm = vnode.elm,
			oldDataset = oldVnode.data.dataset,
			dataset = vnode.data.dataset,
			key

		//如果新旧节点都没数据集，则直接返回
		if (!oldDataset && !dataset) return;
		oldDataset = oldDataset || {};
		dataset = dataset || {};
		//删除旧节点中在新节点不存在的数据集
		for (key in oldDataset) {
			if (!dataset[key]) {
				_updateDataset(elm, 'remove', key)
			}
		}
		//更新数据集
		for (key in dataset) {
			if (oldDataset[key] !== dataset[key]) {
				_updateDataset(elm, 'set', key, dataset[key])
			}
		}
	}

	//兼容IE8
	function _updateDataset(elm, type, key, val) {
		if (elm.dataset) {
			if ('remove' == type) {
				delete elm.dataset[key];
			} else {
				elm.dataset[key] = val;
			}
		} else {
			var name;
			name = 'data-' + key;
			if ('remove' == type) {
				elm.removeAttribute(name);
			} else {
				elm.setAttribute(name, val);
			}
		}
	}

	DatasetModule.create = updateDataset;
	DatasetModule.update = updateDataset;

})(DatasetModule)
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
/**
 *
 * @param sel    选择器
 * @param data    绑定的数据
 * @param children    子节点数组
 * @param text    当前text节点内容
 * @param elm    对真实dom element的引用
 * @returns {{sel: *, data: *, children: *, text: *, elm: *, key: undefined}}
 */
//VNode函数，用于将输入转化成虚拟dom数据结构类型
var VNodeModule = {};

(function(VNodeModule) {
	VNodeModule.VNode = function(sel, data, children, text, elm) {
		var key = data === undefined ? undefined : data.key;
		return {
			sel: sel,
			data: data,
			children: children,
			text: text,
			elm: elm,
			key: key
		};
	}


})(VNodeModule)

/*
vnode主要有5大属性：

sel 对应的是选择器,如'div','div#a','div#a.b.c'的形式

data 对应的是vnode绑定的数据，可以有以下类型：attribute、props、eventlistner、
class、dataset、hook

children 子元素数组

text 文本，代表该节点中的文本内容

elm 里面存储着对应的真实dom element的引用

key vnode标识符，主要是用在需要循环渲染的dom元素在进行diff运算时的优化算法，例如ul>li，tobody>td等

*/
var HModule = {};
(function(HModule) {
	//var VNode = require('./vnode');
	var VNode = VNodeModule.VNode;

	//var is = require('./is');
	var is = isModule;


	/**
	 *
	 * @param sel 选择器
	 * @param b    数据
	 * @param childNode    子节点
	 * @returns {{sel, data, children, text, elm, key}}
	 */

	//调用vnode函数将数据封装成虚拟dom的数据结构并返回，在调用之前会对数据进行一个处理：是否含有数据，是否含有子节点，子节点类型的判断等
	HModule.h = function(sel, b, childNode) {
		var data = {},
			children, text, i;
		if (childNode !== undefined) { //如果childNode存在,则其为子节点
			//则h的第二项b就是data
			data = b;
			if (is.array(childNode)) { //如果子节点是数据，则存在子element节点
				children = childNode;
			} else if (is.primitive(childNode)) { //否则子节点为text节点
				text = childNode;
			}
		} else if (b !== undefined) { //如果只有b存在，childNode不存在，则b有可能是子节点也有可能是数据
			//数组代表子element节点
			if (is.array(b)) {
				children = b;
			} else if (is.primitive(b)) { //代表子文本节点
				text = b;
			} else { //代表数据
				data = b;
			}
		}
		if (is.array(children)) {
			for (i = 0; i < children.length; ++i) {
				//如果子节点数组中，存在节点是原始类型，说明该节点是text节点，因此我们将它渲染为一个只包含text的VNode
				if (is.primitive(children[i])) children[i] = VNode(undefined, undefined, undefined, children[i]);
			}
		}
		//返回VNode
		return VNode(sel, data, children, text, undefined);

	}
})(HModule)
//封装对于真实dom的操作
function createElement(tagName) {
	return document.createElement(tagName);
}

function createElementNS(namespaceURI, qualifiedName) {
	return document.createElementNS(namespaceURI, qualifiedName);
}

function createTextNode(text) {
	return document.createTextNode(text);
}


function insertBefore(parentNode, newNode, referenceNode) {
	parentNode.insertBefore(newNode, referenceNode);
}


function removeChild(node, child) {
	node.removeChild(child);
}

function appendChild(node, child) {
	node.appendChild(child);
}

function parentNode(node) {
	return node.parentElement;
}

function nextSibling(node) {
	return node.nextSibling;
}

function tagName(node) {
	return node.tagName;
}

function setTextContent(node, text) {
	node.textContent = text;
}

var HtmldomapiModule = {
	createElement: createElement,
	createElementNS: createElementNS,
	createTextNode: createTextNode,
	appendChild: appendChild,
	removeChild: removeChild,
	insertBefore: insertBefore,
	parentNode: parentNode,
	nextSibling: nextSibling,
	tagName: tagName,
	setTextContent: setTextContent
}
var SnabbdomModule = {};

(function(SnabbdomModule) {
	var VNode = VNodeModule.VNode;
	var is = isModule;
	var domApi = HtmldomapiModule;


	function isUndef(s) {
		return s === undefined;
	}

	function isDef(s) {
		return s !== undefined;
	}

	var emptyNode = VNode('', {}, [], undefined, undefined);

	//这个函数主要用于比较oldvnode与vnode同层次节点的比较，如果同层次节点的key和sel都相同，我们就可以保留这个节点， 否则直接替换节点
	function sameVnode(vnode1, vnode2) {
		return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
	}

	//将oldvnode数组中位置对oldvnode.key的映射转换为oldvnode.key对位置的映射
	//例如:
	/*
	[{key:'a'},{key:'b'},{key:'c'}] ==> {'a':0, 'b':1, 'c':2}
	 */

	function createKeyToOldIdx(children, beginIdx, endIdx) {
		var i, map = {},
			key;
		for (i = beginIdx; i <= endIdx; ++i) {
			key = children[i].key;
			if (isDef(key)) map[key] = i;
		}
		return map;
	}

	var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post']; //全局钩子：modules自带的钩子函数

	function init(modules, api) {
		var i, j, cbs = {};

		//获取对于真实dom操作的api
		if (isUndef(api)) api = domApi;

		//注册钩子的回调，在发生状态变更时，触发对应属性变更
		/*
		例如:cbs={
			create:[ClassModule.create,EventlistenerModule.create...],
			update:[ClassModule.update,EventlistenerModule.update...]
			...
		}
		*/
		for (i = 0; i < hooks.length; ++i) {
			cbs[hooks[i]] = [];
			for (j = 0; j < modules.length; ++j) {
				if (modules[j][hooks[i]] !== undefined) cbs[hooks[i]].push(modules[j][hooks[i]]);
			}
		}

		/*
		这个函数主要的功能是将一个真实的无子节点的DOM节点转化成vnode形式，
		如<div id='a' class='b c'></div>将转换为{sel:'div#a.b.c',data:{},children:[],text:undefined,elm:<div id='a' class='b c'>}
		*/
		function emptyNodeAt(elm) {
			var id = elm.id ? '#' + elm.id : '';
			var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
			return VNode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
		}


		/*
		remove一个vnode时，会触发remove钩子作拦截器，只有在所有remove钩子
		回调函数都触发完才会将节点从父节点删除，而这个函数提供的就是对remove钩子回调操作的计数功能
		*/
		function createRmCb(childElm, listeners) {
			return function() {
				if (--listeners === 0) {
					var parent = api.parentNode(childElm);
					api.removeChild(parent, childElm);
				}
			};
		}


		//将vnode创建为真实dom
		function createElm(vnode, insertedVnodeQueue) {
			var i, data = vnode.data;
			if (data !== undefined) {
				if (isDef(i = data.hook) && isDef(i = i.init)) {
					i(vnode);
					data = vnode.data;
				}
			}
			var elm, children = vnode.children,
				sel = vnode.sel;
			if (isDef(sel)) {
				//解析sel参数，例如div#divId.divClass  ==>id="divId"  class="divClass"
				var hashIdx = sel.indexOf('#');
				//先id后class
				var dotIdx = sel.indexOf('.', hashIdx);
				var hash = hashIdx > 0 ? hashIdx : sel.length;
				var dot = dotIdx > 0 ? dotIdx : sel.length;
				var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
				//创建一个DOM节点引用，并对其属性实例化
				elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag) : api.createElement(tag);
				//获取id名 #a --> a
				if (hash < dot) elm.id = sel.slice(hash + 1, dot);
				//获取类名，并格式化  .a.b --> a b
				if (dotIdx > 0) elm.className = sel.slice(dot + 1).replace(/\./g, ' ');
				//如果存在子元素Vnode节点，则递归将子元素节点插入到当前Vnode节点中，并将已插入的子元素节点在insertedVnodeQueue中作记录
				if (is.array(children)) {
					for (i = 0; i < children.length; ++i) {
						api.appendChild(elm, createElm(children[i], insertedVnodeQueue));
					}
				} else if (is.primitive(vnode.text)) { //如果存在子文本节点，则直接将其插入到当前Vnode节点
					api.appendChild(elm, api.createTextNode(vnode.text));
				}
				//当创建完毕后，触发全局create钩子回调
				for (i = 0; i < cbs.create.length; ++i) {
					cbs.create[i](emptyNode, vnode);
				}
				i = vnode.data.hook; // Reuse variable
				if (isDef(i)) { //触发自身的create钩子回调
					if (i.create) i.create(emptyNode, vnode);
					//如果有insert钩子，则推进insertedVnodeQueue中作记录，从而实现批量插入触发insert回调
					if (i.insert) insertedVnodeQueue.push(vnode);
				}
			}
			//如果没声明选择器，则说明这个是一个text节点
			else {
				elm = vnode.elm = api.createTextNode(vnode.text);
			}
			return vnode.elm;
		}

		//将vnode转换后的dom节点插入到dom树的指定位置中去
		function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
			for (; startIdx <= endIdx; ++startIdx) {
				api.insertBefore(parentElm, createElm(vnodes[startIdx], insertedVnodeQueue), before);
			}
		}

		/*
		这个函数用于手动触发destory钩子回调，主要步骤如下：
		先调用vnode上的destory
		再调用全局下的destory
		递归调用子vnode的destory
		*/
		function invokeDestroyHook(vnode) {
			var i, j, data = vnode.data;
			if (isDef(data)) {
				if (isDef(i = data.hook) && isDef(i = i.destroy)) i(vnode); //调用自身的destroy钩子
				for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode); //调用全局destroy钩子
				if (isDef(i = vnode.children)) {
					for (j = 0; j < vnode.children.length; ++j) {
						invokeDestroyHook(vnode.children[j]);
					}
				}
			}
		}

		/*
			这个函数主要功能是批量删除DOM节点，需要配合invokeDestoryHook和createRmCb
			主要步骤如下：
			调用invokeDestoryHook以触发destory回调
			调用createRmCb来开始对remove回调进行计数
			删除DOM节点
		 *
		 *
		 * @param parentElm 父节点
		 * @param vnodes  删除节点数组
		 * @param startIdx  删除起始坐标
		 * @param endIdx  删除结束坐标
		 */
		function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
			for (; startIdx <= endIdx; ++startIdx) {
				var i, listeners, rm, ch = vnodes[startIdx]; //ch代表子节点
				if (isDef(ch)) {
					if (isDef(ch.sel)) {
						//调用destroy钩子
						invokeDestroyHook(ch);
						//对全局remove钩子进行计数
						listeners = cbs.remove.length + 1;
						rm = createRmCb(ch.elm, listeners);
						//调用全局remove回调函数，并每次减少一个remove钩子计数
						for (i = 0; i < cbs.remove.length; ++i) {
							cbs.remove[i](ch, rm);
						}
						//调用内部vnode.data.hook中的remove钩子（只有一个）
						if (isDef(i = ch.data) && isDef(i = i.hook) && isDef(i = i.remove)) {
							i(ch, rm);
						} else {
							//如果没有内部remove钩子，需要调用rm，确保能够remove节点
							rm();
						}
					} else { // Text node
						api.removeChild(parentElm, ch.elm);
					}
				}
			}
		}

		//http://qiutianaimeili.com/html/page/2018/05/4si69yn4stl.html
		//比较new vnode和old vnode的子节点
		function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
			/*
		(oldStartVnode)              (oldEndVnode)
	     oStartIdx->                  <-oEndIdx
		old [x      x      x      x      x]     
		
		(newStartVnode)              (newEndVnode)
         nStartIdx->                  <-nEndIdx
		new [x      x      x      x      x]     

		特殊比较规则：
		1.sameVnode(oldStartVnode, newStartVnode)  
		 sameVnode是比较vnode的sel和key值，如果不设置key值，则key值都为undefined，为相等，必须要两者都相同才返回true
		****************************************
		(oldStartVnode)              
	     oStartIdx->                  
		old [x      x      x      x      x]     
		    
		(newStartVnode)              
         nStartIdx->                 
		new [x      x      x      x      x]     

		若相似则不用将整个old vnode删除，比较new vnode和old vnode差异，进行patch；oStartIdx++ nStartIdx++

		****************************************
		2.sameVnode(oldEndVnode, newEndVnode)

		                             (oldEndVnode)
	                                  <-oEndIdx
		old [x      x      x      x      x]     
										 
						             (newEndVnode)
				                      <-nEndIdx
		new [x      x      x      x      x]     

		若相似则不用将整个old vnode删除，比较new vnode和old vnode差异，进行patch；oEndIdx++ nEndIdx++

		****************************************
		3.sameVnode(oldStartVnode, newEndVnode)

		(oldStartVnode)              
	     oStartIdx->                  
		old [x      x      x      x      x]     
		        
		              				(newEndVnode)
                    			     <-nEndIdx
		new [x      x      x      x      x]     
		
		若相似则不用将整个old vnode删除，比较new vnode和old vnode差异，进行patch；oStartIdx++ nEndIdx++

		****************************************
		4.sameVnode(oldEndVnode, newStartVnode)

		              				(oldEndVnode)
	                   			     <-oEndIdx
		old [x      x      x      x      x]     
		
		(newStartVnode)              
         nStartIdx->                  
		new [x      x      x      x      x]     

		若相似则不用将整个old vnode删除，比较new vnode和old vnode差异，进行patch；oEndIdx++ nStartIdx++


		*/
			var oldStartIdx = 0,
				newStartIdx = 0;
			var oldEndIdx = oldCh.length - 1;
			var oldStartVnode = oldCh[0];
			var oldEndVnode = oldCh[oldEndIdx];
			var newEndIdx = newCh.length - 1;
			var newStartVnode = newCh[0];
			var newEndVnode = newCh[newEndIdx];
			var oldKeyToIdx, idxInOld, elmToMove, before;

			while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
				if (isUndef(oldStartVnode)) {
					oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
				} else if (isUndef(oldEndVnode)) {
					oldEndVnode = oldCh[--oldEndIdx];
				} else if (sameVnode(oldStartVnode, newStartVnode)) {
					patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
					oldStartVnode = oldCh[++oldStartIdx];
					newStartVnode = newCh[++newStartIdx];
				} else if (sameVnode(oldEndVnode, newEndVnode)) {
					patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
					oldEndVnode = oldCh[--oldEndIdx];
					newEndVnode = newCh[--newEndIdx];
				} else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
					patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
					api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
					oldStartVnode = oldCh[++oldStartIdx];
					newEndVnode = newCh[--newEndIdx];
				} else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
					patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
					api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
					oldEndVnode = oldCh[--oldEndIdx];
					newStartVnode = newCh[++newStartIdx];
				} else {
					if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
					idxInOld = oldKeyToIdx[newStartVnode.key]; //遍历oldVnode,查看newVnode是否存在于oldVnode
					if (isUndef(idxInOld)) { // 如果不存在，则为新节点，进行添加
						api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
						newStartVnode = newCh[++newStartIdx];
					} else {
						//若存在，需要查看sel属性是否一致，如果不一致则新增；若存在，则在旧Vnode上进行patch
						elmToMove = oldCh[idxInOld];
						if (elmToMove.sel !== newStartVnode.sel) {
							api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
						} else {
							patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
							oldCh[idxInOld] = undefined;
							api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
						}
						newStartVnode = newCh[++newStartIdx];
					}
				}
			}
			//遍历结束后，查看新旧Vnode数组的遍历情况，是否遍历完
			if (oldStartIdx > oldEndIdx) { //若旧Vnode数组遍历完,则将剩余的新Vnode数组中的Vnode进行添加
				before = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
				addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
			} else if (newStartIdx > newEndIdx) { //若新Vnode数组遍历完，则删除剩余的旧Vnode数组中的Vnode
				removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
			}
		}

		function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
			var i, hook;
			//在patch之前，先调用vnode.data的prePatch钩子
			if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
				i(oldVnode, vnode);
			}
			var elm = vnode.elm = oldVnode.elm,
				oldCh = oldVnode.children,
				ch = vnode.children;
			//如v果oldnode和vnode的引用相同，说明没发生任何变化直接返回，避免性能浪费
			if (oldVnode === vnode) return;
			//如果oldvnode和vnode不同，说明vnode有更新
			//如果vnode和oldvnode不相似则直接用vnode引用的DOM节点去替代oldvnode引用的旧节点
			if (!sameVnode(oldVnode, vnode)) {
				var parentElm = api.parentNode(oldVnode.elm);
				elm = createElm(vnode, insertedVnodeQueue);
				api.insertBefore(parentElm, elm, oldVnode.elm);
				removeVnodes(parentElm, [oldVnode], 0, 0);
				return;
			}
			//如果vnode和oldvnode相似，那么我们要对oldvnode本身进行更新
			if (isDef(vnode.data)) {
				//首先调用全局的update钩子，对vnode.elm本身属性进行更新
				for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
				//然后调用vnode.data里面的update钩子,再次对vnode.elm更新
				i = vnode.data.hook;
				if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
			}
			/*
			 分情况讨论节点的更新： new代表新Vnode old代表旧Vnode
			 ps:如果自身存在文本节点，则不存在子节点 即:有text则不会存在ch

			 1 new不为文本节点
			 	1.1 new不为文本节点,new还存在子节点	
			 	  1.1.1 new不为文本节点,new还存在子节点,old有子节点
			 	  1.1.2 new不为文本节点,new还存在子节点,old没有子节点
				 	 1.1.2.1 new不为文本节点,new还存在子节点,old没有子节点,old为文本节点

				1.2 new不为文本节点,new不存在子节点
				  1.2.1 new不为文本节点,new不存在子节点,old存在子节点
				  1.2.2 new不为文本节点,new不存在子节点,old为文本节点

			 2.new为文本节点
			 	2.1 new为文本节点,并且old与new的文本节点不相等
			 	ps：这里只需要讨论这一种情况，因为如果old存在子节点，那么文本节点text为undefined，则与new的text不相等
			 	直接node.textContent即可清楚old存在的子节点。若old存在子节点，且相等则无需修改
			*/
			//1
			if (isUndef(vnode.text)) {
				//1.1.1
				if (isDef(oldCh) && isDef(ch)) {
					//当Vnode和oldvnode的子节点不同时，调用updatechilren函数，diff子节点
					if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue);
				}
				//1.1.2
				else if (isDef(ch)) {
					//oldvnode是text节点，则将elm的text清除
					//1.1.2.1
					if (isDef(oldVnode.text)) api.setTextContent(elm, '');
					//并添加vnode的children
					addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
				}
				//如果oldvnode有children，而vnode没children，则移除elm的children
				//1.2.1
				else if (isDef(oldCh)) {
					removeVnodes(elm, oldCh, 0, oldCh.length - 1);
				}
				//1.2.2
				//如果vnode和oldvnode都没chidlren，且vnode没text，则删除oldvnode的text
				else if (isDef(oldVnode.text)) {
					api.setTextContent(elm, '');
				}
			}
			//如果oldvnode的text和vnode的text不同，则更新为vnode的text，
			//2.1
			else if (oldVnode.text !== vnode.text) {
				api.setTextContent(elm, vnode.text);
			}
			//patch完，触发postpatch钩子
			if (isDef(hook) && isDef(i = hook.postpatch)) {
				i(oldVnode, vnode);
			}
		}


		return function(oldVnode, vnode) {
			var i, elm, parent;
			//记录被插入的vnode队列，用于批量触发insert
			var insertedVnodeQueue = [];
			//调用全局pre钩子
			for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();
			//如果oldvnode是dom节点，转化为oldvnode，在初始化渲染的时候的处理
			if (isUndef(oldVnode.sel)) {
				oldVnode = emptyNodeAt(oldVnode);
			}
			//如果oldvnode与vnode相似，进行更新；比较其key值与sel值
			if (sameVnode(oldVnode, vnode)) {
				patchVnode(oldVnode, vnode, insertedVnodeQueue);
			} else {
				//否则，将vnode插入，并将oldvnode从其父节点上直接删除
				elm = oldVnode.elm;
				parent = api.parentNode(elm);
				createElm(vnode, insertedVnodeQueue);
				if (parent !== null) {
					api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
					removeVnodes(parent, [oldVnode], 0, 0);
				}
			}
			//插入完后，调用被插入的vnode的insert钩子
			for (i = 0; i < insertedVnodeQueue.length; ++i) {
				insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
			}
			//然后调用全局下的post钩子
			for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
			//返回vnode用作下次patch的oldvnode
			return vnode;
		};
	}

	SnabbdomModule.init = init;


})(SnabbdomModule)