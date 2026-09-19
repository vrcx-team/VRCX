<template>
    <SidebarGroup class="pt-0 pb-1"><SidebarGroupContent><SidebarMenu><SidebarMenuItem>
        <SidebarMenuButton :is-active="route.name === 'local-insights'" :tooltip="label" @click="router.push({ name: 'local-insights' })">
            <i class="ri-history-line inline-flex size-6 items-center justify-center text-lg" aria-hidden="true"></i><span class="group-data-[collapsible=icon]:hidden">{{ label }}</span>
        </SidebarMenuButton>
    </SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../../components/ui/sidebar';
import { en, zh } from './copy.mjs';
const { locale } = useI18n();
const route = useRoute();
const router = useRouter();
const label = computed(() => (String(locale.value).startsWith('zh') ? zh : en).title);
</script>
