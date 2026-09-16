describe('aI providers', () => {
  it('providers 模块可以被导入且导出模型获取函数', async () => {
    const providersModule = await import('./providers')
    expect(typeof providersModule.getTravelModel).toBe('function')
    expect(typeof providersModule.getFallbackTravelModel).toBe('function')
  })
})
