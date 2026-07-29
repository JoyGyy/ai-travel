export interface TravelSourceData {
  id: string
  title: string
  city?: string
  excerpt?: string
}

export interface TravelStepData {
  id: string
  label: string
  status: 'running' | 'completed' | 'failed'
}

export type TravelChatData =
  | { type: 'source'; source: TravelSourceData }
  | { type: 'step'; step: TravelStepData }
  | { type: 'notice'; message: string }
