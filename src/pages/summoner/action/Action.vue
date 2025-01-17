<template>
	<div class="summoner_action">
		<el-tabs v-model="activeName" class="action_tabs" @tab-click="handleClick">
			<el-tab-pane label="更新兑换码状态" name="coupon">
				<el-table
                    :border="true"
					:data="codeList"
					style="width: 100%"
					v-loading="onLoading"
					:default-sort="{ prop: 'status', order: 'descending' }">
					<el-table-column prop="coupon" label="兑换码" width="180">
						<template #default="scope">
							<a :href="'https://withhive.me/313/' + scope.row.coupon">
								<span style="margin-left: 10px">{{ scope.row.coupon }}</span>
							</a>
						</template>
					</el-table-column>
					<el-table-column prop="content" label="内容" />
					<el-table-column prop="createTime" label="创建日期" width="180" />
					<el-table-column prop="status" label="状态" width="80" sortable>
						<template #default="{ row }">
							<span :class="row.status">{{ row.status }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="action" label="操作" width="100" align="right">
						<template #default="{ row }">
							<el-button
								link
								:type="row.status == 'verified' ? 'danger' : 'primary'"
								@click="updateStatus(row)">
								{{ row.status == 'verified' ? '作废' : '激活' }}
							</el-button>
							<el-button type="primary" link @click="updateCouponContent(row)">修改内容</el-button>
						</template>
					</el-table-column>
				</el-table>
			</el-tab-pane>
            <el-tab-pane label="网站留言" name="message">
                <el-table
                    :border="true"
					:data="messageList"
                    lazy
                    row-key="messageId"
					style="width: 100%"
                    default-expand-all
                    :tree-props="{ children: 'replies', hasChildren: 'hasChildren' }"
					v-loading="onLoading">
					<el-table-column prop="nickname" label="名称" width="110" align="left">
                        <template #default="{row}">
                            <span class="message_nickname">{{ row.nickname }}</span>
                        </template>
                    </el-table-column>
					<el-table-column prop="content" label="内容" />
					<el-table-column prop="timestamp" label="创建日期" width="180">
                        <template #default="{ row }">
							<span>{{ new Date(row.timestamp).format('yyyy-MM-dd HH:mm:ss') }}</span>
						</template>
                    </el-table-column>
					<el-table-column prop="action" label="操作" width="120" align="right">
						<template #default="{ row }">
							<el-button type="primary" link @click="updateContent(row)">修改内容</el-button>
							<el-button type="primary" link v-if="!row.replyId" @click="replyMessage(row)">回复</el-button>
                            <el-popconfirm title="确认删除消息！" @confirm="deleteMessage(row)">
                                <template #reference>
                                    <el-button type="danger" link>删除</el-button>
                                </template>
                            </el-popconfirm>
						</template>
					</el-table-column>
				</el-table>
            </el-tab-pane>
		</el-tabs>
	</div>
    <ReplyMessageDialog
        v-if="showReplyDialogFlag"
        :detailData="replayDetail"
        @cancel="showReplyDialogFlag = false"
        @success="replySuccess"
    ></ReplyMessageDialog>
    <UpdateMesageDialog
        v-if="showUpdateDialogFlag"
        :detailData="messageDetail"
        @cancel="showUpdateDialogFlag = false"
        @success="updateSuccess"
    ></UpdateMesageDialog>
    <UpdateCouponDialog
        v-if="showUpdateCouponDialogFlag"
        :detailData="couponDetail"
        @cancel="showUpdateCouponDialogFlag = false"
        @success="updateCouponSuccess"
    ></UpdateCouponDialog>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import {
	getSummonerCode,
	updateSummonerCodeFn,
    getMessageList,
	deleteReplyeFn,
    deleteMessageFn,
} from '@/services/summonerServices/summonerServices.js';
import { ElMessage, ElMessageBox } from 'element-plus';
import ReplyMessageDialog from './ReplyMessageDialog.vue'
import UpdateMesageDialog from './UpdateMesageDialog.vue'
import UpdateCouponDialog from './UpdateCouponDialog.vue'


const codeList = ref([]);
const messageList = ref([]);
const onLoading = ref(false);
const stashTime = ref('');
const activeName = ref('coupon');

onMounted(() => {
    initList();
});

const initList = () => {
    switch (activeName.value) {
        case 'coupon':
            initCodeList();
            break;
        case 'message':
            initMessageList();
            break;
        default:
            break;
    }
}

let initCodeList = () => {
    onLoading.value = true;
	let codeInfo = JSON.parse(localStorage.getItem('codeInfo')) || {};
	let currentDate = new Date().toISOString().split('T')[0];
	if (codeInfo.createTime === currentDate && (codeInfo.list || []).length > 0) {
		stashTime.value = currentDate;
		codeList.value = codeInfo.list || [];
	} else {
		getCodeList();
	}
    onLoading.value = false;
};

const initMessageList = async() => {
	onLoading.value = true;
	try {
		const response = await getMessageList({ page: 1 });
		let { list = [] } = response || {};
		messageList.value = list.sort((a, b) => {
			// 将时间字符串转换为Date对象
			const dateA = new Date(a.timestamp);
			const dateB = new Date(b.timestamp);

			// 比较两个时间，如果dateA早于dateB，则返回正值，反之返回负值
			// 为了让时间越晚的排在越前面，我们交换a和b的位置
			return dateB - dateA;
		}).map(e => {
            if (e.replies.length > 0) {
                e.hasChildren = true;
            }
            return e;
        })
		onLoading.value = false;
	} catch (err) {
        ElMessage.success('获取留言失败', err);
		onLoading.value = false;
	}}

// 获取最新兑换码信息
let getCodeList = async (props = {}) => {
	onLoading.value = true;
	getSummonerCode(props)
		.then((res) => {
			let { createTime, list } = res;
			let curList = list.map((e) => {
				e.coupon = e.coupon.toLowerCase();
				return e;
			});
			localStorage.setItem('codeInfo', JSON.stringify(res));
			codeList.value = curList || [];
			stashTime.value = createTime;
		})
		.catch((err) => {
            ElMessage.success('获取数据时出错', err);
			let codeInfo = JSON.parse(localStorage.getItem('codeInfo')) || {};
			stashTime.value = codeInfo.createTime;
			codeList.value = codeInfo.list || [];
		})
		.finally(() => {
			onLoading.value = false;
		});
};

const handleClick = (tab, event) => {
    setTimeout(() => {
        initList();
    }, 0);
};

const showUpdateCouponDialogFlag = ref(false);
const couponDetail = ref({});
const updateCouponContent = (row) => {
    couponDetail.value = row;
    showUpdateCouponDialogFlag.value = true;
}
const updateCouponSuccess = () => {
    showUpdateCouponDialogFlag.value = false;
    getCodeList();
}
const updateStatus = (row) => {
	let { coupon, content, status } = row;
	status = status == 'verified' ? 'expired' : 'verified';
    onLoading.value = true;
	updateSummonerCodeFn({ coupon, content, status })
		.then((res) => {
			ElMessage.success('更新成功');
			onLoading.value = false;
			getCodeList();
		})
		.catch((error) => {
			onLoading.value = false;
			ElMessage.error(error);
		});
};

// 回复内容
const showReplyDialogFlag = ref(false);
const replayDetail = ref({});
const replyMessage = (row) => {
    replayDetail.value = row;
    showReplyDialogFlag.value = true;
}
const replySuccess = () => {
    showReplyDialogFlag.value = false;
    initMessageList();
}

// 修改内容
const showUpdateDialogFlag = ref(false);
const messageDetail = ref({});
const updateContent = (row) => {
	messageDetail.value = row;
    showUpdateDialogFlag.value = true;
};
const updateSuccess = () => {
    showUpdateDialogFlag.value = false;
    initMessageList();
}

const deleteMessage = (row) => {
    let request = row.replyId ? deleteReplyeFn : deleteMessageFn;
    request(row).then((res) => {
        if (res.success) {
            ElMessage.success('删除成功！')
            initMessageList();
        } else {
            ElMessage.error('删除失败！', err)
        }
    })
}

</script>

<style lang="less">
.summoner_action {
	background-color: #ffffff;
    .action_tabs {
        padding: 6px 24px 0;
        .el-tabs__header {
            margin-bottom: 0px;
        }
    }
	.el-table {
		.expired {
			color: red;
		}
		.verified {
			color: #3ec73e;
		}
        .el-table__cell {
            padding: 0;
        }
        .cell {
            .el-table__placeholder {
                display: none;
            }
            .el-table__expand-icon {
                display: none;
            }
        }
	}
}
</style>