export type TravelChatData =
  | { message: string; type: 'notice' }
  | { source: TravelSourceData; type: 'source' }
  | { step: TravelStepData; type: 'step' }

export interface TravelSourceData {
  city?: string
  excerpt?: string
  id: string
  title: string
}

export interface TravelStepData {
  id: string
  label: string
  status: 'completed' | 'failed' | 'running'
}
