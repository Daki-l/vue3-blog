<template>
	<div class="admin_dashboard" v-loading="loading">
		<div class="page_header">
			<span class="page_title">数据看板</span>
			<el-button link type="primary" :loading="loading" @click="initStats">刷新</el-button>
		</div>
		<div class="stat_cards">
			<el-card shadow="hover" class="stat_card">
				<div class="stat_value">{{ stats.users }}</div>
				<div class="stat_label">注册用户</div>
			</el-card>
			<el-card shadow="hover" class="stat_card">
				<div class="stat_value">{{ stats.coupons?.total ?? '-' }}</div>
				<div class="stat_label">兑换码总数</div>
			</el-card>
			<el-card shadow="hover" class="stat_card">
				<div class="stat_value">{{ stats.coupons?.verified ?? '-' }}</div>
				<div class="stat_label">有效兑换码</div>
			</el-card>
			<el-card shadow="hover" class="stat_card">
				<div class="stat_value">{{ stats.messages }}</div>
				<div class="stat_label">留言数</div>
			</el-card>
			<el-card shadow="hover" class="stat_card">
				<div class="stat_value">{{ stats.redemptions?.total ?? '-' }}</div>
				<div class="stat_label">兑换总数</div>
			</el-card>
			<el-card shadow="hover" class="stat_card">
				<div class="stat_value">{{ stats.redemptions?.today ?? '-' }}</div>
				<div class="stat_label">今日兑换</div>
			</el-card>
		</div>

		<el-card shadow="never" class="trend_card">
			<template #header>
				<span class="trend_title">近 7 日兑换趋势</span>
			</template>
			<div class="trend_chart" v-if="trendList.length > 0">
				<div class="trend_col" v-for="(item, index) in trendList" :key="index">
					<div class="trend_count">{{ item.count }}</div>
					<div class="trend_bar_box">
						<div
							class="trend_bar"
							:style="{ height: barHeight(item.count) + '%' }"
							:title="`${item.date}：${item.count} 次`"></div>
					</div>
					<div class="trend_date">{{ item.date }}</div>
				</div>
			</div>
			<el-empty v-else description="暂无趋势数据" :image-size="80" />
		</el-card>

		<el-card shadow="never" class="trend_card">
			<template #header>
				<div class="visit_header">
					<span class="trend_title">站点访问统计(兑换码页)</span>
					<div class="visit_meta">
						<el-select v-model="visitDays" style="width: 130px" @change="initVisitStats">
							<el-option label="近 14 天" :value="14" />
							<el-option label="近 30 天" :value="30" />
							<el-option label="近 90 天" :value="90" />
						</el-select>
						<span class="visit_summary" v-if="visitSummary">
							累计 {{ visitSummary.days }} 天 / 总查询 {{ visitSummary.totalQueries }} 次
						</span>
					</div>
				</div>
			</template>
			<div class="visit_chart" v-if="visitList.length > 0">
				<div class="visit_col" v-for="(item, index) in visitList" :key="index">
					<div class="visit_count">{{ item.totalQueries }}</div>
					<div class="visit_bar_box">
						<div
							class="visit_bar"
							:style="{ height: visitBarHeight(item.totalQueries) + '%' }"
							:title="`${item.day}：查询 ${item.totalQueries} 次 / 独立IP ${item.ipCount}`"></div>
					</div>
					<div class="visit_date">{{ item.day.slice(5) }}</div>
				</div>
			</div>
			<el-empty v-else description="暂无访问数据" :image-size="80" />
		</el-card>
		<el-card shadow="never" class="trend_card degrade_card">
			<template #header>
				<div class="visit_header">
					<span class="trend_title">D1 限额降级(兑换缓冲)</span>
					<el-tag v-if="degrade.degraded" :type="degrade.flag?.mode === 'auto' ? 'warning' : 'danger'">
						{{ degrade.flag?.mode === 'auto' ? '已自动降级' : '手动降级中' }}
					</el-tag>
					<el-tag v-else type="success">正常</el-tag>
				</div>
			</template>
			<div class="degrade_body">
				<div class="degrade_desc">
					开启后兑换不再写 D1(免受每日行读限额影响)：兑换立即成功，流水暂存 KV
					缓冲，每日 09:00(北京时间)定时任务自动回放入库，也可手动重放。
				</div>
				<div class="degrade_meta" v-if="degrade.flag">
					触发时间：{{ formatDateTime(degrade.flag.setAt * 1000) }}
					<template v-if="degrade.flag.mode === 'auto'">；将于额度重置后自动解除</template>
				</div>
				<div class="degrade_meta">缓冲未入库流水：<b>{{ degrade.buffered }}</b> 条</div>
				<div class="degrade_btns">
					<el-switch
						v-model="degradeEnabled"
						:loading="degradeSwitching"
						active-text="手动开启"
						inactive-text="关闭"
						@change="handleDegradeSwitch" />
					<el-button size="small" type="primary" :loading="replaying" @click="handleReplay" :disabled="!degrade.buffered">
						重放缓冲({{ degrade.buffered }})
					</el-button>
					<el-button link size="small" @click="initDegrade">刷新</el-button>
				</div>
			</div>
		</el-card>
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getAdminStats, getVisitStats, getDegradeStatus, setDegradeEnabled, replayDegradeBuffer } from '@/services/admin';
import { formatDateTime } from '@/utils/format';

const loading = ref(false);
const stats = ref({});

const visitDays = ref(30);
const visitList = ref([]);
const visitSummary = ref(null);

