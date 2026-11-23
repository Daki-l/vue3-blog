/**
 * SWEX 档案本地存档(IndexedDB, 库名 sw-rune, 表 profiles keyPath id)。
 * 隐私模式等导致 IndexedDB 打开失败时自动降级内存 Map(刷新即丢), 所有 API 保持可用;
 * 此时导出标记 isAvailable 变为 false, UI 可据此提示"本次不会保存"。
 * 激活档案 id 存 localStorage 'sw_rune_active'。
 */
import { openDB } from 'idb';

const DB_NAME = 'sw-rune';
const STORE = 'profiles';
const MAX_BYTES = 64 * 1024 * 1024; // 单档案序列化体积上限 64MB
const ACTIVE_KEY = 'sw_rune_active';

/** 可用性标记(live binding): 模块加载时同步探测, getDB 失败时降为 false */
export let isAvailable = typeof indexedDB !== 'undefined';

let dbPromise = null;
const memProfiles = new Map(); // 降级内存档(隐私模式, 刷新丢失)

/** 打开数据库(模块级缓存); 失败返回 null 且标记不可用, 之后一直走内存降级 */
function getDB() {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, 1, {
			upgrade(db) {
				if (!db.objectStoreNames.contains(STORE)) {
					db.createObjectStore(STORE, { keyPath: 'id' });
				}
			}
		}).catch((e) => {
			isAvailable = false;
			return null;
		});
	}
	return dbPromise;
}

/**
 * 保存一份归一化档案(swex.js 产出): 自动生成 id(wizard.id+时间戳)/显示名/savedAt。
 * 序列化后超过 64MB 抛 Error('profile_too_large')。
 * @returns 保存后的完整档案记录(含 id)
 */
export async function saveProfile(normalized) {
	const wizard = normalized?.wizard || {};
	const now = Date.now();
	const record = {
		...normalized,
		id: `${wizard.id ?? 'unknown'}-${now}`,
		name: normalized?.name || wizard.name || '未命名档案',
		savedAt: now
	};
	// 体积校验用 Blob 取字节长度(中文字符多字节, 比 string.length 准确)
	if (new Blob([JSON.stringify(record)]).size > MAX_BYTES) {
		throw new Error('profile_too_large');
	}
	const db = await getDB();
	if (!db) {
		memProfiles.set(record.id, record);
		return record;
	}
	await db.put(STORE, record);
	return record;
}

/** 完整档案记录 → 列表元信息(不携带 monsters/runes 大数组) */
function toMeta(p) {
	return {
		id: p.id,
		name: p.name,
		wizardName: p.wizard?.name,
		runeCount: p.runes?.length || 0,
		monsterCount: p.monsters?.length || 0,
		savedAt: p.savedAt
	};
}

/** 档案列表(只回元信息, 按保存时间倒序) */
export async function listProfiles() {
	const db = await getDB();
	const all = db ? await db.getAll(STORE) : [...memProfiles.values()];
	return all.map(toMeta).sort((a, b) => b.savedAt - a.savedAt);
}

/** 按 id 取完整档案; 不存在返回 undefined */
export async function getProfile(id) {
	const db = await getDB();
	return db ? db.get(STORE, id) : memProfiles.get(id);
}

/** 按 id 删除档案; 删的是当前激活档案时同步清掉激活标记 */
export async function deleteProfile(id) {
	const db = await getDB();
	if (db) await db.delete(STORE, id);
	else memProfiles.delete(id);
	if (getActiveId() === id) setActive(null);
}

/** 设置激活档案 id(传 null 清除); localStorage 不可用时静默忽略 */
export function setActive(id) {
	try {
		if (id == null) localStorage.removeItem(ACTIVE_KEY);
		else localStorage.setItem(ACTIVE_KEY, id);
	} catch (e) { /* 隐私模式 localStorage 也可能抛错 */ }
}

/** 读激活档案 id(localStorage 不可用返回 null) */
function getActiveId() {
	try {
		return localStorage.getItem(ACTIVE_KEY);
	} catch (e) {
		return null;
	}
}

/** 当前激活的完整档案; 未设置或档案已删则 null */
export async function getActive() {
	const id = getActiveId();
	if (!id) return null;
	return (await getProfile(id)) || null;
}
