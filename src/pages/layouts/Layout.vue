<template>
    <div class="layout-wrapper">
        <div class="layout-header">header</div>
        <div class="layout-content">
            <router-view></router-view>
        </div>
        <div class="layout-footer"></div>
    </div>
</template>

<script>
export default {
    name: "Layout",
    data() {
        return {}
    }
}
</script>

<style>
</style>