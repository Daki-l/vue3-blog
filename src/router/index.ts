import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/home/Home.vue';
import Article from '../pages/article/Article.vue';

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			redirect: '/home'
		},
		{
			path: '/home',
			name: 'home',
			component: Home
		},
		{
			path: '/article',
			name: 'article',
			component: Article
		}
	]
});

export default router;
