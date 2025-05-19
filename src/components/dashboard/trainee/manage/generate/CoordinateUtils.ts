export interface PercentageCoordinates {
  xPercent: number; // 0-100% of image width
  yPercent: number; // 0-100% of image height
  widthPercent: number; // Width as percentage of image width
  heightPercent: number; // Height as percentage of image height
}

export interface AbsoluteCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Convert absolute pixel coordinates to percentage-based coordinates
export const absoluteToPercentage = (
  coords: AbsoluteCoordinates,
  imageWidth: number,
  imageHeight: number,
): PercentageCoordinates => {
  return {
    xPercent: (coords.x / imageWidth) * 100,
    yPercent: (coords.y / imageHeight) * 100,
    widthPercent: (coords.width / imageWidth) * 100,
    heightPercent: (coords.height / imageHeight) * 100,
  };
};

// Convert percentage-based coordinates back to absolute pixel coordinates
export const percentageToAbsolute = (
  coords: PercentageCoordinates,
  imageWidth: number,
  imageHeight: number,
): AbsoluteCoordinates => {
  return {
    x: (coords.xPercent * imageWidth) / 100,
    y: (coords.yPercent * imageHeight) / 100,
    width: (coords.widthPercent * imageWidth) / 100,
    height: (coords.heightPercent * imageHeight) / 100,
  };
};

// Calculate rendered coordinates for display (with scaling)
export const calculateRenderedCoordinates = (
  coords: any,
  imageElement: HTMLImageElement,
): { left: number; top: number; width: number; height: number } => {
  // Check if the image is fully loaded
  if (!imageElement || !imageElement.complete || !imageElement.naturalWidth) {
    console.warn("Image not fully loaded for coordinate calculation");
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  // Get the rendered dimensions of the image
  const rect = imageElement.getBoundingClientRect();
  const renderedWidth = rect.width;
  const renderedHeight = rect.height;
  const naturalWidth = imageElement.naturalWidth;
  const naturalHeight = imageElement.naturalHeight;

  // Get container dimensions (important for centering offset calculations)
  const containerElement = imageElement.parentElement;
  let containerRect = containerElement?.getBoundingClientRect();

  // If no container found, use the image rect as fallback
  if (!containerRect) {
    containerRect = rect;
  }

  // Calculate the offset of the image within its container (for centering)
  const offsetX = rect.left - containerRect.left;
  const offsetY = rect.top - containerRect.top;

  // Auto-detect coordinate type and apply correct calculation
  if (coords.xPercent !== undefined && coords.yPercent !== undefined) {
    // Percentage-based coordinates
    return {
      left: (coords.xPercent * renderedWidth) / 100,
      top: (coords.yPercent * renderedHeight) / 100,
      width: (coords.widthPercent * renderedWidth) / 100,
      height: (coords.heightPercent * renderedHeight) / 100,
    };
  } else if (coords.x !== undefined && coords.y !== undefined) {
    // Absolute coordinates
    return {
      left: (coords.x / naturalWidth) * renderedWidth,
      top: (coords.y / naturalHeight) * renderedHeight,
      width: (coords.width / naturalWidth) * renderedWidth,
      height: (coords.height / naturalHeight) * renderedHeight,
    };
  }

  // Invalid coordinates
  console.warn("Invalid coordinates format", coords);
  return { left: 0, top: 0, width: 0, height: 0 };
};

// Helper function to determine if an image is fully loaded
export const isImageFullyLoaded = (img: HTMLImageElement): boolean => {
  return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
};

// Force a recalculation of image dimensions
export const forceImageRecalculation = (
  image: HTMLImageElement,
  callback: (
    width: number,
    height: number,
    scale: { width: number; height: number },
  ) => void,
) => {
  if (!image) return;

  requestAnimationFrame(() => {
    const rect = image.getBoundingClientRect();
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    if (naturalWidth > 0 && naturalHeight > 0) {
      const scaleFactors = {
        width: rect.width / naturalWidth,
        height: rect.height / naturalHeight,
      };

      callback(naturalWidth, naturalHeight, scaleFactors);
    }
  });
};

// Create a robust resize observer for image containers
export const createImageResizeObserver = (
  imageRef: React.RefObject<HTMLImageElement>,
  containerRef: React.RefObject<HTMLDivElement>,
  callback: (scales: { width: number; height: number }) => void,
) => {
  if (!imageRef.current || !containerRef.current) return null;

  const updateScales = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    if (isImageFullyLoaded(img)) {
      const rect = img.getBoundingClientRect();
      callback({
        width: rect.width / img.naturalWidth,
        height: rect.height / img.naturalHeight,
      });
    }
  };

  // Create the observer
  const observer = new ResizeObserver(updateScales);

  // Observe both elements
  observer.observe(containerRef.current);
  observer.observe(imageRef.current);

  // Also handle window resize events for good measure
  window.addEventListener("resize", updateScales);

  // Return a cleanup function
  return () => {
    observer.disconnect();
    window.removeEventListener("resize", updateScales);
  };
};
