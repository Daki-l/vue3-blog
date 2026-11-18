export default {
	defaultListImg: 'https://static.linow.us.kg/6055f24a697a5aa0d8fdc487a4b5c28017c2c996'
};

/**
 * Hive 账号服务器选项(与后端校验规则一致: global/korea/japan/china/asia/europe)
 */
export const SERVER_OPTIONS = [
	{ value: 'global', label: '全球服务器(Global)' },
	{ value: 'korea', label: '韩国服务器(Korea)' },
	{ value: 'japan', label: '日本服务器(Japan)' },
	{ value: 'china', label: '中国服务器(China)' },
	{ value: 'asia', label: '亚洲服务器(Asia)' },
	{ value: 'europe', label: '欧洲服务器(Europe)' }
];

export function getServerLabel(value) {
	const hit = SERVER_OPTIONS.find((item) => item.value === value);
	return hit ? hit.label : value || '-';
}
