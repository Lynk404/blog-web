/** 图片上传通用限制，与后端 config.maxFileSize 保持一致 */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',')
export const IMAGE_MAX_SIZE = 2 * 1024 * 1024
export const IMAGE_MAX_SIZE_LABEL = '2 MB'
