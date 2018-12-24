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