const trendList = computed(() => stats.value?.trend || []);
const trendMax = computed(() => {
	return Math.max(1, ...trendList.value.map((item) => Number(item.count) || 0));
});

const barHeight = (count) => {
	const num = Number(count) || 0;
	return Math.max(4, Math.round((num / trendMax.value) * 100));
};

const visitMax = computed(() => {
	return Math.max(1, ...visitList.value.map((item) => Number(item.totalQueries) || 0));
});

const visitBarHeight = (count) => {
	const num = Number(count) || 0;
	return Math.max(4, Math.round((num / visitMax.value) * 100));
};

const initVisitStats = async () => {
	try {
		const res = await getVisitStats({ days: visitDays.value });
		visitList.value = res?.list || [];
		visitSummary.value = res?.summary || null;
	} catch (e) {
		console.error('获取访问统计失败', e);
	}
};

// ===== D1 限额降级控制(仅走 KV,限额期可用) =====
const degrade = ref({ degraded: false, flag: null, buffered: 0 });
const degradeEnabled = ref(false);
const degradeSwitching = ref(false);
const replaying = ref(false);

const initDegrade = async () => {
	try {
		const res = await getDegradeStatus();
		degrade.value = res || { degraded: false, flag: null, buffered: 0 };
		degradeEnabled.value = !!degrade.value.degraded && degrade.value.flag?.mode === 'manual';
	} catch (e) {
		console.error('获取降级状态失败', e);
	}
};

const handleDegradeSwitch = async (val) => {
	degradeSwitching.value = true;
	try {
		await setDegradeEnabled(val);
		ElMessage.success(val ? '已手动开启降级(兑换写 KV 缓冲)' : '已关闭降级(恢复正常写库)');
		await initDegrade();
	} catch (e) {
		degradeEnabled.value = !val;
	} finally {
		degradeSwitching.value = false;
	}
};

const handleReplay = async () => {
	replaying.value = true;
	try {
		const res = await replayDegradeBuffer();
		ElMessage.success(`已回放 ${res?.replayed ?? 0} 条,剩余 ${res?.remaining ?? 0} 条`);
		await initDegrade();
	} catch (e) {
		// 额度未恢复时后端报错,提示由拦截器统一处理
	} finally {
		replaying.value = false;
	}
};

const initStats = async () => {
	loading.value = true;
	try {
		const res = await getAdminStats();
		stats.value = res || {};
	} catch (e) {
		console.error('获取统计数据失败', e);
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	initStats();
	initVisitStats();
	initDegrade();
});
</script>

<style lang="less">
.admin_dashboard {
	min-height: 100%;
	.page_header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		.page_title {
			font-size: 18px;
			font-weight: 600;
		}
	}
	.stat_cards {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 16px;
		.stat_card {
			flex: 1;
			min-width: 150px;
			text-align: center;
			.stat_value {
				font-size: 26px;
				font-weight: 600;
				color: #409eff;
			}
			.stat_label {
				margin-top: 4px;
				font-size: 13px;
				color: #909399;
			}
		}
	}
	.trend_card {
		.degrade_card {
			margin-top: 12px;
		}
		.degrade_body {
			.degrade_desc {
				font-size: 13px;
				color: #606266;
				line-height: 1.6;
				margin-bottom: 8px;
			}
			.degrade_meta {
				font-size: 12px;
				color: #909399;
				margin-bottom: 4px;
			}
			.degrade_btns {
				display: flex;
				align-items: center;
				gap: 16px;
				margin-top: 10px;
			}
		}
		.trend_title {
			font-weight: 600;
		}
		.visit_header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			flex-wrap: wrap;
			gap: 8px;
		}
		.visit_meta {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.visit_summary {
			font-size: 12px;
			color: #909399;
		}
		.visit_chart {
			display: flex;
			align-items: flex-end;
			height: 220px;
			padding: 0 8px;
			overflow-x: auto;
			.visit_col {
				flex: 1 0 20px;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: flex-end;
				height: 100%;
				min-width: 20px;
				.visit_count {
					font-size: 10px;
					color: #606266;
					margin-bottom: 4px;
				}
				.visit_bar_box {
					width: 60%;
					height: 160px;
					display: flex;
					align-items: flex-end;
					background-color: #f5f7fa;
					border-radius: 4px 4px 0 0;
					.visit_bar {
						width: 100%;
						background: linear-gradient(180deg, #95d475 0%, #67c23a 100%);
						border-radius: 4px 4px 0 0;
						transition: height 0.3s;
					}
				}
				.visit_date {
					margin-top: 6px;
					font-size: 10px;
					color: #909399;
					white-space: nowrap;
				}
			}
		}
		.trend_chart {
			display: flex;
			align-items: flex-end;
			justify-content: space-around;
			height: 220px;
			padding: 0 8px;
			.trend_col {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: flex-end;
				height: 100%;
				width: 10%;
				.trend_count {
					font-size: 12px;
					color: #606266;
					margin-bottom: 4px;
				}
				.trend_bar_box {
					width: 60%;
					height: 160px;
					display: flex;
					align-items: flex-end;
					background-color: #f5f7fa;
					border-radius: 4px 4px 0 0;
					.trend_bar {
						width: 100%;
						background: linear-gradient(180deg, #79bbff 0%, #409eff 100%);
						border-radius: 4px 4px 0 0;
						transition: height 0.3s;
					}
				}
				.trend_date {
					margin-top: 6px;
					font-size: 12px;
					color: #909399;
				}
			}
		}
	}
}
</style>
