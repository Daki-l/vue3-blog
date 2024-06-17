<template>
    <div class="article-wrapper readView">
        <div class="article-top">
            <BillForm :option="filetrOption" :formData="formData"></BillForm>
        </div>
        <div class="article-content">
            <ArticleCard
                v-for="(item, index) in articleList" :key="index"
                :card-info="item"
            ></ArticleCard>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { getArticleList } from '@/services/articleService';
import { onMounted } from 'vue';
import ArticleCard from "@/components/ArticleCard.vue"
import BillForm from "@/components/BillForm.vue"

const filetrOption = reactive([
    { title: '分类', dataIndex: 'category', type: 'select', selectOption: [] },
    { title: '标签', dataIndex: 'tag', type: 'select', selectOption: [] },
    { title: 'key1', dataIndex: 'key1',  type: 'input' },
    { title: 'key2', dataIndex: 'key2',  type: 'input' },
    { title: 'key3', dataIndex: 'key3',  type: 'input' },
    { title: 'key4', dataIndex: 'key4',  type: 'input' },
]);

const formData = ref({
    category: 'null', tag: 'null', key1: '', key2: '', key3: '', key4: ''
});

onMounted(() => {
    init();
});

function init () {
    inistFilterOption();
    initList();
}

function inistFilterOption() {
    let tagList = [
        { text: '全部', value: 'null' },
        { text: 'vue', value: 'vue' },
        { text: 'ts', value: 'ts' },
        { text: 'bug', value: 'bug' },
    ];
    let categoryList = [
        { text: '全部', value: 'null' },
        { text: '技术', value: '技术' },
        { text: '生活', value: '生活' },
    ];
    filetrOption[0].selectOption = tagList;
    filetrOption[1].selectOption = categoryList;
}

const articleList = ref([]);
function  initList() {
    getArticleList().then((res) => {
        let { list } = res;
        articleList.value = list;
	});
}
</script>
<style scoped>

</style>