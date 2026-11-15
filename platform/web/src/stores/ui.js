import { defineStore } from 'pinia';

let seed = 0;

export const useUi = defineStore('ui', {
  state: () => ({ toasts: [] }),
  actions: {
    toast(message, kind = 'success', duration = 3200) {
      const id = ++seed;
      this.toasts.push({ id, message, kind });
      if (duration > 0) {
        setTimeout(() => this.dismiss(id), duration);
      }
      return id;
    },
    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },
  },
});
