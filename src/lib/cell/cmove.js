import { useUiStore } from '@/stores/ui'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

export const useCmove = (config) => {
  const ui = useUiStore()

  const Retour = computed(
    () => config.type === 'clickmove' 
  )

  const { gcodeColors } = storeToRefs(ui)
  console.log("useGcode")
  return { Retour, gcodeColors }
}
