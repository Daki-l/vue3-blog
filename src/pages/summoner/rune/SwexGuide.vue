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
				<!-- 安装包直链: 缓存于本站 R2(国内可直连), GitHub 为源站备选 -->
				<div class="sg_dl">
					<div class="sg_dl_head">
						<span>{{ t('guide.dlTitle') }}</span>
						<span class="sg_dl_ver">v{{ VERSION }}</span>
					</div>
					<div v-for="f in DL_FILES" :key="f.labelKey" class="sg_dl_row">
						<span class="sg_dl_name">{{ t(f.labelKey) }}<i>{{ f.size }}</i></span>
						<span class="sg_dl_links">
							<a class="sg_dl_btn" :href="f.r2" :download="f.file">{{ t('guide.dlHere') }}</a>
							<a :href="f.gh" target="_blank" rel="noopener noreferrer">GitHub</a>
						</span>
					</div>
					<p class="sg_dl_note">{{ t('guide.dlNote') }}<a :href="RELEASES" target="_blank" rel="noopener noreferrer">GitHub Releases</a></p>
				</div>
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
/** 所缓存的 SWEX 版本(与 R2 对象一致); 更新时同步这里与 R2 文件 */
const VERSION = '1.1.0';
const R2_BASE = 'https://static.linow.us.kg/swex';
const GH_BASE = `https://github.com/Xzandro/sw-exporter/releases/download/v${VERSION}`;
const DL_FILES = [
	{ file: `Summoners-War-Exporter-Setup-${VERSION}-win.exe`, labelKey: 'guide.dlWinSetup', size: '≈110 MB' },
	{ file: `Summoners-War-Exporter-Portable-${VERSION}-win.exe`, labelKey: 'guide.dlWinPortable', size: '≈110 MB' },
	{ file: `Summoners-War-Exporter-${VERSION}-mac.dmg`, labelKey: 'guide.dlMac', size: '≈225 MB' }
].map((f) => ({ ...f, r2: `${R2_BASE}/${f.file}`, gh: `${GH_BASE}/${f.file}` }));
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
	.sg_dl {
		margin-top: 8px;
		border: 1px solid #ebeef5;
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 13px;
		.sg_dl_head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			font-weight: 600;
			color: #303133;
			margin-bottom: 4px;
			.sg_dl_ver { font-weight: 400; color: #909399; font-size: 12px; }
		}
		.sg_dl_row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;
			padding: 4px 0;
			.sg_dl_name {
				i { font-style: normal; color: #909399; margin-left: 8px; font-size: 12px; }
			}
			.sg_dl_links { display: inline-flex; align-items: center; gap: 12px; }
			.sg_dl_btn {
				background: #409eff;
				color: #fff;
				border-radius: 4px;
				padding: 2px 12px;
				&:hover { background: #66b1ff; text-decoration: none; }
			}
		}
		.sg_dl_note { margin: 6px 0 0; font-size: 12px; color: #909399; }
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
