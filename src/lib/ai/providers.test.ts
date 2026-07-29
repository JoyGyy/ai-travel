describe('AI providers', () => {
  it('providers 模块可以被导入', async () => {
    const module = await import('./providers')
    expect(typeof module.getTravelModel).toBe('function')
  })
})
