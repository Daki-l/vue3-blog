/**
 * Created by ZhangSan on 2020-06-05 9:56.
 */

import {isEmptyStrict} from "@/utils/util";
import _ from "lodash";

/**
 * 生成随机数
 * @param min
 * @param max
 * @returns {*}
 */
Math.randomFromRange=function(min, max) {
	let r = this.random() * (max - min);
	let re = this.round(r + min);
	re = this.max(this.min(re, max), min);
	return re;
};
/**
 * 解决两个数相加精度丢失问题
 * @param a
 * @param b
 * @returns {Number}
 */
Math.add = (a, b)=>{
	let c, d, e;
	if(undefined==a||null==a||""==a||isNaN(a)){a=0;}
	if(undefined==b||null==b||""==b||isNaN(b)){b=0;}
	try {
		c = a.toString().split(".")[1].length;
	} catch (f) {
		c = 0;
	}
	try {
		d = b.toString().split(".")[1].length;
	} catch (f) {
		d = 0;
	}
	e = Math.pow(10, Math.max(c, d));
	return  (Math.multiply(a, e) + Math.multiply(b, e)) / e;
}
/**
 * 解决两个数相减精度丢失问题
 * @param a
 * @param b
 * @returns {Number}
 */
Math.subtract = (a, b)=>{
	let c, d, e;
	if(undefined==a||null==a||""==a||isNaN(a)){a=0;}
	if(undefined==b||null==b||""==b||isNaN(b)){b=0;}
	try {
		c = a.toString().split(".")[1].length;
	} catch (f) {
		c = 0;
	}
	try {
		d = b.toString().split(".")[1].length;
	} catch (f) {
		d = 0;
	}
	e = Math.pow(10, Math.max(c, d));
	return (Math.multiply(a, e) - Math.multiply(b, e)) / e;
}
/**
 * 解决两个数相乘精度丢失问题
 * @param a
 * @param b
 * @returns {Number}
 */
Math.multiply = (a, b)=>{
	let c = 0,
		d = a.toString(),
		e = b.toString();
	try {
		c += d.split(".")[1].length;
	} catch (f) {}
	try {
		c += e.split(".")[1].length;
	} catch (f) {}
	return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c);
}
/**
 * 解决两个数相除精度丢失问题 a/b
 * @param a
 * @param b
 * @returns
 */
Math.divide=(a, b)=>{
	let c, d, e = 0,
		f = 0;
	try {
		e = a.toString().split(".")[1].length;
	} catch (g) {}
	try {
		f = b.toString().split(".")[1].length;
	} catch (g) {}
	return c = Number(a.toString().replace(".", "")), d = Number(b.toString().replace(".", "")), Math.multiply(c / d, Math.pow(10, f - e));
}

/**
 * 字符串转hex
 * @param str
 * @returns {string}
 */
String.prototype.string2hex = function(str) {
	str = str|| this.toString();
	let val = "";
	for (let i = 0; i < str.length; i++) {
		if (val === ""){
			val = str.charCodeAt(i).toString(16);
		}else{
			val += str.charCodeAt(i).toString(16);
		}
	}
	// val += "0a";
	return val;
};

/**
 * 对象数组根据属性排序
 * @param option
 */
Object.defineProperty(Array.prototype, "sortArray", {
	value: function(option={attr:"", attrType:"string", type:"asc"}) {
		let {attr="", attrType="string"} = option;
		let a = this;
		let temp = a[0];
		for (let i = 0; i < a.length - 1; i++) {
			for (let j = 0; j < a.length - 1 - i; j++) {
				let tmpA = a[j], tmpB = a[j + 1];
				if (attr && "" !== attr) {
					tmpA = a[j][attr];
					tmpB = a[j + 1][attr];
				}
				attrType.toUpperCase()==="NUMBER" && (tmpA = Number(tmpA), tmpB = Number(tmpB));
				if (tmpA > tmpB) {
					temp = a[j];
					a[j] = a[j + 1];
					a[j + 1] = temp;
				}
			}
		}
		if(option.type==="desc"){
			a.reverse();
		}
	}
});
/**
 * type 01升序 10降序
 * [{code:"属性",type:"01"}]
 */
