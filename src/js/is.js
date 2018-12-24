var isModule = {
	array: function(s) {
		return (Array.isArray && Array.isArray(s)) || Object.prototype.toString.call(s) == '[object Array]';
	},
	primitive: function(s) {
		return typeof s === 'string' || typeof s === 'number';
	}
};