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