Object.defineProperty(Array.prototype, "orderBy", {
	value: function(byList) {
		let that = this;
		const customSort = (a, b, keyList=[])=>{
			for(let keyItem of keyList){
				// 首先按照年龄升序排列
				if (a[keyItem.attr] !== b[keyItem.attr]) {
					return keyItem.type=="01"?(a[keyItem.attr] > b[keyItem.attr]?1:-1):(b[keyItem.attr] > a[keyItem.attr]?1:-1);
				}
			}
			return 0;
		}
		return that.sort((a,b)=>{
			return customSort(a, b, byList)
		})
	}
});

window.orderBy =(list,byList)=>{
	function sortByArr(arr) {// arr 排序的字段，rev：false 倒序，true 正序
		return function (a, b) {
			for (let i = 0; i < arr.length; i++) {
				let attr = arr[i];
				let rev = attr.type=="01"?1:-1;
				if (a[attr.code] != b[attr.code]) {
					if (a[attr.code] > b[attr.code]) {
						return rev * 1;
					} else {
						return rev * -1;
					}
				}
			}
		};
	}
	list.sort(sortByArr(byList))

}
/**
 * 返回元素在数组中的所有索引
 */
Object.defineProperty(Array.prototype, "allIndexOf", {
	value: function(targetItem) {
		let a = this;
		let results=[], len=a.length, pos=0;
		while(pos<len){
			pos=a.indexOf(targetItem, pos);
			if(pos===-1){//未找到就退出循环完成搜索
				break;
			}
			results.push(pos);//找到就存储索引
			pos+=1;//并从下个位置开始搜索
		}
		return results;
	}
});

Object.defineProperty(Array.prototype, "hasByAttr", {
	value: function(option={attr:"", val:"",resType:'boolean'}) {
		let {attr="", val="",resType='boolean'} = option;
		let a = this;
		let flag = false;
		let flagIndex = -1;
		for (let i = 0; i < a.length; i++) {
			if(a[i][attr]===val){
				flag = true;
				flagIndex = i;
				break;
			}
		}
		if(resType =='boolean'){
			return flag;
		}else{
			return flagIndex;
		}
	}
});
/**
 * 对象转 QueryString
 * @returns {string}
 */
Object.defineProperty(Object.prototype, "toQueryString", {
	value:function(){
		let tmp = Object.keys(this).map((key) => {
			const value = this[key];
			if (value === undefined) {
				return "";
			}
			return key+ "=" + value;
		}).filter((x) => {
			return x.length > 0;
		})
			.join("&");
		return tmp;
	}
});
/**
 * 日期格式化
 * @param fmt
 * @returns {string}
 */
Date.prototype.format = function(fmt="yyyy-MM-dd") {
	let o = {
		"M+": this.getMonth() + 1,
		"d+": this.getDate(),
		"H+": this.getHours(),
		"m+": this.getMinutes(),
		"s+": this.getSeconds(),
		"q+": Math.floor((this.getMonth() + 3) / 3),
		"S": this.getMilliseconds()
	};
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	for (let k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}

	let week = {
		"0" : "日",
		"1" : "一",
		"2" : "二",
		"3" : "三",
		"4" : "四",
		"5" : "五",
		"6" : "六"
	};
	if(/(E+)/.test(fmt)){
		fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "星期" : "周") : "")+week[this.getDay()+""]);
	}
	return fmt;
};

Date.DATE="yyyy-MM-dd";
Date.DATETIME="yyyy-MM-dd HH:mm";
Date.DATETIME_SECOND="yyyy-MM-dd HH:mm:ss";
Date.TIME_MINUTES="HH:mm";
Date.TIME_SECOND="HH:mm:ss";

/**
 * 日期添加 N 天
 * @param amount
 * @returns {Date}
 */
Date.prototype.addDays = function(amount){this.setDate(this.getDate() + amount);return this;};

/**
 * 日期添加 N 月
 * @param amount
 * @returns {Date}
 */
Date.prototype.addMonths = function(amount){this.setMonth(this.getMonth() + amount);return this;};

/**
 * 日期添加 N 年
 * @param amount
 * @returns {Date}
 */
Date.prototype.addYears = function(amount){this.setFullYear(this.getFullYear() + amount);return this;};

/**
 * 日期添加 N 小时
 * @param amount
 * @returns {Date}
 */
Date.prototype.addHours = function(amount){this.setHours(this.getHours() + amount);return this;};

/**
 * 日期添加 N 分钟
 * @param amount
 * @returns {Date}
 */
Date.prototype.addMinutes = function(amount){this.setMinutes(this.getMinutes() + amount);return this;};

