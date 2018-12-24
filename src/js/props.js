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