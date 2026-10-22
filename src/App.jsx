import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, Check, ChevronDown, Download, ImagePlus, LockKeyhole, Mountain, RotateCcw, Upload, X } from 'lucide-react'
import { convertImage, pixelDimensions, renderPixelPreview } from './imageProcessing.js'

const RESOLUTIONS = [16, 32, 64, 128]
const BACKGROUNDS = [
  { key: 'transparent', label: 'Transparent', style: 'checker' },
  { key: '#ffffff', label: 'White', style: 'white' },
  { key: '#000000', label: 'Black', style: 'black' },
]

function Brand() {
  return <a className="brand" href="#top" aria-label="CraftPixels home"><span className="brand-mark"><i /><i /><i /><i /></span><span className="brand-name">Craft<span>Pixels</span></span></a>
}

function UploadArea({ onFile, error }) {
  const input = useRef(null)
  const [dragging, setDragging] = useState(false)
  const choose = () => input.current?.click()
  const accept = file => { if (file) onFile(file) }
  return <div className={`upload-zone ${dragging ? 'dragging' : ''}`} onClick={choose}
    onDragOver={e => { e.preventDefault(); setDragging(true) }}
    onDragLeave={() => setDragging(false)}
    onDrop={e => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]) }} role="button" tabIndex="0"
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose() } }} aria-label="Upload an image">
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => { accept(e.target.files[0]); e.target.value = '' }} />
    <div className="upload-icon"><Upload size={22} strokeWidth={1.8} /></div>
    <h2>Drop your image here</h2><p>or browse files from your device</p>
    <button className="button button-green" type="button" onClick={e => { e.stopPropagation(); choose() }}><ImagePlus size={17} /> Choose image</button>
    <span className="file-types">PNG <b>·</b> JPG <b>·</b> WEBP <b>·</b> MAX 20 MB</span>
    {error && <div className="error-message" role="alert">{error}</div>}
  </div>
}

function PreviewCard({ title, subtitle, imageUrl, pixelCanvas, background, dimensions, output }) {
  return <article className="preview-card">
    <div className="preview-head"><div><span className="eyebrow">{title}</span><span className="preview-subtitle">{subtitle}</span></div>
      <span className="dimension-pill">{dimensions}</span></div>
    <div className={`preview-stage checkerboard ${background === '#ffffff' ? 'stage-white' : background === '#000000' ? 'stage-black' : ''}`}>
      {output ? <canvas ref={node => renderPixelPreview(output.canvas, node)} className="pixel-canvas" aria-label="Pixel art preview" /> :
        <img src={imageUrl} alt="Original uploaded image" />}
    </div>
  </article>
}

