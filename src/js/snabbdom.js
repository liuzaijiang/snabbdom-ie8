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