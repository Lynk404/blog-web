/*
 * Live2D 看板娘全局加载。
 * 来源：https://github.com/stevenjoezhang/live2d-widget
 * 选用 gcore.jsdelivr.net：fastly 节点会把模型资源重定向到 raw.githubusercontent.com，
 * 该域名在部分网络下不可达，会导致模型一直加载、看板娘不显示。
 * 本文件由 index.html 以 defer 引入，加载失败不影响应用本身。
 */
const live2dPath = 'https://gcore.jsdelivr.net/npm/live2d-widgets@1.0.1/dist/'

import(`${live2dPath}waifu-tips.js`)
  .then(() => {
    window.initWidget({
      waifuPath: `${live2dPath}waifu-tips.json`,
      cdnPath: 'https://gcore.jsdelivr.net/gh/fghrsh/live2d_api@1.0.1/',
      cubism2Path: `${live2dPath}live2d.min.js`,
      cubism5Path: 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
      tools: ['hitokoto', 'asteroids', 'switch-model', 'switch-texture', 'photo', 'info', 'quit'],
      drag: false,
    })
  })
  .catch((error) => {
    console.warn('[Live2D] 看板娘加载失败，不影响页面功能', error)
  })
