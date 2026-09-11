// =====================================================================
// @soul-blog/wc 统一入口
// =====================================================================
import './styles/theme.css'

// 注册所有 Web Components
import './components'
import { scheduleInitialVercountVisit } from './helpers/vercount'

scheduleInitialVercountVisit()

export * from './types'
export * from './helpers'
export { WcBase } from './helpers/wc-base'
