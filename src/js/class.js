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