/**
 * 日期添加 N 秒
 * @param amount
 * @returns {Date}
 */
Date.prototype.addSeconds = function(amount){this.setSeconds(this.getSeconds() + amount);return this;};
/**
 * 月第一天
 * @returns {Date}
 */
Date.prototype.firstDate = function() {
	let n = new Date(this.getTime());
	n.setDate(1);
	return n;
};
/**
 * 月最后一天
 * @returns {Date}
 */
Date.prototype.lastDate = function() {
	let n = new Date(this.getTime());
	n.setDate(1);//先初始化到1号
	n.setMonth(this.getMonth()+1);
	n.setDate(0);
	return n;
};
/**
 * 日期差异毫秒
 * @param args
 * @returns {number}
 */
Date.prototype.diff = function(...args) {
	let[date, date2] = args;
	if(date2===null||date2===undefined){
		return this.getTime() - new Date(date).getTime();
	}else{
		return new Date(date) - new Date(date2).getTime();
	}
};
/**
 * 日期差异天数
 * @param date
 * @param date2
 * @returns {number}
 */
Date.diffDays = function(date, date2) {
	let dateLong = null;
	let date2Long = null;
	if(typeof date==="number"){
		dateLong = date;
	}
	if(typeof date2==="number"){
		date2Long = date2;
	}
	return (dateLong - date2Long)/1000/60/60/24;
};

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
/**
 * A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
 * by minimizing calls to random()
 * @returns {string}
 */
Math.uuidFast = function(splitChat="-") {
	let uuid = new Array(36), rnd=0, r;
	for (let i = 0; i < 36; i++) {
		if (i===8 || i===13 || i===18 || i===23) {
			uuid[i] = splitChat;
		} else if (i===14) {
			uuid[i] = "4";
		} else {
			if(rnd <= 0x02){
				// eslint-disable-next-line
				rnd = 0x2000000 + (Math.random()*0x1000000)|0;
			}
			// eslint-disable-next-line
			r = rnd & 0xf;
			// eslint-disable-next-line
			rnd = rnd >> 4;
			// eslint-disable-next-line
			uuid[i] = CHARS[(i === 19) ? (r & 0x3) | 0x8 : r];
		}
	}
	return uuid.join("");
};

// A more compact, but less performant, RFC4122v4 solution:
Math.uuidCompact = function() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
		// eslint-disable-next-line
		let r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};

/**
 * 获取范围随机数
 * @param min
 * @param max
 * @returns {number}
 */
Math.getRandomFromRange=function(min, max) {
	let r = this.random() * (max - min);
	let re = this.round(r + min);
	re = this.max(this.min(re, max), min);
	return re;
};

/**
 * 向下取整 例如：3.33333333 取3位，返回 3.333
 * num 原始值
 * precision 保留精度
 */
Math.floorPow = function(num, precision){
	// 根据保留精度放大 小数位
	let magnify =  Math.pow(10, precision);
	// 返回小于等于给定数字的 最大整数
	return Math.floor(num * magnify)/magnify;
}

/**
 * 向上取整 例如：3.33333333 取3位，返回 3.334
 * num 原始值
 * precision 保留精度
 */
Math.ceilPow = function(num, precision){
	// 根据保留精度放大 小数位
	let magnify =  Math.pow(10, precision);
	// 返回小于等于给定数字的 最大整数
	return Math.ceil(num * magnify)/magnify;
}

/**
 * 深拷贝
 * @param target
 * @returns {{}}
 */
Object.deepClone = function(target) {
	// 定义一个变量
	let result;
	// 如果当前需要深拷贝的是一个对象的话
	if (typeof target === "object") {
		// 如果是一个数组的话
		if (Array.isArray(target)) {
			// 将result赋值为一个数组，并且执行遍历
			result = [];
			for (let i in target) {
				// 递归克隆数组中的每一项
				result.push(Object.deepClone(target[i]));
			}
			// 判断如果当前的值是null的话；直接赋值为null
		} else if(target===null) {
			result = null;
			// 判断如果当前的值是一个RegExp对象的话，直接赋值
		} else if(target.constructor===RegExp){
			result = target;
		}else {
			// 否则是普通对象，直接for in循环，递归赋值对象的所有值
			result = {};
			for (let i in target) {
				result[i] = Object.deepClone(target[i]);
			}
		}
		// 如果不是对象的话，就是基本数据类型，那么直接赋值
	} else {
		result = target;
	}
	// 返回最终结果
	return result;
};

