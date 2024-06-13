<template>
    <div class="article-wrapper readView">
        <div class="article-top">
            <div class="search-wrapper">
                <BillItem
                    v-for="filter in filetrOption"
                    :key="filter.dataIndex"
                    :type="filter.type"
                    :defaultValue="filter.defaultValue"
                    :title="filter.title"
                    :selectOption="filter.selectOption"
                    :selecMap="filter.selecMap || ''"
                ></BillItem>
            </div>
        </div>
        <div class="article-content">
            <ArticleCard
                v-for="(item, index) in articleList" :key="index"
                :card-info="item"
            ></ArticleCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { getArticleList } from '@/services/articleService';
import { onMounted } from 'vue';
import ArticleCard from "@/components/ArticleCard.vue"
import BillItem from "@/components/BillItem.vue"

const filetrOption = reactive<any>([
    { title: '分类', dataIndex: 'category', defaultValue: '', type: 'select', selectOption: [] },
    { title: '标签', dataIndex: 'tag', defaultValue: '', type: 'select', selectOption: [] },
])

onMounted(() => {
    init();
});

function init () {
    inistFilterOption();
    initList();
}

function inistFilterOption() {
    let tagList = [
        { text: '全部', value: '' },
        { text: 'vue', value: 'vue' },
        { text: 'ts', value: 'ts' },
        { text: 'bug', value: 'bug' },
    ];
    let categoryList = [
        { text: '全部', value: '' },
        { text: '技术', value: '技术' },
        { text: '生活', value: '生活' },
    ];
    filetrOption[0].selectOption = tagList as any;
    filetrOption[1].selectOption = categoryList as any;

    console.log('inistFilterOption---', tagList as any);
    console.log('inistFilterOption---', filetrOption[0].selectOption);
    
}

const articleList = ref<Array<any>>([]);
interface requestType {
    list: any,
    total: number
}
function  initList() {
    getArticleList().then((res) => {
        let { list } = res as requestType;
        articleList.value = list;
	});
}
</script>
<style scoped>

</style>