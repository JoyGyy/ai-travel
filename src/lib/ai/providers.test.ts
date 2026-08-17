describe('aI providers', () => {
  it('providers 模块可以被导入', async () => {
    const providersModule = await import('./providers')
    expect(typeof providersModule.getTravelModel).toBe('function')
  })
})