/**
 * 去除两边空格
 * @returns {string}
 */
String.prototype.trim = function(){return this.replace(/(^\s*)|(\s*$)/g, "");};

/**
 * 去除左边空格
 * @returns {string}
 */
String.prototype.leftTrim = function(){return this.replace(/(^\s*)/g, "");};

/**
 * 去除右边空格
 * @returns {string}
 */
String.prototype.rightTrim = function(){return this.replace(/(\s*$)/g, "");};
/**
 * 去除多余的0比如 0200.00 返回 200
 * @returns {string}
 */
String.prototype.trimZero = function(){return this.replace(/^([\d,]+)$|^([\d,]+)\.0*$|^([\d,]+\.[0-9]*?)0*$/,"$1$2$3")};

/**
 * 重写 toFixed 方法
 * @param precision 保留位数
 * @returns {string}
 */
Number.prototype.toFixed = function(precision=0) {
	if(isNaN(precision)){//如果不是数字,默认 2 位
		precision=2
	}
	if(!/^\d+$/.test(precision)){//不是整数就变成整数
		precision = parseInt(precision)
	}
	// 使用 Intl.NumberFormat 对象进行格式化
	let formatter = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: precision,
		maximumFractionDigits: precision
	});
	// 将数字格式化为字符串
	let formattedString = formatter.format(this);
	// 将格式化后的字符串解析为数字以返回
	return String(parseFloat(formattedString.replace(/,/g, '')));
}

Object.defineProperty(Number.prototype, "numberIndexToString", {
	value:function(){
		let number = this;
		let char = "";
		let array = [];
		let numToStringAction = function(nnum) {
			let num = nnum - 1;
			let a = parseInt(num / 26);
			let b = num % 26;
			array.push(b);
			if (a > 0) {
				numToStringAction(a);
			}
		};
		numToStringAction(number);
		array = array.reverse();
		// Return excel letter: such => C / AA / BBA
		for (let i = 0; i < array.length; i++) {
			char += String.fromCharCode(64 + parseInt(array[i] + 1));
		}
		return char;
	}
});
/**
 * 数字转为字母
 * 1=>A 2=>B ... 27=>AA
 * @param number
 * @returns {string}
 */

/**
 * 获取URL参数
 */
window.getQueryString = function(name) {
	let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
	let r = window.location.search.substr(1).match(reg);
	if (r != null){
		return unescape(r[2]);
	}
	return undefined;
};

/**
 * 替换
 * @param s1
 * @param s2
 * @returns {string}
 */
