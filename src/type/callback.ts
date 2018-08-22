export type Callback<T = any> = T extends void ? CallbackUnary : (e: Error, data: T) => void
export type CallbackUnary = (e: Error) => void
