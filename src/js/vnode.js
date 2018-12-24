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