String.prototype.replaceAll = function(s1, s2) {
	// eslint-disable-next-line
	let r = new RegExp(s1.replace(/([\(\)\[\]\{\}\^\$\+\-\*\?\.\"\'\|\/\\])/g, "\\$1"), "ig");
	return this.replace(r, s2);
};

/**
 * 数字加上千分位分割
 */
Object.defineProperty(Number.prototype, "toThousands", {
	value(){
		let num = this.toString();
		let isDicmal = this.toString().indexOf(".") != -1;
		let str = "";
		if(isDicmal){
			let [intVal, dicmalVal] = num.split(".");
			str = intVal.replace(/(\d)(?=(?:\d{3})+$)/g, "$1,") + `.${dicmalVal}`;
		}else{
			str = num.replace(/(\d)(?=(?:\d{3})+$)/g, "$1,");
		}
		return str;
		// return this.toString().replace(/(\d)(?=(?:\d{3})+$)/g, "$1,");
	}
});
/**
 * 小数位格式化
 * @param value 数字
 * @param precision 保留位数
 * @returns {number}
 */
Number.getNumber = function(value, precision = 2) {
	if (typeof value === "string") {
		if (value === "") {
			return 0;
		}
		value = value.replace(/[^\d.]|^[.]/g, "");	 // 清除“数字”和“.”以外的字符,首个.也被清除
		value = value.replace(/\.{2,}/g, ".");	// 只保留第一个. 清除多余的
		value = value.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
		// 以上已经过滤，此处控制的是如果没有小数点，首位不能为类似于 01、02的金额
		if(value.indexOf(".") < 0 && value!=""){
			value = parseFloat(value);
		} else {
			let values = value.split(".");
			let endPointValue = values[1] || "";
			if ((endPointValue == "" || value[value.length - 1] == 0) && endPointValue.length <= precision) {
				// . 是最后一位 或者最后一位是0 并且要小于保留位数
				return Number(value);
			} else {
				value = Number.parseFloat(Number.parseFloat(value).toFixed(precision));
				// value = _.round(value, precision); //真正的四舍五入 解决toFixed处理浮点数的问题
			}
		}
		return value;
	} else {
		if (isNaN(value)) {
			return 0;
		} else {
			return Number.parseFloat(Number.parseFloat(value).toFixed(precision));
			// return _.round(value, precision);
		}
	}
};

/**
 * 获得字符串数字集合 正数，最多小数点后2位，01过滤为1
 * @param {*} value
 */
Number.clearNoNum = function(value) {
	value = value.replace(/[^\d.]|^[.]/g, "");	 // 清除“数字”和“.”以外的字符,首个.也被清除
	value = value.replace(/\.{2,}/g, ".");	// 只保留第一个. 清除多余的
	value = value.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
	value = value.replace(/^(-)*(\d+)\.(\d\d).*$/, "$1$2.$3");	// 只能输入两个小数
	// 以上已经过滤，此处控制的是如果没有小数点，首位不能为类似于 01、02的金额
	if(value.indexOf(".") < 0 && value!=""){
		value = parseFloat(value);
	}
	return value;
};


/**
 * toast提示
 * @param text
 * @param options
 */
window.toast = function(text, options={mask:false}) {
	if(isEmptyStrict(text)){
		text="";
	}
	//TODO 根据设计稿调整toast样式
	typeof options==="object";
	let toast = document.createElement("div");
	toast.className="toast";

	let toastMask = document.createElement("div");
	toastMask.className="toastMask";

	let bkToast = document.createElement("div");
	bkToast.className="bkToast";

	let bkToastIcon = document.createElement("i");
	bkToastIcon.className="bkToastIcon";

	let toastContent = document.createElement("div");
	toastContent.className="toastContent";
	toastContent.innerHTML=text;

	bkToast.appendChild(bkToastIcon);
	bkToast.appendChild(toastContent);

	toast.appendChild(toastMask);
	toast.appendChild(bkToast);

	document.body.appendChild(toast);


	let toastHtml = `${1}
		<div class="toast">
			<div class="toastMask"></div>
			<div class="bkToast">
				<i class="bkToastIcon"></i>
				<div class="toastContent">hello world</div>
			</div>
		</div>`;
	typeof toastHtml==="object";

	setTimeout(function() {
		toast.style.display="none";
		document.body.removeChild(toast);
	}, 2000);
};

const loadingIdList=[];
/**
 * 加载动画
 * @param text
 * @param option
 * @returns {string}
 */
window.showBKLoading = function(text, option={mask:true, delay:300}) {
	if(isEmptyStrict(text)){
		text="";
	}
	/*<div class="bkLoading">
		<div class="loadingMask"></div>
		<svg class="circular" viewBox="25 25 50 50">
			<circle class="path out" cx="50" cy="50" r="20" fill="none" stroke-width="5" stroke-miterlimit="10"/>
			<circle class="path" cx="50" cy="50" r="10" fill="none" stroke-width="5" stroke-miterlimit="10"/>
		</svg>
		<div class="loadingText">
		</div>
	</div>;*/

	let id = "_"+Math.uuidFast();
	let loading = document.createElement("div");
	loading.className="bkLoading";
	loading.id = id;

	let maskDom = "<div class=\"loadingMask\"></div>";
	if(option.mask===false){
		maskDom="";
	}
	loading.innerHTML=`
		${maskDom}
		<div class="loadIcon">
			<svg class="circular" viewBox="25 25 50 50">
				<circle class="path out" cx="50" cy="50" r="20" fill="none" stroke-width="5" stroke-miterlimit="10"/>
				<circle class="path" cx="50" cy="50" r="10" fill="none" stroke-width="5" stroke-miterlimit="10"/>
			</svg>
		</div>
		<div class="loadingText">${text}</div>
	`;
	let timer = setTimeout(()=>{//添加300毫秒的延迟,防止一闪而过
		if(loadingIdList.includes(id)){
			document.body.appendChild(loading);
		}else{
			clearTimeout(timer);
		}
	}, option.delay);
	loadingIdList.push(id);
	return id;
};

/**
 * 关闭loading
 */
window.hideBKLoading=function(id) {
	let loadingList = [];
	if(id){
		loadingList = [document.getElementById(id)];
	}else{
		loadingList = document.getElementsByClassName("bkLoading");
	}
	if(loadingList && loadingList.length>0){
		id = id || loadingList[0].id;//取出id
		loadingIdList.splice(loadingIdList.indexOf(id), 1);
		loadingList[0] && document.body.removeChild(loadingList[0]);
	}else{//没有loading,但是调用了hideBKLoading,说明还没有插入loading,直接删除loading的id不用再执行loading动画了
		loadingIdList.splice(0, 1);
	}
};

/**
 * 限制输入框小数位数,小数位数通过元素的:data-len属性来控制
 */
window.onlyNumber=function(len) {
	if(len===undefined){
		len = event.target.dataset.len||2;
	}
	let value = event.target.value;
	//全选中
	if(event.target.selectionStart===0 && event.target.selectionEnd===event.target.value.length){
		event.returnValue = true;
	}else{
		if (value === "" && event.keyCode === 46) {
			event.returnValue = false;
		}
		if (value.toString().indexOf(".") >= 0 && event.keyCode === 46) {
			event.returnValue = false;
		}
		if (value.toString().split(".").length > 2) {
			event.returnValue = false;
		}
		let reg = RegExp("\\.\\d{"+len+"}$");
		if ((event.keyCode < 48 || event.keyCode > 57) && event.keyCode !== 45 && event.keyCode !== 46 || reg.test(value)) {
			event.returnValue = false;
		}
	}
};

/**
 * @description 数字转中文数码
 * @param {String} mode 转换模式,是一还是壹,lower|upper,默认lower
 * @param {String} type 结果类型,是否带元整,number|money,默认number
 *
 * @example Number(100000000).toUpperCase('upper','money') => "壹亿元整"
 * @example Number(100000000).toUpperCase() => "壹亿"
 */
Object.defineProperty(Number.prototype,"toUpperCase",{
	value:function (mode="lower",type="number"){
		let number = this;
		// 配置
		const confMap = {
			lower: {
				num: ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"],
				unit: ["", "十", "百", "千", "万"],
				level: ["", "万", "亿"]
			},
			upper: {
				num: ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"],
				unit: ["", "拾", "佰", "仟"],
				level: ["", "万", "亿"]
			},
			decimal: {
				unit: ["分", "角"]
			},
			maxNumber: 999999999999.99
		};

		// 过滤不合法参数
		if (this > confMap.maxNumber) {
			console.error(`最大只能转换到 ${confMap.maxNumber}. 数字 ${this} 超出可转换范围!`);
			return false;
		}

		const conf = confMap[mode];
		const numbers = String(this.toFixed(2)).split(".");
		const integer = numbers[0].split("");
		const decimal = Number(numbers[1]) === 0 ? [] : numbers[1].split("");

		// 四位分级
		const levels = integer.reverse().reduce((pre, item, idx) => {
			let level = pre[0] && pre[0].length < 4 ? pre[0] : [];
			let value =
				item === "0" ? conf.num[item] : conf.num[item] + conf.unit[idx % 4];
			level.unshift(value);

			if (level.length === 1) {
				pre.unshift(level);
			} else {
				pre[0] = level;
			}

			return pre;
		}, []);

		// 整数部分
		const _integer = levels.reduce((pre, item, idx) => {
			let _level = conf.level[levels.length - idx - 1];
			let _item = item.join("").replace(/(零)\1+/g, "$1"); // 连续多个零字的部分设置为单个零字

			// 如果这一级只有一个零字，则去掉这级
			if (_item === "零") {
				_item = "";
				_level = "";

				// 否则如果末尾为零字，则去掉这个零字
			} else if (_item[_item.length - 1] === "零") {
				_item = _item.slice(0, _item.length - 1);
			}

			return pre + _item + _level;
		}, "");

		// 小数部分
		let _decimal = decimal
			.map((item, idx) => {
				const unit = confMap.decimal.unit;
				const _unit = item !== "0" ? unit[unit.length - idx - 1] : "";

				return `${conf.num[item]}${_unit}`;
			})
			.join("");

		if(type==="money") {
			// 如果是整数，则补个整字
			return `${_integer}元${_decimal || "整"}`;
		}else{
			return `${_integer}${_decimal}`
		}
	}
})
