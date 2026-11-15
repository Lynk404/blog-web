// @kangc/v-md-editor 2.x 的子路径入口未提供类型声明，这里补充最小声明
declare module '@kangc/v-md-editor/lib/codemirror-editor' {
  import type { Component } from 'vue'
  const VMdEditor: Component & { use: (theme: unknown) => void }
  export default VMdEditor
}

declare module '@kangc/v-md-editor/lib/preview' {
  import type { Component } from 'vue'
  const VMdPreview: Component & { use: (theme: unknown) => void }
  export default VMdPreview
}

declare module '@kangc/v-md-editor/lib/theme/github.js' {
  const githubTheme: unknown
  export default githubTheme
}

declare module 'codemirror' {
  const CodeMirror: unknown
  export default CodeMirror
}
