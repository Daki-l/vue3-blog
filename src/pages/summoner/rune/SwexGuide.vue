<template>
	<div class="swex_guide">
		<p class="sg_intro">{{ t('guide.intro') }}</p>

		<el-alert type="warning" show-icon :closable="false" class="sg_alert">
			<template #title>{{ t('guide.limitTitle') }}</template>
			<div class="sg_limit">
				<span>{{ t('guide.limitDesc') }}</span>
				<ul>
					<li>{{ t('guide.optSteam') }}</li>
					<li>{{ t('guide.optIos') }}</li>
					<li>{{ t('guide.optOldAndroid') }}</li>
					<li>{{ t('guide.optEmu') }}</li>
				</ul>
			</div>
		</el-alert>

		<ol class="sg_steps">
			<li>
				<b>{{ t('guide.step1Title') }}</b>
				<p>{{ t('guide.step1a') }}<a :href="RELEASES" target="_blank" rel="noopener noreferrer">GitHub Releases</a>{{ t('guide.step1b') }}</p>
			</li>
			<li>
				<b>{{ t('guide.step2Title') }}</b>
				<p>{{ t('guide.step2') }}</p>
			</li>
			<li>
				<b>{{ t('guide.step3Title') }}</b>
				<div class="sg_sub">
					<b>{{ t('guide.steamTitle') }}</b>
					<ol>
						<li>{{ t('guide.steam1') }}</li>
						<li>{{ t('guide.steam2') }}</li>
						<li>{{ t('guide.steam3') }}</li>
					</ol>
				</div>
				<div class="sg_sub">
					<b>{{ t('guide.iosTitle') }}</b>
					<ol>
						<li>{{ t('guide.ios1') }}</li>
						<li>{{ t('guide.ios2') }}</li>
						<li>{{ t('guide.ios3') }}</li>
						<li>{{ t('guide.ios4') }}</li>
					</ol>
				</div>
				<div class="sg_sub">
					<b>{{ t('guide.emuTitle') }}</b>
					<p>{{ t('guide.emu') }}</p>
				</div>
			</li>
			<li>
				<b>{{ t('guide.step4Title') }}</b>
				<p>{{ t('guide.step4') }}</p>
			</li>
			<li>
				<b>{{ t('guide.step5Title') }}</b>
				<p>{{ t('guide.step5') }}</p>
			</li>
		</ol>

		<div class="sg_faq">
			<b>{{ t('guide.faqTitle') }}</b>
			<ul>
				<li>{{ t('guide.faq1') }}</li>
				<li>{{ t('guide.faq2') }}</li>
				<li>{{ t('guide.faq3') }}</li>
				<li>{{ t('guide.faq4') }}</li>
				<li>{{ t('guide.faq5') }}</li>
			</ul>
		</div>

		<p class="sg_note">
			{{ t('guide.note') }}
			<a :href="REPO" target="_blank" rel="noopener noreferrer">{{ t('guide.repo') }}</a>
		</p>
	</div>
</template>

<script setup>
/**
 * SWEX(Summoner's War Exporter) 生成指南。步骤与限制依据该项目 README 与软件内置 Help 页
 * (app/pages/Help.js)整理, 链接指向其 GitHub 仓库。
 */
import { t } from '@/common/i18n';

const REPO = 'https://github.com/xzandro/sw-exporter';
const RELEASES = `${REPO}/releases/latest`;
</script>

<style lang="less" scoped>
.swex_guide {
	max-width: 780px;
	margin: 0 auto;
	text-align: left;
	font-size: 14px;
	line-height: 1.75;
	color: #606266;

	.sg_intro { margin: 0 0 14px; }
	.sg_alert { margin-bottom: 18px; }
	.sg_limit {
		font-size: 13px;
		line-height: 1.7;
		ul { margin: 6px 0 0; padding-left: 18px; }
	}
	.sg_steps {
		margin: 0;
		padding-left: 22px;
		> li { margin-bottom: 14px; }
		p { margin: 4px 0 0; }
		a { color: #409eff; text-decoration: none; &:hover { text-decoration: underline; } }
	}
	.sg_sub {
		margin-top: 8px;
		padding: 8px 12px;
		background: #f7f8fa;
		border-left: 3px solid #dcdfe6;
		border-radius: 0 6px 6px 0;
		font-size: 13px;
		> b { color: #303133; }
		ol { margin: 4px 0 0; padding-left: 20px; }
		p { margin: 4px 0 0; }
	}
	.sg_faq {
		padding: 10px 14px;
		background: #f7f8fa;
		border-radius: 6px;
		font-size: 13px;
		> b { color: #303133; }
		ul { margin: 4px 0 0; padding-left: 18px; }
		li { margin-bottom: 2px; }
	}
	.sg_note { margin: 14px 0 0; font-size: 12px; color: #909399; }
}
</style>
