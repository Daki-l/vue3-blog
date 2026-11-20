import { t } from '@/common/i18n';
<template>
    <div class="layout-footer-wrapper">
        <div class="copyright-info">{{ t('footer.copyright') }}</div>
    </div>
</template>

<script setup>

</script>

<style scoped lang="less">
.layout-footer-wrapper {
    line-height: 28px;
    font-size: 14px;
    color: var(--grey-9);
    padding: 5px 0;
    background: var(--footer-bg);
    margin-top: 24px;
    .copyright-info {
        text-align: center;
    }
}
</style>