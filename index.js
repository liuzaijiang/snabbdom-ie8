/**
 * 
 * @authors ${author} (${email})
 * @date    2018-11-14
 * @version $Id$
 */

var snabbdom = SnabbdomModule;

var patch = snabbdom.init([
	DatasetModule,
	ClassModule,
	AttributesModule,
	PropsModule,
	StyleModule,
	EventlistenerModule
])

var h = HModule.h;

var app = document.getElementById('app');

var string = []

var vnode;

var data = {
	info: [{
		name: "liuzj",
		age: 25
	}, {
		name: "lzj",
		age: 30
	}, {
		name: "nzj",
		age: 29
	}]
}


function render(data) {
	return h('table.table', {
		vClass: {
			'active': true

		},
		attrs: {
			cellpadding: 0,
			cellspacing: 0
		}
	}, [
		h('thead.thead', {}, [
			h('tr', {}, [
				h('th', {
					style: {
						width: "200px"
					},
					dataset: {
						name: "liuzj"
					}
				}, '姓名'),
				h('th', {
					style: {
						width: "200px"
					}
				}, ['年龄', h('img#Sort_Down.sort', {
					attrs: {
						src: './src/img/Sort_Down.png'
					},
					style: {
						marginLeft: '5px',
						marginRight: '3px',
					},
					on: {
						click: [sort, 'down']
					}
				}), h('img#Sort_Up.sort', {
					attrs: {
						src: './src/img/Sort_Up.png'
					},
					on: {
						click: [sort, 'up']
					}
				})]),
				h('th', {
					style: {
						width: "450px"
					}
				}, '操作')
			])
		]),
		h('tbody.tbody', {}, tbodyRender(data))
	]);
}

function sort(type) {
	if (type == 'up') {
		data.info.sort(function(a, b) {
			return parseInt(a.age) - parseInt(b.age);
		})
	} else {
		data.info.sort(function(a, b) {
			return parseInt(b.age) - parseInt(a.age);
		})
	}

	vnode = patch(vnode, render(data))
}

function tbodyRender(data) {
	var trArray = [];
	var len = data.info.length;
	data.info.forEach(function(item, index) {
		var tdArray = []
		var td = h('td', {
			style: {
				width: "200px"
			}
		}, item.name);
		tdArray.push(td);
		var td = h('td', {
			style: {
				width: "200px"
			}
		}, item.age);
		tdArray.push(td);
		var td = h('td', {
			style: {
				width: "450px"
			}
		}, [h('button.btn', {
			on: {
				'click': [function(name) {
					data.info = data.info.filter(function(item) {
						return item.name != name
					})
					vnode = patch(vnode, render(data));
				}, item.name]
			}
		}, '删除')]);
		tdArray.push(td);
		trArray[index] = h('tr', {
			key: item
		}, tdArray)
	})
	return trArray;
}

var vnode = patch(app, render(data));