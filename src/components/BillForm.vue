<template>
    <div class="bill-form">
        <el-row class="bill-row" v-for="(row, rndex) in formOption" :key="rndex">
            <el-col v-for="(item, index) in row" :key="index" :span="item.span || 6" :offset="item.offset || 0">
                <BillItem
                    class="bill-item"
                    :type="item.type"
                    :defaultValue="item.defaultValue"
                    :title="item.title"
                    :selectOption="item.selectOption"
                    :selecMap="item.selecMap"
                    :noTitle="item.noTitle || false"
                    :btnType="item.btnType"
                    :algin="item.algin"
                    :value="curFormData[item.dataIndex]"
                    @change="billItemChange"
                ></BillItem>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import BillItem from "@/components/BillItem.vue"
import { onMounted, ref } from "vue";

const props = defineProps({
    useSearchBtn: { type: Boolean, default: true },
    option: { type: Array, default: () => { return []; } },
    formData: { type: Object, default: () => { return {}; } },
});
const ROW_SPAN = 24;
const formOption = ref();
const curFormData = ref(props.formData);

console.log('curFormData--', curFormData);


onMounted(() => {
    init();
})

function init() {
    initFormProps();
}


/**
 * 对传入的配置进行row分组，并插入查询按钮（row的最右边）
 */
function initFormProps() {
    let momPropsOption = props.useSearchBtn ? [...(props.option),
        { title: '查询', dataIndex: 'search', type: 'button', span: 6, noTitle: true, btnType: 'primary', algin: 'right' }
    ] : props.option;
    let totalSpanValue = momPropsOption.reduce((acc, cur) => {
        return acc += (cur.span || 6);
    }, 0);
    let rowLength = Math.ceil(totalSpanValue / ROW_SPAN);
    let comOptionLit = [];

    for (let e = 0; e < rowLength; e ++) {
        comOptionLit[e] = [];
        let minSpanVal = e * ROW_SPAN;
        let maxSpanVal = (e + 1) * ROW_SPAN;
        let totalPropsSpanVal = 0;
        for (let i = 0; i < momPropsOption.length; i++) {
            let option = momPropsOption[i];
            totalPropsSpanVal += (option.span || 6);
            if (totalPropsSpanVal <= maxSpanVal && totalPropsSpanVal > minSpanVal) {
                comOptionLit[e].push(option);
            } else if (totalPropsSpanVal > maxSpanVal) {
                break;
            }
        }
        if (comOptionLit[e].map((c) => c.dataIndex).includes('search')) {
            let sumSpan = comOptionLit[e].reduce((acc, cur) => {
                return acc += (cur.span || 6);
            }, 0);
            if (sumSpan !== ROW_SPAN) {
                comOptionLit[e] = comOptionLit[e].map((e) => {
                    if (e.dataIndex === 'search') {
                        e.offset = ROW_SPAN - sumSpan;
                    }
                    return e;
                })
            }
        }
    }
    formOption.value = comOptionLit;
}

function billItemChange(e) {
    console.log('e---form', e);
}
</script>

<style scoped lang="less">
.bill-form {
    display: grid;
    padding: 20px 0;
    .bill-row {
        &:not(:last-child) {
            margin-bottom: 12px;
        }
        .bill-item {}
    }
}
</style>