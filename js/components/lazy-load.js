;(function (global) {
  const ROOT_MARGIN = '50px'
  const THRESHOLD = 0.01

  let observer

  const onImageLoad = (imageElement, dataSrc, dataSrcset) => {
    if (dataSrc) {
      imageElement.src = dataSrc
    }
    if (dataSrcset) {
      imageElement.srcset = dataSrcset
    }
    imageElement.classList.add('loaded')
    imageElement.classList.remove('lazy')
    imageElement.removeAttribute('data-src')
    imageElement.removeAttribute('data-srcset')
  }

  const onImageError = (imageElement) => {
    imageElement.classList.add('error')
  }

  const loadImage = (imageElement) => {
    if (!imageElement) return
    const dataSrc = imageElement.getAttribute('data-src')
    const dataSrcset = imageElement.getAttribute('data-srcset')
    if (!dataSrc && !dataSrcset) return

    const tempImage = new Image()

    if (dataSrcset) {
      tempImage.srcset = dataSrcset
    }
    if (dataSrc) {
      tempImage.src = dataSrc
    } else {
      tempImage.src = imageElement.src || ''
    }

    tempImage.onload = () => onImageLoad(imageElement, dataSrc, dataSrcset)
    tempImage.onerror = () => onImageError(imageElement)
    imageElement.dataset.lazyLoaded = 'true'
  }

  const handleIntersection = (entries, observerInstance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const { target } = entry
      loadImage(target)
      observerInstance.unobserve(target)
    })
  }

  const createObserver = () => {
    if (!('IntersectionObserver' in window)) return null
    return new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: ROOT_MARGIN,
      threshold: THRESHOLD
    })
  }

  const getLazyImages = () =>
    Array.from(document.querySelectorAll('img[data-src], img[data-srcset], img.lazy'))
      .filter((img) => !img.dataset.lazyLoaded)

  const setupLazyLoad = () => {
    const images = getLazyImages()
    if (!images.length) return null
    observer = createObserver()
    if (!observer) return null
    images.forEach((image) => {
      observer.observe(image)
      image.dataset.lazyLoaded = 'true'
    })
    return observer
  }

  const loadAllImages = () => {
    const images = getLazyImages()
    images.forEach((image) => loadImage(image))
  }

  const initLazyLoad = () => {
    if ('IntersectionObserver' in window) {
      setupLazyLoad()
    } else {
      console.warn('IntersectionObserver not supported. Loading all images immediately.')
      loadAllImages()
    }
  }

  global.LazyLoad = {
    initLazyLoad
  }

  document.addEventListener('DOMContentLoaded', initLazyLoad)
})(window)
