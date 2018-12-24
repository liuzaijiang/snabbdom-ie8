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