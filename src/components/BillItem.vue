<template>
    <div class="bill-item">
        <label for="">{{ title }}</label>
        <div class="bill-item-content">
            <el-input class="item-value" v-if="type === 'input'" v-model="billVlaue" :placeholder="placeholder" />
            <el-select
                v-else-if="type === 'select'"
                class="item-value" 
                v-model="billVlaue"
                :placeholder="placeholder"
                size="large"
            >
                <el-option
                    v-for="item in selectOptions"
                    :key="item[selectMap.key]"
                    :label="item[selectMap.value]"
                    :value="item[selectMap.key]"
                />
            </el-select>
            <span class="item-value" v-else>{{ billVlaue }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
    type: { type: String, default: '' },
    title: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    defaultValue: [String, Array, Object, Number],
    selectOptions: Array<any>,
    selectMap: { type: Object, default: () => {return { key: "value", value: "text" };} },
});

watch(props, (newVal, oldVal) => {
    console.log('watch----props', newVal, oldVal)
})

watch(()=>props.selectOptions, (newVal, oldVal) => {
    console.log('watch----selectOptions', newVal, oldVal)
})

onMounted(() => {
    init();
    console.log('xxxx----', props)
})

const billVlaue:any = ref('');
const curSelectOptions = ref<any>(props.selectOptions);

function init() {
    initDefaultValue();
}

function initDefaultValue() {
    billVlaue.value = props.defaultValue;
}
</script>

<style scoped>

</style>