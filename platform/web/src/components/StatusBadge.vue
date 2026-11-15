<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

// 状态 → 语义徽章的统一映射（全站一致的"状态语言"，文案走 i18n 目录）
const KEYS = [
  'learning', 'completed', 'submitted', 'approved', 'rejected', 'issued', 'pending',
  'screening', 'written_test', 'interview', 'offer', 'hired',
  'available', 'claimed', 'locked', 'used', 'expired',
  'booked', 'finished', 'cancelled',
  'qualified', 'provincial', 'national', 'global', 'awarded', 'eliminated',
  'upcoming', 'ongoing', 'ended',
  'material_review', 'contract_signing', 'tier_evaluation',
  'active', 'registering', 'closed', 'registered', 'checked_in', 'attended',
  'draft', 'open',
];
const COLOR = {
  learning: 'blue', completed: 'green',
  submitted: 'blue', approved: 'green', rejected: 'amber', issued: 'green', pending: 'amber',
  screening: 'blue', written_test: 'blue', interview: 'blue', offer: 'green', hired: 'green',
  available: 'blue', claimed: 'green', locked: 'amber', used: 'gray', expired: 'gray',
  booked: 'blue', finished: 'green', cancelled: 'gray',
  qualified: 'green', provincial: 'green', national: 'green', global: 'green', awarded: 'green', eliminated: 'gray',
  upcoming: 'gray', ongoing: 'blue', ended: 'gray',
  material_review: 'blue', contract_signing: 'blue', tier_evaluation: 'blue',
  active: 'green', registering: 'green', closed: 'gray', registered: 'green', checked_in: 'green', attended: 'gray',
  draft: 'gray', open: 'green',
};

const props = defineProps({ status: { type: String, required: true } });
const { t, te } = useI18n();

const info = computed(() => {
  const key = KEYS.includes(props.status) ? `status.${props.status}` : null;
  return {
    label: key && te(key) ? t(key) : props.status,
    color: { gray: 'badge-gray', green: 'badge-green', amber: 'badge-amber', blue: 'badge-blue' }[COLOR[props.status] || 'gray'],
  };
});
</script>

<template>
  <span class="badge" :class="info.color"><span class="dot"></span>{{ info.label }}</span>
</template>
