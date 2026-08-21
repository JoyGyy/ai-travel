'use client'

import { useCallback, useEffect, useState } from 'react'

export interface ModelOption {
  /** 模型显示名称 */
  label: string
  /** 模型标识符 */
  value: string
  /** 是否可用 */
  available: boolean
  /** 是否为用户自定义模型 */
  custom?: boolean
}

const CUSTOM_MODELS_KEY = 'travel-custom-models'

/** 从 localStorage 读取用户自定义模型 */
function loadCustomModels(): ModelOption[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MODELS_KEY)
    return raw ? JSON.parse(raw) : []
  }
  catch {
    return []
  }
}

/** 保存用户自定义模型到 localStorage */
function saveCustomModels(models: ModelOption[]) {
  localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(models))
}

export function useModels() {
  const [models, setModels] = useState<ModelOption[]>([])
  const [loading, setLoading] = useState(true)

  // 获取内置模型可用性 + 加载自定义模型
  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/models')
      const data = await res.json()

      const builtIn: ModelOption[] = data.models.map((m: { available: boolean, model: string, name: string }) => ({
        available: m.available,
        label: m.name === 'siliconflow' ? '硅基流动' : 'DeepSeek',
        value: m.name,
      }))

      const custom = loadCustomModels()

      setModels([...builtIn, ...custom])
    }
    catch {
      // API 失败时仍加载自定义模型
      setModels(loadCustomModels())
    }
    finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  /** 添加自定义模型 */
  function addCustomModel(config: { apiKey: string, baseUrl: string, label: string, model: string }) {
    const value = `custom-${Date.now()}`
    const newModel: ModelOption = {
      available: true,
      custom: true,
      label: config.label,
      value,
    }

    // 存储完整配置（含 apiKey）到 localStorage
    const stored = loadCustomModels()
    stored.push(newModel)
    saveCustomModels(stored)

    // 同时存储详细配置用于 API 调用
    const configs = JSON.parse(localStorage.getItem('travel-custom-model-configs') || '{}')
    configs[value] = config
    localStorage.setItem('travel-custom-model-configs', JSON.stringify(configs))

    setModels(prev => [...prev, newModel])
    return value
  }

  /** 删除自定义模型 */
  function removeCustomModel(value: string) {
    const stored = loadCustomModels().filter(m => m.value !== value)
    saveCustomModels(stored)

    const configs = JSON.parse(localStorage.getItem('travel-custom-model-configs') || '{}')
    delete configs[value]
    localStorage.setItem('travel-custom-model-configs', JSON.stringify(configs))

    setModels(prev => prev.filter(m => m.value !== value))
  }

  /** 获取自定义模型的 API 配置 */
  function getCustomModelConfig(value: string) {
    const configs = JSON.parse(localStorage.getItem('travel-custom-model-configs') || '{}')
    return configs[value] || null
  }

  return {
    addCustomModel,
    getCustomModelConfig,
    loading,
    models,
    removeCustomModel,
  }
}
