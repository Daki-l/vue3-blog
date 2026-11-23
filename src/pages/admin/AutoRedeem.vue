<template>
	<div class="admin_auto_redeem_wrapper">
		<div class="page_header">
			<span class="page_title">自动兑换</span>
			<el-button link @click="initAll">刷新</el-button>
		</div>

		<!-- 总开关 + 概览 -->
		<el-card shadow="never" class="block_card" v-loading="overviewLoading">
			<div class="switch_row">
				<span class="block_title">总开关</span>
				<el-switch v-model="enabled" :loading="switching" @change="handleSwitch" />
				<el-tag :type="enabled ? 'success' : 'info'">{{ enabled ? '运行中' : '已关闭' }}</el-tag>
				<div class="run_now">
					<el-button type="primary" size="small" :loading="running" :disabled="!enabled" @click="handleRunNow">
						立即执行一片
					</el-button>
				</div>
			</div>
			<div class="stat_row">
				<div class="stat" v-for="item in stats" :key="item.label">
					<div class="stat_value">{{ item.value }}</div>
					<div class="stat_label">{{ item.label }}</div>
				</div>
			</div>
			<div class="hint">
				每天北京时间 21:00 起每 10 分钟处理一个切片（每片至多 30 个「账号 × 码」，并发 5、批间随机等待 1–3
				秒），处理完即空转，最晚 22:50 结束。总开关关闭时定时任务照常触发，但不抓码、不兑换。
			</div>
			<div class="hint" v-if="overview.lastRun">
				最近一次运行：{{ formatDateTime(overview.lastRun.started_at) }}，{{ runSummary(overview.lastRun) }}
			</div>
		</el-card>

		<!-- 白名单 -->
		<el-card shadow="never" class="block_card">
			<template #header>
				<span class="block_title">白名单</span>
				<span class="block_desc">管理员默认可用，无需加入；移出后该用户的开关保留，但不再参与</span>
			</template>
			<div class="add_form">
				<el-select v-model="allowForm.userId" placeholder="选择用户" filterable class="user_select">
					<el-option v-for="u in allowCandidates" :key="u.id" :label="userLabel(u)" :value="u.id" />
				</el-select>
				<el-input v-model="allowForm.note" placeholder="备注(选填,≤50字)" maxlength="50" class="note_input" />
				<el-button type="primary" :disabled="!allowForm.userId" @click="handleAddAllow">加入白名单</el-button>
			</div>
			<el-table :data="allowlist" border v-loading="allowLoading" size="small">
				<el-table-column label="用户" min-width="160">
					<template #default="{ row }">
						{{ row.username }}<span v-if="row.nickname" class="muted">（{{ row.nickname }}）</span>
						<span class="muted">#{{ row.user_id }}</span>
					</template>
				</el-table-column>
				<el-table-column label="角色" width="90">
					<template #default="{ row }">
						<el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">{{ row.role === 'admin' ? '管理员' : '用户' }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="状态" width="90">
					<template #default="{ row }">
						<el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
							{{ row.status === 'active' ? '正常' : '已封禁' }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="auto_accounts" label="已开启账号" width="100" align="center" />
				<el-table-column label="备注" min-width="120">
					<template #default="{ row }">{{ row.note || '-' }}</template>
				</el-table-column>
				<el-table-column label="加入时间" width="170">
					<template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
				</el-table-column>
				<el-table-column label="操作" width="90" align="right">
					<template #default="{ row }">
						<el-popconfirm :title="`确认将「${row.username}」移出白名单？`" @confirm="handleRemoveAllow(row)">
							<template #reference>
								<el-button type="danger" link>移出</el-button>
							</template>
						</el-popconfirm>
					</template>
				</el-table-column>
				<template #empty>
					<el-empty description="白名单为空" :image-size="60" />
				</template>
			</el-table>
		</el-card>

		<!-- 已开启账号 -->
		<el-card shadow="never" class="block_card">
			<template #header><span class="block_title">已开启账号</span></template>
			<el-table :data="accounts" border v-loading="accountsLoading" size="small">
				<el-table-column label="用户" min-width="140">
					<template #default="{ row }">{{ row.username }}</template>
				</el-table-column>
				<el-table-column label="Hive ID" min-width="130">
					<template #default="{ row }">{{ row.hive_id }}</template>
				</el-table-column>
				<el-table-column label="召唤师" min-width="120">
					<template #default="{ row }">{{ row.wizard_name || '-' }}</template>
				</el-table-column>
				<el-table-column label="服务器" width="150">
					<template #default="{ row }">{{ getServerLabel(row.server) }}</template>
				</el-table-column>
				<el-table-column label="备注" min-width="110">
					<template #default="{ row }">{{ row.label || '-' }}</template>
				</el-table-column>
				<el-table-column label="准入" width="100" align="center">
					<template #default="{ row }">
						<el-tag :type="row.allowed ? 'success' : 'info'" size="small">{{ row.allowed ? '有效' : '已失效' }}</el-tag>
					</template>
				</el-table-column>
				<template #empty>
					<el-empty description="还没有账号开启自动兑换" :image-size="60" />
				</template>
			</el-table>
		</el-card>

		<!-- 运行记录 -->
		<el-card shadow="never" class="block_card">
			<template #header><span class="block_title">运行记录</span></template>
			<el-table :data="runs" border v-loading="runsLoading" size="small">
				<el-table-column label="时间" width="170">
					<template #default="{ row }">{{ formatDateTime(row.started_at) }}</template>
				</el-table-column>
				<el-table-column label="来源" width="80">
					<template #default="{ row }">{{ row.source === 'cron' ? '定时' : '手动' }}</template>
				</el-table-column>
				<el-table-column label="状态" width="90">
					<template #default="{ row }">
						<el-tag :type="runTagType(row.status)" size="small">{{ runStatusText(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="calls" label="调用" width="70" align="center" />
				<el-table-column prop="success" label="成功" width="70" align="center" />
				<el-table-column prop="used" label="已使用" width="80" align="center" />
				<el-table-column prop="invalid" label="码无效" width="80" align="center" />
				<el-table-column prop="acct_invalid" label="账号无效" width="90" align="center" />
				<el-table-column prop="transient" label="临时错误" width="90" align="center" />
				<el-table-column prop="cooldown_skipped" label="冷却跳过" width="90" align="center" />
				<el-table-column prop="expired_codes" label="标过期" width="80" align="center" />
				<el-table-column label="说明" min-width="200" show-overflow-tooltip>
					<template #default="{ row }">{{ runMessage(row) }}</template>
				</el-table-column>
				<template #empty>
					<el-empty description="还没有运行记录" :image-size="60" />
				</template>
			</el-table>
			<div class="pagination_box" v-if="runsTotal > pageSize">
				<el-pagination
					background
					layout="total, prev, pager, next"
					:total="runsTotal"
					:page-size="pageSize"
					:current-page="runsPage"
					@current-change="handleRunsPageChange" />
			</div>
		</el-card>

		<!-- 账本 -->
		<el-card shadow="never" class="block_card">
			<template #header>
				<span class="block_title">账本</span>
				<span class="block_desc">每个「账号 × 兑换码」一条，即去重依据</span>
			</template>
			<div class="filter_bar">
				<el-select v-model="ledgerFilters.status" placeholder="状态" clearable class="filter_select">
					<el-option v-for="s in LEDGER_STATUSES" :key="s.value" :label="s.label" :value="s.value" />
				</el-select>
				<el-input v-model="ledgerFilters.keyword" placeholder="Hive ID / 兑换码" clearable class="filter_input" @keyup.enter="handleLedgerSearch" />
				<el-button type="primary" @click="handleLedgerSearch">查询</el-button>
				<el-button @click="handleLedgerReset">重置</el-button>
			</div>
			<el-table :data="ledger" border v-loading="ledgerLoading" size="small">
				<el-table-column label="记录时间" width="170">
					<template #default="{ row }">{{ formatDateTime(row.first_seen_at) }}</template>
				</el-table-column>
				<el-table-column label="用户" width="120">
					<template #default="{ row }">{{ row.username || '-' }}</template>
				</el-table-column>
				<el-table-column label="Hive ID" min-width="120">
					<template #default="{ row }">{{ row.hive_id }}</template>
				</el-table-column>
				<el-table-column label="服务器" width="150">
					<template #default="{ row }">{{ getServerLabel(row.server) }}</template>
				</el-table-column>
				<el-table-column label="兑换码" min-width="150">
					<template #default="{ row }">{{ (row.code || '').toUpperCase() }}</template>
				</el-table-column>
				<el-table-column label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="ledgerTagType(row.status)" size="small">{{ ledgerStatusText(row) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="attempts" label="尝试" width="70" align="center" />
				<el-table-column label="来源" width="80">
					<template #default="{ row }">{{ row.origin === 'auto' ? '自动' : '流水' }}</template>
				</el-table-column>
				<el-table-column label="下次重试" width="170">
					<template #default="{ row }">{{ isTerminal(row.status) ? '-' : formatDateTime(row.next_try_at) }}</template>
				</el-table-column>
				<el-table-column label="说明" min-width="200" show-overflow-tooltip>
					<template #default="{ row }">{{ plainMsg(row.ret_msg) }}</template>
				</el-table-column>
				<template #empty>
					<el-empty description="暂无记录" :image-size="60" />
				</template>
			</el-table>
			<div class="pagination_box" v-if="ledgerTotal > pageSize">
				<el-pagination
					background
					layout="total, prev, pager, next"
					:total="ledgerTotal"
					:page-size="pageSize"
					:current-page="ledgerPage"
					@current-change="handleLedgerPageChange" />
			</div>
		</el-card>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
	getAdminUsers,
	getAutoRedeemOverview,
	setAutoRedeemConfig,
	getAutoRedeemAllowlist,
	addAutoRedeemAllowlist,
	removeAutoRedeemAllowlist,
	getAutoRedeemAccounts,
	getAutoRedeemRuns,
	runAutoRedeemNow,
	getAutoRedeemLedger
} from '@/services/admin';
import { getServerLabel } from '@/common/constant';
import { formatDateTime } from '@/utils/format';

const pageSize = 20;

// ===== 状态文案 =====
const RUN_STATUS = {
	running: { text: '运行中', type: 'warning' },
	done: { text: '完成', type: 'success' },
	aborted: { text: '已中止', type: 'danger' },
	skipped: { text: '跳过', type: 'info' },
	error: { text: '出错', type: 'danger' },
	crashed: { text: '已中断', type: 'danger' }
};
const LEDGER_STATUSES = [
	{ value: 'success', label: '已兑换', type: 'success' },
	{ value: 'used', label: '已使用过', type: 'success' },
	{ value: 'pending', label: '待处理', type: 'info' },
	{ value: 'invalid', label: '码无效', type: 'danger' },
	{ value: 'acct_invalid', label: 'Hive ID 无效', type: 'danger' },
	{ value: 'transient', label: '临时错误', type: 'warning' }
];
const runStatusText = (status) => RUN_STATUS[status]?.text || status;
const runTagType = (status) => RUN_STATUS[status]?.type || 'info';
const ledgerMeta = (status) => LEDGER_STATUSES.find((s) => s.value === status) || { label: status, type: 'info' };
const ledgerStatusText = (row) => ledgerMeta(row.status).label;
const ledgerTagType = (status) => ledgerMeta(status).type;
const isTerminal = (status) => status === 'success' || status === 'used' || status === 'acct_invalid';
const plainMsg = (msg) => String(msg || '').replace(/<br\s*\/?>/gi, ' ').trim() || '-';
const runMessage = (row) => {
	if (row.status === 'skipped') return row.message === 'disabled' ? '总开关未开启' : row.message === 'overlap' ? '与运行中的切片撞车' : row.message || '-';
	const parts = [];
	if (row.has_more) parts.push('本片额度用完，仍有待办');
	if (row.message) parts.push(row.message);
	return parts.join('；') || '-';
};
const runSummary = (row) =>
	`${runStatusText(row.status)}，调用 ${row.calls} 次：成功 ${row.success}，已使用 ${row.used}，码无效 ${row.invalid}，账号无效 ${row.acct_invalid}，临时错误 ${row.transient}${
		row.expired_codes ? `，标过期 ${row.expired_codes} 个码` : ''
	}`;

// ===== 总开关 + 概览 =====
const overviewLoading = ref(false);
const overview = ref({ allowlist: 0, accounts: 0, pending: 0, today: { calls: 0, success: 0, used: 0 }, lastRun: null });
const enabled = ref(false);
const switching = ref(false);
const running = ref(false);

const stats = computed(() => {
	const o = overview.value;
	return [
		{ label: '白名单用户', value: o.allowlist },
		{ label: '已开启账号', value: o.accounts },
		{ label: '待处理（账号 × 码）', value: o.pending },
		{ label: '今日调用', value: o.today?.calls ?? 0 },
		{ label: '今日成功', value: o.today?.success ?? 0 },
		{ label: '今日已使用', value: o.today?.used ?? 0 }
	];
});

const initOverview = async () => {
	overviewLoading.value = true;
	try {
		const res = await getAutoRedeemOverview();
		overview.value = res || overview.value;
		enabled.value = !!res?.enabled;
	} catch (e) {
		console.error('获取自动兑换概览失败', e);
	} finally {
		overviewLoading.value = false;
	}
};

const handleSwitch = async (val) => {
	switching.value = true;
	try {
		await setAutoRedeemConfig(val);
		ElMessage.success(val ? '已开启自动兑换' : '已关闭自动兑换');
		initOverview();
	} catch (e) {
		enabled.value = !val;
		// 错误提示由 axios 拦截器统一处理
	} finally {
		switching.value = false;
	}
};

// 立即执行:手动档一个切片(≤12 个「账号 × 码」),用于上线验证;会真实调用 Hive 兑换接口
const handleRunNow = () => {
	ElMessageBox.confirm('立即处理一个切片（至多 12 个「账号 × 码」）？会真实调用 Hive 兑换接口。', '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning'
	})
		.then(async () => {
			running.value = true;
			try {
				const res = await runAutoRedeemNow();
				const run = res?.run || {};
				if (run.status === 'skipped') {
					ElMessage.warning(run.message === 'overlap' ? '已有切片正在运行，本次已跳过' : '总开关未开启，本次已跳过');
				} else {
					ElMessage({
						type: run.status === 'done' ? 'success' : 'warning',
						message: `${runSummary(run)}${run.has_more ? '；仍有待办，可继续执行' : ''}`
					});
				}
				initAll();
			} catch (e) {
				// 错误提示由 axios 拦截器统一处理
			} finally {
				running.value = false;
			}
		})
		.catch(() => {});
};

// ===== 白名单 =====
const allowlist = ref([]);
const allowLoading = ref(false);
const users = ref([]);
const allowForm = reactive({ userId: null, note: '' });

const userLabel = (u) => `${u.username}${u.nickname ? `（${u.nickname}）` : ''} #${u.id}`;
// 可加入的候选:未封禁、非管理员、尚未在白名单
const allowCandidates = computed(() => {
	const listed = new Set(allowlist.value.map((x) => Number(x.user_id)));
	return users.value.filter((u) => u.role !== 'admin' && u.status === 'active' && !listed.has(Number(u.id)));
});

const initAllowlist = async () => {
	allowLoading.value = true;
	try {
		const [list, userList] = await Promise.all([getAutoRedeemAllowlist(), getAdminUsers()]);
		allowlist.value = list?.list || [];
		users.value = userList?.list || [];
	} catch (e) {
		console.error('获取白名单失败', e);
	} finally {
		allowLoading.value = false;
	}
};

const handleAddAllow = async () => {
	try {
		await addAutoRedeemAllowlist(allowForm.userId, allowForm.note.trim() || undefined);
		ElMessage.success('已加入白名单');
		allowForm.userId = null;
		allowForm.note = '';
		initAllowlist();
		initOverview();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	}
};

const handleRemoveAllow = async (row) => {
	try {
		await removeAutoRedeemAllowlist(row.user_id);
		ElMessage.success('已移出白名单');
		initAllowlist();
		initAccounts();
		initOverview();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	}
};

// ===== 已开启账号 =====
const accounts = ref([]);
const accountsLoading = ref(false);

const initAccounts = async () => {
	accountsLoading.value = true;
	try {
		const res = await getAutoRedeemAccounts();
		accounts.value = res?.list || [];
	} catch (e) {
		console.error('获取已开启账号失败', e);
	} finally {
		accountsLoading.value = false;
	}
};

// ===== 运行记录 =====
const runs = ref([]);
const runsLoading = ref(false);
const runsTotal = ref(0);
const runsPage = ref(1);

const initRuns = async () => {
	runsLoading.value = true;
	try {
		const res = await getAutoRedeemRuns({ page: runsPage.value, pageSize });
		runs.value = res?.list || [];
		runsTotal.value = Number(res?.total) || 0;
	} catch (e) {
		console.error('获取运行记录失败', e);
	} finally {
		runsLoading.value = false;
	}
};

const handleRunsPageChange = (page) => {
	runsPage.value = page;
	initRuns();
};

// ===== 账本 =====
const ledger = ref([]);
const ledgerLoading = ref(false);
const ledgerTotal = ref(0);
const ledgerPage = ref(1);
const ledgerFilters = reactive({ status: '', keyword: '' });

const initLedger = async () => {
	ledgerLoading.value = true;
	try {
		const params = { page: ledgerPage.value, pageSize };
		if (ledgerFilters.status) {
			params.status = ledgerFilters.status;
		}
		if (ledgerFilters.keyword.trim()) {
			params.keyword = ledgerFilters.keyword.trim();
		}
		const res = await getAutoRedeemLedger(params);
		ledger.value = res?.list || [];
		ledgerTotal.value = Number(res?.total) || 0;
	} catch (e) {
		console.error('获取账本失败', e);
	} finally {
		ledgerLoading.value = false;
	}
};

const handleLedgerSearch = () => {
	ledgerPage.value = 1;
	initLedger();
};

const handleLedgerReset = () => {
	ledgerFilters.status = '';
	ledgerFilters.keyword = '';
	handleLedgerSearch();
};

const handleLedgerPageChange = (page) => {
	ledgerPage.value = page;
	initLedger();
};

const initAll = () => {
	initOverview();
	initAllowlist();
	initAccounts();
	initRuns();
	initLedger();
};

onMounted(() => {
	initAll();
});
</script>

<style lang="less">
.admin_auto_redeem_wrapper {
	.page_header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
		.page_title {
			font-size: 18px;
			font-weight: 600;
		}
	}
	.block_card {
		margin-bottom: 12px;
	}
	.block_title {
		font-size: 14px;
		font-weight: 600;
		margin-right: 10px;
	}
	.block_desc {
		font-size: 12px;
		color: #909399;
	}
	.switch_row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 12px;
		.run_now {
			margin-left: auto;
		}
	}
	.stat_row {
		display: grid;
		grid-template-columns: repeat(6, minmax(90px, 1fr));
		gap: 8px;
		margin-bottom: 12px;
	}
	.stat {
		padding: 8px 10px;
		background: #f5f7fa;
		border-radius: 6px;
		.stat_value {
			font-size: 20px;
			font-weight: 600;
			color: #303133;
		}
		.stat_label {
			font-size: 12px;
			color: #909399;
			margin-top: 2px;
		}
	}
	.hint {
		font-size: 12px;
		color: #909399;
		line-height: 1.7;
	}
	.add_form {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 12px;
		.user_select {
			width: 240px;
		}
		.note_input {
			width: 200px;
		}
	}
	.muted {
		color: #909399;
		font-size: 12px;
	}
	.filter_bar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 12px;
		.filter_select {
			width: 160px;
		}
		.filter_input {
			width: 220px;
		}
	}
	.pagination_box {
		display: flex;
		justify-content: flex-end;
		margin-top: 12px;
	}
	// 手机 web:统计两列
	@media (max-width: 768px) {
		.stat_row {
			grid-template-columns: repeat(2, 1fr);
		}
		.user_select,
		.note_input {
			width: 100%;
		}
	}
}
</style>