function App() {
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [image, setImage] = useState(null)
  const [output, setOutput] = useState(null)
  const [resolution, setResolution] = useState(32)
  const [intensity, setIntensity] = useState(55)
  const [background, setBackground] = useState('transparent')
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState('')
  const [revision, setRevision] = useState(0)
  const sequence = useRef(0)

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  const onFile = useCallback(nextFile => {
    setError('')
    if (!nextFile.type.match(/^image\/(png|jpeg|webp)$/) || nextFile.size > 20 * 1024 * 1024) {
      setError(nextFile.size > 20 * 1024 * 1024 ? 'That image is over 20 MB. Try a smaller file.' : 'Please choose a PNG, JPG, or WebP image.')
      return
    }
    const nextUrl = URL.createObjectURL(nextFile)
    const nextImage = new Image()
    nextImage.onload = () => { setFile(nextFile); setUrl(nextUrl); setImage(nextImage); setOutput(null); setRevision(v => v + 1) }
    nextImage.onerror = () => { URL.revokeObjectURL(nextUrl); setError('We could not open that image. Try another file.') }
    nextImage.src = nextUrl
  }, [])

  useEffect(() => {
    if (!image) return
    const id = ++sequence.current
    setProcessing(true)
    const timer = window.setTimeout(() => {
      try {
        const result = convertImage(image, resolution, intensity, background)
        if (sequence.current === id) { setOutput(result); setProcessing(false) }
      } catch {
        if (sequence.current === id) { setProcessing(false); setError('This image could not be processed. Try a different image.') }
      }
    }, 50)
    return () => { window.clearTimeout(timer); sequence.current++ }
  }, [image, resolution, intensity, background, revision])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  const download = () => {
    if (!output || processing) return
    output.canvas.toBlob(blob => {
      if (!blob) { setError('Your PNG could not be created. Please try again.'); return }
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `craftpixels-${resolution}px.png`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      setToast('Your pixel art is ready to go!')
    }, 'image/png')
  }
  const reset = () => { setFile(null); setImage(null); setOutput(null); setUrl(''); setError('') }
  const dims = image ? pixelDimensions(image.naturalWidth, image.naturalHeight, resolution) : null

  return <div className="app-shell" id="top">
    <header className="topbar"><div className="topbar-inner"><Brand /><div className="topbar-right"><span className="local-badge"><span /> 100% FREE <b>·</b> LOCAL PROCESSING</span><a href="#how-it-works" className="how-link">How it works <ArrowRight size={14} /></a></div></div></header>
    <main>
      <section className="hero"><div className="hero-kicker"><span className="kicker-line" /> YOUR IMAGE, REIMAGINED <span className="kicker-line" /></div>
        <h1>Turn your world<br /><em>into pixels.</em></h1><p className="hero-copy">Give any image a blocky new life. Make pixel art in seconds,<br className="desktop-break" /> right here in your browser.</p>
      </section>
      <section className="workspace" aria-label="Pixel art converter">
        {!image ? <UploadArea onFile={onFile} error={error} /> : <>
          <div className="file-strip"><div className="file-info"><div className="file-icon"><ImagePlus size={17} /></div><div><strong>{file?.name}</strong><span>{image.naturalWidth} × {image.naturalHeight} px · {(file.size / 1024 / 1024).toFixed(2)} MB</span></div></div><button className="text-button" onClick={reset}><RotateCcw size={14} /> Replace image</button></div>
          <div className="previews"><PreviewCard title="01 / ORIGINAL" subtitle="Your source image" imageUrl={url} dimensions={`${image.naturalWidth} × ${image.naturalHeight}`} /><div className="preview-arrow"><ArrowRight size={17} /></div><PreviewCard title="02 / PIXEL ART" subtitle="Your new creation" pixelCanvas background={background} dimensions={`${dims.width} × ${dims.height} grid`} output={output} /></div>
          {error && <div className="error-message inline-error" role="alert">{error}</div>}
          <section className="controls-card" aria-label="Conversion settings">
            <div className="controls-heading"><div><span className="eyebrow">MAKE IT YOURS</span><h2>Fine-tune your pixels</h2></div><span className="live-indicator"><span /> LIVE PREVIEW</span></div>
            <div className="settings-grid">
              <fieldset className="setting-block"><legend>Pixel width <span>GRID SIZE</span></legend><div className="resolution-options">{RESOLUTIONS.map(value => <button key={value} className={`option-button ${resolution === value ? 'selected' : ''}`} aria-pressed={resolution === value} onClick={() => setResolution(value)}><strong>{value}</strong><small>px wide</small></button>)}</div><p className="setting-hint">Height adjusts to keep your image in proportion.</p></fieldset>
              <div className="setting-block intensity-block"><label htmlFor="intensity">Pixel intensity <span>COLOR SIMPLIFICATION</span></label><div className="range-value">{intensity}<small> / 100</small></div><input id="intensity" type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(Number(e.target.value))} style={{ '--range': `${intensity}%` }} /><div className="range-labels"><span>More detail</span><span>More blocky</span></div><p className="setting-hint">Higher intensity means fewer colors.</p></div>
              <fieldset className="setting-block background-block"><legend>Canvas background <span>PNG BACKGROUND</span></legend><div className="background-options">{BACKGROUNDS.map(option => <button className={`background-option ${background === option.key ? 'selected' : ''}`} key={option.key} aria-pressed={background === option.key} onClick={() => setBackground(option.key)}><span className={`swatch ${option.style}`} />{option.label}{background === option.key && <Check size={13} className="selected-check" />}</button>)}</div><p className="setting-hint">Transparent areas stay transparent in your PNG.</p></fieldset>
            </div>
            <div className="action-row"><span className="processing-note">{processing ? <><span className="spinner" /> Updating preview…</> : <><LockKeyhole size={13} /> Your image stays on this device</>}</span><div className="action-buttons"><button className="button button-quiet" onClick={() => setRevision(v => v + 1)} disabled={processing}><RotateCcw size={15} /> Convert image</button><button className="button button-green download-button" onClick={download} disabled={!output || processing}><Download size={16} /> Download PNG <span>↓</span></button></div></div>
          </section>
        </>}
      </section>
      {!image && <div className="privacy-line"><LockKeyhole size={13} /> Your images never leave your device. Everything happens right here.</div>}
      <section className="how-section" id="how-it-works"><div className="section-heading"><span className="eyebrow">THREE LITTLE STEPS</span><h2>From photo to pixel art</h2><p>No downloads. No design skills. Just your imagination.</p></div>
        <div className="steps"><article className="step-card"><span className="step-number">01</span><div className="step-icon"><Upload size={20} /></div><h3>Upload</h3><p>Pick any image from your device. We support PNG, JPG, and WebP.</p></article><div className="step-connector"><span /><ArrowRight size={15} /></div><article className="step-card"><span className="step-number">02</span><div className="step-icon"><ChevronDown size={20} /></div><h3>Customize</h3><p>Choose your grid size, dial in the colors, and pick a background.</p></article><div className="step-connector"><span /><ArrowRight size={15} /></div><article className="step-card"><span className="step-number">03</span><div className="step-icon"><Download size={20} /></div><h3>Download</h3><p>Save your crisp, custom pixel art as a transparent PNG.</p></article></div>
      </section>
    </main>
    <footer><Brand /><span>Made for little worlds and big ideas.</span><span className="footer-right">CRAFTED WITH <Mountain size={13} /> PIXELS</span></footer>
    {toast && <div className="toast" role="status"><span><Check size={14} /></span>{toast}<button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={14} /></button></div>}
  </div>
}

export default App
