<template>
    <div :class="['bill-item', noTitle ? 'no-title' : '']">
        <label class="bill-item-leabel" for="" v-if="!noTitle">{{ title }}:</label>
        <div :class="['bill-item-content', 'is-' + algin ]">
            <el-input
                class="item-value"
                v-if="type === 'input'"
                v-model="billVlaue"
                :placeholder="placeholder"
                @change="billItemChange"
            />
            <el-select
                v-else-if="type === 'select'"
                class="item-value" 
                v-model="billVlaue"
                :placeholder="placeholder"
                @change="billItemChange"
            >
                <el-option
                    v-for="item in selectOption"
                    :key="item[selectMap.key]"
                    :label="item[selectMap.value]"
                    :value="item[selectMap.key]"
                />
            </el-select>
            <el-button v-else-if="type === 'button'" :type="btnType || 'primary'">{{ title }}</el-button>
            <span class="item-value" v-else>{{ billVlaue }}</span>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
    type: { type: String, default: '' },
    title: { type: String, default: '' },
    placeholder: { type: String, default: '请选择' },
    defaultValue: [String, Array, Object, Number],
    selectOption: Array,
    selectMap: { type: Object, default: () => {return { key: "value", value: "text" };} },
    noTitle: { type: Boolean, default: false },
    btnType: String,
    algin: { type: String, default: 'left' },
    value: { type: [String, Object, Array, Number, Boolean], default: undefined }
});

const emit = defineEmits(['change', 'confirm']);

const billVlaue = ref();

watch(() => props.value, (newVal, oldVal) => {
    billVlaue.value = newVal;
}, { deep: true, immediate: false });

onMounted(() => {
    init();
})


function init() {
    initDefaultValue();
}

function initDefaultValue() {
    if (props.defaultValue !== undefined) {
        billVlaue.value = props.defaultValue;
    } else {
        billVlaue.value = props.value;
    }
}
function billItemChange(e) {
    console.log('e---item', e);
    emit('change', e);
}
</script>

<style scoped lang="less">
.bill-item {
    display: flex;
    align-items: center;
    .bill-item-leabel {
        width: 80px;
        text-align: right;
        margin-right: 12px;
        font-size: 14px;
    }
    .bill-item-content {
        width: calc(100% - 80px);
        &.is-left {
            text-align: left;
        }
        &.is-right {
            text-align: right;
        }
    }
    &.no-title {
        .bill-item-content {
            width: 100%;
        }
    }
}
</style>