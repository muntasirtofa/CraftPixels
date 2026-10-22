export function pixelDimensions(width, height, gridWidth) {
  return { width: gridWidth, height: Math.max(1, Math.round(gridWidth * height / width)) }
}

// Quantization step grows with intensity, reducing the number of distinct colors.
export function convertImage(image, gridWidth, intensity, background) {
  const { width, height } = pixelDimensions(image.naturalWidth, image.naturalHeight, gridWidth)
  const tiny = document.createElement('canvas')
  tiny.width = width
  tiny.height = height
  const ctx = tiny.getContext('2d', { willReadFrequently: true })
  ctx.clearRect(0, 0, width, height)
  if (background !== 'transparent') {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(image, 0, 0, width, height)
  const data = ctx.getImageData(0, 0, width, height)
  const step = 1 + Math.round((intensity / 100) * 63)
  for (let i = 0; i < data.data.length; i += 4) {
    if (data.data[i + 3] === 0) continue
    data.data[i] = Math.min(255, Math.round(data.data[i] / step) * step)
    data.data[i + 1] = Math.min(255, Math.round(data.data[i + 1] / step) * step)
    data.data[i + 2] = Math.min(255, Math.round(data.data[i + 2] / step) * step)
  }
  ctx.putImageData(data, 0, 0)
  return { canvas: tiny, width, height }
}

export function renderPixelPreview(source, canvas) {
  if (!canvas || !source) return
  const rect = canvas.getBoundingClientRect()
  const scale = Math.max(1, window.devicePixelRatio || 1)
  canvas.width = Math.round(rect.width * scale)
  canvas.height = Math.round(rect.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const ratio = source.width / source.height
  const fitWidth = Math.min(canvas.width, canvas.height * ratio)
  const fitHeight = fitWidth / ratio
  const x = (canvas.width - fitWidth) / 2
  const y = (canvas.height - fitHeight) / 2
  ctx.drawImage(source, x, y, fitWidth, fitHeight)
}
