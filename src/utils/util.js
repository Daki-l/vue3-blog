// 清除对象中没值的数据 unfined、null、[]、{}、''
export function clearEmptyPro(data) {
	let curVal;
	let toString = Object.prototype.toString;
	let dataType = toString.call(data);
	if (dataType || dataType === "[object Number]" || dataType === "[object Boolean]") {
		switch (dataType) {
			case "[object Object]":
				if (Object.keys(data).length > 0) {
					let momObj = {};
					for (let key in data) {
						let value = clearEmptyPro(data[key]);
						let valueType = toString.call(value);
						valueType === "[object Boolean]" || valueType === "[object Number]" || value ? momObj[key] = value : "";
					}
					curVal = momObj;
				} else {
					return;
				}
				break;
			case "[object Array]":
				if (data.length > 0) {
					let momValue = [];
					data.forEach((e) => {
						let value = clearEmptyPro(e);
						let valueType = toString.call(value);
						valueType === "[object Boolean]" || valueType === "[object Number]" || value ? momValue.push(value) : "";
					});
					momValue.length > 0 ? curVal = momValue : "";
				} else {
					return;
				}
				break;
			case "[object Boolean]":
			case "[object Number]":
			default:
				curVal = data;
				break;
		}
	} else {
		return;
	}
	return curVal;
}

export function isEmptyStrict(obj) {
	return obj === undefined || obj === null || obj === "";
}