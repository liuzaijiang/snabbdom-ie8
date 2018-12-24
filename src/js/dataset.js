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