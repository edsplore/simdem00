import {
  Add as AddIcon,
  ChatBubble as ChatBubbleIcon,
  CheckBox as CheckBoxIcon,
  Close as CloseIcon,
  Delete,
  Edit,
  Edit as EditIcon,
  Highlight as HighlightIcon,
  Lightbulb as LightbulbIcon,
  List as ListIcon,
  TextFields as TextFieldsIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Popover,
  Slider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface Masking {
  id: string;
  type: "masking";
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
    xPercent?: number;
    yPercent?: number;
    widthPercent?: number;
    heightPercent?: number;
  };
  settings?: {
    color: string;
    solid_mask: boolean;
    blur_mask: boolean;
  };
}

interface ColorOption {
  name: string;
  value: string;
}

interface MaskingPhiProps {
  imageUrl: string;
  onMaskingsChange?: (maskings: Masking[]) => void;
  maskings?: Masking[];
  onEditMasking?: (msk: Masking) => void;
  editingMasking?: Masking | null;
  onDeleteMasking?: (id: string, type: "masking") => void | undefined;
  containerWidth: number;
}

// Improved function to calculate rendered coordinates consistently across all components
const getScaledCoordinates = (
  coords: any,
  imageElement: HTMLImageElement | null,
): { left: number; top: number; width: number; height: number } | null => {
  if (!imageElement || !coords) return null;

  // Get the actual rendered position and dimensions of the image
  const rect = imageElement.getBoundingClientRect();

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

  // Use percentage-based coordinates if available
  if (coords.xPercent !== undefined) {
    return {
      left: (coords.xPercent * rect.width) / 100 + offsetX,
      top: (coords.yPercent * rect.height) / 100 + offsetY,
      width: (coords.widthPercent * rect.width) / 100,
      height: (coords.heightPercent * rect.height) / 100,
    };
  }

  // Otherwise use absolute coordinates with proper scaling
  if (coords.x !== undefined) {
    const naturalWidth = imageElement.naturalWidth || 1;
    const naturalHeight = imageElement.naturalHeight || 1;

    return {
      left: (coords.x / naturalWidth) * rect.width + offsetX,
      top: (coords.y / naturalHeight) * rect.height + offsetY,
      width: (coords.width / naturalWidth) * rect.width,
      height: (coords.height / naturalHeight) * rect.height,
    };
  }

  return null;
};

/**
 * Detects image type from binary data
 * @param data Binary string data
 * @returns Mime type string
 */
const detectImageType = (data: string): string => {
  // JPEG starts with FF D8 FF
  if (
    data.length >= 3 &&
    data.charCodeAt(0) === 0xff &&
    data.charCodeAt(1) === 0xd8 &&
    data.charCodeAt(2) === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG starts with 89 50 4E 47
  if (
    data.length >= 4 &&
    data.charCodeAt(0) === 0x89 &&
    data.charCodeAt(1) === 0x50 &&
    data.charCodeAt(2) === 0x4e &&
    data.charCodeAt(3) === 0x47
  ) {
    return "image/png";
  }

  // Default to JPEG if unknown (most likely JPEG)
  return "image/jpeg";
};

// Resize handle positions and cursor mapping
const resizeHandles = [
  { position: "top-left", cursor: "nwse-resize" },
  { position: "top-right", cursor: "nesw-resize" },
  { position: "bottom-left", cursor: "nesw-resize" },
  { position: "bottom-right", cursor: "nwse-resize" },
  { position: "top", cursor: "ns-resize" },
  { position: "right", cursor: "ew-resize" },
  { position: "bottom", cursor: "ns-resize" },
  { position: "left", cursor: "ew-resize" },
];

// Helper to get masking type icon
const getMaskingTypeIcon = (maskingType: string) => {
  switch (maskingType) {
    case "button":
      return <ChatBubbleIcon fontSize="small" />;
    case "highlight":
      return <HighlightIcon fontSize="small" />;
    case "dropdown":
      return <ListIcon fontSize="small" />;
    case "checkbox":
      return <CheckBoxIcon fontSize="small" />;
    case "textfield":
      return <TextFieldsIcon fontSize="small" />;
    case "coaching":
      return <LightbulbIcon fontSize="small" />;
    default:
      return <ChatBubbleIcon fontSize="small" />;
  }
};

// Helper to get readable type name
const getMaskingTypeName = (maskingType: string) => {
  switch (maskingType) {
    case "button":
      return "Button";
    case "highlight":
      return "Highlight";
    case "dropdown":
      return "Dropdown";
    case "checkbox":
      return "Checkbox";
    case "textfield":
      return "Text Field";
    case "coaching":
      return "Coaching Tip";
    default:
      return maskingType.charAt(0).toUpperCase() + maskingType.slice(1);
  }
};

const MaskingPhi: React.FC<MaskingPhiProps> = ({
  imageUrl,
  onMaskingsChange,
  maskings = [],
  onEditMasking,
  editingMasking,
  onDeleteMasking,
  containerWidth,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentMasking, setCurrentMasking] = useState<Partial<Masking> | null>(
    null,
  );
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dialogPosition, setDialogPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageScale, setImageScale] = useState({ width: 1, height: 1 });
  const [editMode, setEditMode] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [originalImageSize, setOriginalImageSize] = useState({
    width: 0,
    height: 0,
  });
  const [imageError, setImageError] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null,
  );
  const [value, setValue] = React.useState("Solid");
  const [prevMasking, setPrevMasking] = useState<Masking | null>(null);

  // Add state for moving maskings
  const [movingMasking, setMovingMasking] = useState<string | null>(null);
  const [moveStart, setMoveStart] = useState({ x: 0, y: 0 });

  // Add state for resizing maskings
  const [resizingMasking, setResizingMasking] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [resizeOriginal, setResizeOriginal] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    xPercent?: number;
    yPercent?: number;
    widthPercent?: number;
    heightPercent?: number;
  } | null>(null);

  // Add hover state for showing masking type tooltip
  const [hoveredMasking, setHoveredMasking] = useState<string | null>(null);

  const commonColors: ColorOption[] = [
    { name: "Blue", value: "#1976D2" },
    { name: "Green", value: "#2E7D32" },
    { name: "Red", value: "#D32F2F" },
    { name: "Purple", value: "#7B1FA2" },
    { name: "Orange", value: "#ED6C02" },
    { name: "Gray", value: "#757575" },
    { name: "Black", value: "#000000" },
    { name: "White", value: "#FFFFFF" },
  ];

  // Reference to the actual image element
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // For RGBA color picker
  const [colorPickerAnchorEl, setColorPickerAnchorEl] =
    useState<HTMLElement | null>(null);
  // Convert RGBA components to string

  // Process image URL using the EXACT same method from VisualAudioPreview
  const processImageData = useCallback(() => {
    if (!imageUrl) {
      console.error("No image URL provided");
      setImageError("No image data available");
      return;
    }

    try {
      // Skip URL processing for standard URLs
      if (
        imageUrl.startsWith("http") ||
        imageUrl.startsWith("blob:") ||
        imageUrl.startsWith("/api/")
      ) {
        setProcessedImageUrl(imageUrl);
        return;
      }

      // Skip processing for data URLs
      if (imageUrl.startsWith("data:")) {
        setProcessedImageUrl(imageUrl);
        return;
      }

      // Process binary data similar to VisualAudioPreview
      try {
        // Attempt to decode as base64
        try {
          const decoded = atob(imageUrl);
          // If successful and we get a URL, use it directly
          if (decoded.startsWith("http") || decoded.startsWith("blob:")) {
            setProcessedImageUrl(decoded);
            return;
          }
        } catch (e) {
          // Not base64, will process as binary
        }

        // Direct binary processing - EXACTLY as in VisualAudioPreview
        const binaryString = imageUrl;
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create blob from Uint8Array
        const mimeType = detectImageType(binaryString);
        const blob = new Blob([bytes], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        setProcessedImageUrl(blobUrl);
        console.log("Created blob URL from binary data:", blobUrl);
      } catch (e) {
        console.error("Failed to process image data:", e);
        setImageError("Failed to process image data");
      }
    } catch (e) {
      console.error("Error processing image:", e);
      setImageError("Error processing image data");
    }
  }, [imageUrl]);

  const handleCloseColorPicker = () => {
    setColorPickerAnchorEl(null);
  };
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  // Process image data when imageUrl changes
  useEffect(() => {
    setImageError(null);
    processImageData();
  }, [imageUrl, processImageData]);

  // Track original image size
  useEffect(() => {
    if (processedImageUrl) {
      const img = new Image();
      img.onload = () => {
        setOriginalImageSize({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        setImageError(null);
      };
      img.onerror = (e) => {
        console.error("Error loading image:", e);
        setImageError("Failed to load image");
      };
      img.src = processedImageUrl;
    }
  }, [processedImageUrl]);

  // Track viewport size
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  // Track image size and scale changes - crucial for accurate masking positioning
  useEffect(() => {
    if (!containerRef.current) return;

    const updateImageSizeAndScale = () => {
      if (containerRef.current && imageElementRef.current) {
        const img = imageElementRef.current;
        if (img) {
          // Get the actual rendered dimensions
          const rect = img.getBoundingClientRect();

          // Store current rendered dimensions
          setImageSize({
            width: rect.width,
            height: rect.height,
          });

          // Calculate scales based on original image dimensions
          if (originalImageSize.width > 0 && originalImageSize.height > 0) {
            const widthScale = rect.width / originalImageSize.width;
            const heightScale = rect.height / originalImageSize.height;

            setImageScale({
              width: widthScale,
              height: heightScale,
            });

            console.log(
              `Image scales updated - width: ${widthScale}, height: ${heightScale}`,
            );
          }
        }
      }
    };

    // Initial update
    updateImageSizeAndScale();

    // Create observer to track container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateImageSizeAndScale();
    });

    // Observe both the container and the window
    resizeObserver.observe(containerRef.current);

    // Also handle window resize events
    window.addEventListener("resize", updateImageSizeAndScale);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateImageSizeAndScale);
    };
  }, [containerRef, originalImageSize, containerWidth, processedImageUrl]);

  // Update maskings when editing masking changes
  useEffect(() => {
    if (editingMasking) {
      setEditingId(editingMasking.id);
      setEditMode(true);
      setCurrentMasking(editingMasking);
      setShowSettings(true);
      calculateDialogPosition(editingMasking);
    }
  }, [editingMasking]);

  // Add effect for handling global mouse events during masking moving
  useEffect(() => {
    if (movingMasking) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMoveMasking(e as unknown as React.MouseEvent);
      };

      const handleGlobalMouseUp = () => {
        handleEndMove();
      };

      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        window.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [movingMasking]);

  // Add effect for handling global mouse events during masking resizing
  useEffect(() => {
    if (resizingMasking) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleResizeMasking(e as unknown as React.MouseEvent);
      };

      const handleGlobalMouseUp = () => {
        handleEndResize();
      };

      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        window.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [resizingMasking]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !imageElementRef.current) return;

    const img = imageElementRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate offset of the image within its container
    const offsetX = rect.left - containerRect.left;
    const offsetY = rect.top - containerRect.top;

    // Store coordinates relative to the image's actual position and size
    const x = ((e.clientX - rect.left) / rect.width) * originalImageSize.width;
    const y = ((e.clientY - rect.top) / rect.height) * originalImageSize.height;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current || !imageElementRef.current) return;

    const img = imageElementRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate offset of the image within its container
    const offsetX = rect.left - containerRect.left;
    const offsetY = rect.top - containerRect.top;

    // Get the current mouse position relative to the image
    const x = ((e.clientX - rect.left) / rect.width) * originalImageSize.width;
    const y = ((e.clientY - rect.top) / rect.height) * originalImageSize.height;

    // Calculate both absolute and percentage coordinates
    const coordinates = {
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    };

    // Calculate percentage coordinates based on original image size
    const xPercent = (coordinates.x / originalImageSize.width) * 100;
    const yPercent = (coordinates.y / originalImageSize.height) * 100;
    const widthPercent = (coordinates.width / originalImageSize.width) * 100;
    const heightPercent = (coordinates.height / originalImageSize.height) * 100;

    setCurrentMasking({
      coordinates: {
        ...coordinates,
        xPercent,
        yPercent,
        widthPercent,
        heightPercent,
      },
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentMasking || !currentMasking.coordinates) return;
    setIsDrawing(false);

    // Only calculate dialog position and show settings if the rectangle has some size
    if (
      currentMasking.coordinates &&
      (currentMasking.coordinates.width > 5 ||
        currentMasking.coordinates.height > 5)
    ) {
      calculateDialogPosition(currentMasking);
      setShowSettings(true);
    }
  };

  // Start moving a masking
  const handleStartMove = (e: React.MouseEvent, maskingId: string) => {
    e.stopPropagation();
    if (!imageElementRef.current) return;

    // Find the masking
    const masking = maskings.find((h) => h.id === maskingId);
    if (!masking || !masking.coordinates) return;

    setPrevMasking({ ...masking });

    // Get rendered coordinates using our improved function
    const renderedCoords = getScaledCoordinates(
      masking.coordinates,
      imageElementRef.current,
    );

    if (!renderedCoords) return;

    const rect = imageElementRef.current.getBoundingClientRect();

    // Store start position relative to the mouse position
    setMoveStart({
      x: e.clientX - rect.left - renderedCoords.left,
      y: e.clientY - rect.top - renderedCoords.top,
    });

    setMovingMasking(maskingId);
  };

  // Handle mouse movement during the move
  const handleMoveMasking = (e: React.MouseEvent) => {
    if (!movingMasking || !imageElementRef.current) return;

    const masking = maskings.find((h) => h.id === movingMasking);
    if (!masking || !masking.coordinates) return;

    const img = imageElementRef.current;
    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate offset of image within container
    const offsetX = rect.left - containerRect.left;
    const offsetY = rect.top - containerRect.top;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Calculate new position in percentage of the image, accounting for offset
    const newXPercent = Math.max(
      0,
      Math.min(
        ((e.clientX - moveStart.x - rect.left) / rect.width) * 100,
        100 -
          (masking.coordinates.xPercent !== undefined
            ? masking.coordinates.xPercent
            : (masking.coordinates.width / naturalWidth) * 100),
      ),
    );

    const newYPercent = Math.max(
      0,
      Math.min(
        ((e.clientY - moveStart.y - rect.top) / rect.height) * 100,
        100 -
          (masking.coordinates.yPercent !== undefined
            ? masking.coordinates.yPercent
            : (masking.coordinates.height / naturalHeight) * 100),
      ),
    );

    // Calculate new absolute coordinates from percentages
    const newX = (newXPercent * naturalWidth) / 100;
    const newY = (newYPercent * naturalHeight) / 100;

    // Get the width and height (either from percentage or absolute coordinates)
    const widthPercent =
      masking.coordinates.widthPercent ||
      (masking.coordinates.width / naturalWidth) * 100;
    const heightPercent =
      masking.coordinates.heightPercent ||
      (masking.coordinates.height / naturalHeight) * 100;
    const width = (widthPercent * naturalWidth) / 100;
    const height = (heightPercent * naturalHeight) / 100;

    // Update all maskings with the moved one
    const updatedMaskings = maskings.map((h) => {
      if (h.id === movingMasking) {
        return {
          ...h,
          coordinates: {
            x: newX,
            y: newY,
            width,
            height,
            xPercent: newXPercent,
            yPercent: newYPercent,
            widthPercent,
            heightPercent,
          },
        };
      }
      return h;
    });

    // Update parent with the new positions
    onMaskingsChange?.(updatedMaskings);
  };

  // End the move operation
  const handleEndMove = () => {
    setMovingMasking(null);
  };

  // Start resizing a masking
  const handleStartResize = (
    e: React.MouseEvent,
    maskingId: string,
    handle: string,
  ) => {
    e.stopPropagation();
    if (!imageElementRef.current) return;

    // Find the masking
    const masking = maskings.find((h) => h.id === maskingId);
    if (!masking || !masking.coordinates) return;
    setPrevMasking({ ...masking });

    // Store starting mouse position
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
    });

    // Store both absolute and percentage coordinates
    const originalCoords: {
      x: number;
      y: number;
      width: number;
      height: number;
      xPercent?: number;
      yPercent?: number;
      widthPercent?: number;
      heightPercent?: number;
    } = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };

    // First set absolute coordinates
    if (masking.coordinates) {
      originalCoords.x = masking.coordinates.x;
      originalCoords.y = masking.coordinates.y;
      originalCoords.width = masking.coordinates.width;
      originalCoords.height = masking.coordinates.height;
    }

    // Then set percentage coordinates
    if (masking.coordinates.xPercent !== undefined) {
      originalCoords.xPercent = masking.coordinates.xPercent;
      originalCoords.yPercent = masking.coordinates.yPercent;
      originalCoords.widthPercent = masking.coordinates.widthPercent;
      originalCoords.heightPercent = masking.coordinates.heightPercent;
    }
    // Or calculate percentage coordinates from absolute
    else if (masking.coordinates && imageElementRef.current) {
      const naturalWidth = imageElementRef.current.naturalWidth;
      const naturalHeight = imageElementRef.current.naturalHeight;
      originalCoords.xPercent = (masking.coordinates.x / naturalWidth) * 100;
      originalCoords.yPercent = (masking.coordinates.y / naturalHeight) * 100;
      originalCoords.widthPercent =
        (masking.coordinates.width / naturalWidth) * 100;
      originalCoords.heightPercent =
        (masking.coordinates.height / naturalHeight) * 100;
    }

    setResizeOriginal(originalCoords);
    setResizingMasking(maskingId);
    setResizeHandle(handle);
  };

  // Handle resize masking - updated for percentage coordinates
  const handleResizeMasking = (e: React.MouseEvent) => {
    if (
      !resizingMasking ||
      !imageElementRef.current ||
      !resizeHandle ||
      !resizeOriginal
    )
      return;

    const masking = maskings.find((h) => h.id === resizingMasking);
    if (!masking || !masking.coordinates) return;

    const img = imageElementRef.current;
    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate offset of image within container
    const offsetX = rect.left - containerRect.left;
    const offsetY = rect.top - containerRect.top;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Calculate mouse movement in percentage of the image
    const deltaXPercent = ((e.clientX - resizeStart.x) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - resizeStart.y) / rect.height) * 100;

    // Use percentage coordinates from resizeOriginal if available
    if (
      !resizeOriginal.xPercent ||
      !resizeOriginal.yPercent ||
      !resizeOriginal.widthPercent ||
      !resizeOriginal.heightPercent
    ) {
      return;
    }

    // Initialize new percentage coordinates
    let newXPercent = resizeOriginal.xPercent;
    let newYPercent = resizeOriginal.yPercent;
    let newWidthPercent = resizeOriginal.widthPercent;
    let newHeightPercent = resizeOriginal.heightPercent;

    // Update coordinates based on which handle is being dragged
    switch (resizeHandle) {
      case "top-left":
        newXPercent = Math.min(
          resizeOriginal.xPercent + resizeOriginal.widthPercent - 0.5,
          Math.max(0, resizeOriginal.xPercent + deltaXPercent),
        );
        newYPercent = Math.min(
          resizeOriginal.yPercent + resizeOriginal.heightPercent - 0.5,
          Math.max(0, resizeOriginal.yPercent + deltaYPercent),
        );
        newWidthPercent =
          resizeOriginal.widthPercent - (newXPercent - resizeOriginal.xPercent);
        newHeightPercent =
          resizeOriginal.heightPercent -
          (newYPercent - resizeOriginal.yPercent);
        break;
      case "top-right":
        newYPercent = Math.min(
          resizeOriginal.yPercent + resizeOriginal.heightPercent - 0.5,
          Math.max(0, resizeOriginal.yPercent + deltaYPercent),
        );
        newWidthPercent = Math.max(
          0.5,
          resizeOriginal.widthPercent + deltaXPercent,
        );
        newWidthPercent = Math.min(newWidthPercent, 100 - newXPercent);
        newHeightPercent =
          resizeOriginal.heightPercent -
          (newYPercent - resizeOriginal.yPercent);
        break;
      case "bottom-left":
        newXPercent = Math.min(
          resizeOriginal.xPercent + resizeOriginal.widthPercent - 0.5,
          Math.max(0, resizeOriginal.xPercent + deltaXPercent),
        );
        newWidthPercent =
          resizeOriginal.widthPercent - (newXPercent - resizeOriginal.xPercent);
        newHeightPercent = Math.max(
          0.5,
          resizeOriginal.heightPercent + deltaYPercent,
        );
        newHeightPercent = Math.min(newHeightPercent, 100 - newYPercent);
        break;
      case "bottom-right":
        newWidthPercent = Math.max(
          0.5,
          resizeOriginal.widthPercent + deltaXPercent,
        );
        newHeightPercent = Math.max(
          0.5,
          resizeOriginal.heightPercent + deltaYPercent,
        );
        newWidthPercent = Math.min(newWidthPercent, 100 - newXPercent);
        newHeightPercent = Math.min(newHeightPercent, 100 - newYPercent);
        break;
      case "top":
        newYPercent = Math.min(
          resizeOriginal.yPercent + resizeOriginal.heightPercent - 0.5,
          Math.max(0, resizeOriginal.yPercent + deltaYPercent),
        );
        newHeightPercent =
          resizeOriginal.heightPercent -
          (newYPercent - resizeOriginal.yPercent);
        break;
      case "right":
        newWidthPercent = Math.max(
          0.5,
          resizeOriginal.widthPercent + deltaXPercent,
        );
        newWidthPercent = Math.min(newWidthPercent, 100 - newXPercent);
        break;
      case "bottom":
        newHeightPercent = Math.max(
          0.5,
          resizeOriginal.heightPercent + deltaYPercent,
        );
        newHeightPercent = Math.min(newHeightPercent, 100 - newYPercent);
        break;
      case "left":
        newXPercent = Math.min(
          resizeOriginal.xPercent + resizeOriginal.widthPercent - 0.5,
          Math.max(0, resizeOriginal.xPercent + deltaXPercent),
        );
        newWidthPercent =
          resizeOriginal.widthPercent - (newXPercent - resizeOriginal.xPercent);
        break;
    }

    // Calculate absolute coordinates from percentages
    const newX = (newXPercent * naturalWidth) / 100;
    const newY = (newYPercent * naturalHeight) / 100;
    const newWidth = (newWidthPercent * naturalWidth) / 100;
    const newHeight = (newHeightPercent * naturalHeight) / 100;

    // Update all maskings with the resized one
    const updatedMaskings = maskings.map((h) => {
      if (h.id === resizingMasking) {
        return {
          ...h,
          coordinates: {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
            xPercent: newXPercent,
            yPercent: newYPercent,
            widthPercent: newWidthPercent,
            heightPercent: newHeightPercent,
          },
        };
      }
      return h;
    });

    // Update parent with the new positions
    onMaskingsChange?.(updatedMaskings);

    // If this is also the currently editing masking, update currentMasking state too
    if (editingMasking && editingMasking.id === resizingMasking) {
      setCurrentMasking((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          coordinates: {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
            xPercent: newXPercent,
            yPercent: newYPercent,
            widthPercent: newWidthPercent,
            heightPercent: newHeightPercent,
          },
        };
      });
    }
  };

  // End the resize operation
  const handleEndResize = () => {
    setResizingMasking(null);
    setResizeHandle(null);
    setResizeOriginal(null);
  };

  // Improved calculateDialogPosition function
  const calculateDialogPosition = (masking: Partial<Masking>) => {
    if (
      !containerRef.current ||
      !masking ||
      !masking.coordinates ||
      !imageElementRef.current
    )
      return;

    const img = imageElementRef.current;
    if (!img) return;

    const imgRect = img.getBoundingClientRect();
    const dialogHeight = 480; // Reduced fixed dialog height
    const dialogWidth = 320; // Fixed dialog width
    const padding = 16; // Padding from edges

    // Use our improved scaled coordinates function for consistency
    const renderedCoords = getScaledCoordinates(masking.coordinates, img);
    if (!renderedCoords) return;

    // Get accurate viewport dimensions
    const viewportWidth = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0,
    );
    const viewportHeight = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0,
    );

    // Find the main content element (nearest scrollable container)
    const findScrollContainer = (element: HTMLElement | null): HTMLElement => {
      if (!element) return document.body;

      // Check if this element or any parent is scrollable
      const isScrollable = (el: HTMLElement) => {
        const style = window.getComputedStyle(el);
        const overflowY = style.getPropertyValue("overflow-y");
        return (
          (overflowY === "auto" || overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight
        );
      };

      if (isScrollable(element)) return element;

      // Check parent
      if (element.parentElement) {
        return findScrollContainer(element.parentElement);
      }

      // Default to body
      return document.body;
    };

    const scrollContainer = findScrollContainer(containerRef.current);
    const scrollRect = scrollContainer.getBoundingClientRect();

    // Use the constraints of both the viewport and the scroll container
    const effectiveRight = Math.min(viewportWidth, scrollRect.right);
    const effectiveBottom = Math.min(viewportHeight, scrollRect.bottom);

    // Calculate absolute position including the image offset
    const maskingLeft = imgRect.left + renderedCoords.left;
    const maskingTop = imgRect.top + renderedCoords.top;
    const maskingRight = maskingLeft + renderedCoords.width;
    const maskingBottom = maskingTop + renderedCoords.height;

    // Calculate optimal position based on available space
    // Check if there's enough space to the right
    const rightSpace = effectiveRight - maskingRight;
    const leftSpace = maskingLeft - scrollRect.left;

    // Determine optimal horizontal position
    let left;
    if (rightSpace >= dialogWidth + padding) {
      // Position to the right of the masking
      left = maskingRight + padding;
    } else if (leftSpace >= dialogWidth + padding) {
      // Position to the left of the masking
      left = maskingLeft - dialogWidth - padding;
    } else {
      // Center it if neither side has enough space
      // But ensure it doesn't go outside boundaries
      left = Math.max(
        padding + scrollRect.left,
        Math.min(
          maskingLeft + renderedCoords.width / 2 - dialogWidth / 2,
          effectiveRight - dialogWidth - padding,
        ),
      );
    }

    // Get the distance from the top of the viewport to determine vertical space
    const topSpace = maskingTop - scrollRect.top;
    const bottomSpace = effectiveBottom - maskingBottom;

    // Determine optimal vertical position
    let top;
    if (
      dialogHeight <=
      Math.min(viewportHeight - 2 * padding, scrollContainer.clientHeight)
    ) {
      // Dialog can fit in viewport height
      if (topSpace >= dialogHeight / 2 && bottomSpace >= dialogHeight / 2) {
        // Center it vertically relative to the masking
        top = maskingTop + renderedCoords.height / 2 - dialogHeight / 2;
      } else if (bottomSpace >= dialogHeight) {
        // Position below the masking
        top = maskingBottom + padding;
      } else if (topSpace >= dialogHeight) {
        // Position above the masking
        top = maskingTop - dialogHeight - padding;
      } else {
        // Place it as high as possible while keeping it visible
        top = Math.max(
          scrollRect.top + padding,
          Math.min(
            maskingTop - dialogHeight / 2,
            effectiveBottom - dialogHeight - padding,
          ),
        );
      }
    } else {
      // Dialog is taller than viewport - position at top with minimum padding
      top = scrollRect.top + padding;
    }

    // Final boundary check
    left = Math.max(
      scrollRect.left + padding,
      Math.min(left, effectiveRight - dialogWidth - padding),
    );
    top = Math.max(
      scrollRect.top + padding,
      Math.min(top, effectiveBottom - dialogHeight - padding),
    );

    setDialogPosition({ top, left });
  };

  // Also add this effect to recalculate positions when the container changes
  useEffect(() => {
    const mainContentElement =
      containerRef.current?.closest('[role="main"]') ||
      containerRef.current?.closest("main") ||
      containerRef.current?.parentElement;

    if (mainContentElement) {
      const resizeObserver = new ResizeObserver(() => {
        if (currentMasking && showSettings) {
          calculateDialogPosition(currentMasking);
        }
      });

      resizeObserver.observe(mainContentElement);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [showSettings, currentMasking]);

  const handleSettingsSave = (settings: Partial<Masking>) => {
    // Ensure currentMasking and coordinates exist
    if (!currentMasking || !currentMasking.coordinates) {
      console.error(
        "Cannot save masking - missing coordinates:",
        currentMasking,
      );
      return;
    }

    const id = editMode ? editingId : Date.now().toString();

    // Common settings for all masking types
    const commonSettings = {
      color: settings.settings?.color || "#ffc107", // Default highlight color
      solid_mask: settings.settings?.solid_mask || value === "Solid",
      blur_mask: settings.settings?.blur_mask || value === "Blur",
    };

    // Create a complete masking with coordinates relative to original image
    const masking: Masking = {
      id,
      type: "masking",
      coordinates: currentMasking.coordinates,
      settings: commonSettings,
    };

    // Update existing masking or add new one
    const newMaskings = editMode
      ? [...maskings].map((h) => (h.id === masking.id ? masking : h))
      : [...(maskings || []), masking];

    setCurrentMasking(null);
    setShowSettings(false);
    setEditMode(false);
    setEditingId(null);
    setPrevMasking(null);
    onMaskingsChange?.(newMaskings);
  };

  const handleSettingsCancel = () => {
    setShowSettings(false);
    setCurrentMasking(null);
    setEditMode(false);
    setEditingId(null);
    if (prevMasking) {
      const updatedMaskings = maskings.map((masking) =>
        masking.id === prevMasking.id ? prevMasking : masking,
      );

      onMaskingsChange?.(updatedMaskings);
      setPrevMasking(null);
    }
  };
  // Helper function to render resize handles for a masking
  const renderResizeHandles = (masking: Masking) => {
    if (!masking.coordinates || !imageElementRef.current) return null;

    const isEditing =
      editingId === masking.id || resizingMasking === masking.id;

    if (!isEditing) return null;

    // Create resize handles for the masking
    return resizeHandles.map((handle) => {
      let handleStyle: React.CSSProperties = {
        position: "absolute",
        width: "12px",
        height: "12px",
        backgroundColor: "#444CE7",
        borderRadius: "50%",
        cursor: handle.cursor,
        zIndex: 3,
        border: "2px solid white",
        boxShadow: "0 0 4px rgba(0,0,0,0.3)",
      };

      // Position the handle based on its position name
      switch (handle.position) {
        case "top-left":
          handleStyle.top = "-6px";
          handleStyle.left = "-6px";
          break;
        case "top-right":
          handleStyle.top = "-6px";
          handleStyle.right = "-6px";
          break;
        case "bottom-left":
          handleStyle.bottom = "-6px";
          handleStyle.left = "-6px";
          break;
        case "bottom-right":
          handleStyle.bottom = "-6px";
          handleStyle.right = "-6px";
          break;
        case "top":
          handleStyle.top = "-6px";
          handleStyle.left = "50%";
          handleStyle.transform = "translateX(-50%)";
          break;
        case "right":
          handleStyle.top = "50%";
          handleStyle.right = "-6px";
          handleStyle.transform = "translateY(-50%)";
          break;
        case "bottom":
          handleStyle.bottom = "-6px";
          handleStyle.left = "50%";
          handleStyle.transform = "translateX(-50%)";
          break;
        case "left":
          handleStyle.top = "50%";
          handleStyle.left = "-6px";
          handleStyle.transform = "translateY(-50%)";
          break;
      }

      return (
        <Box
          key={handle.position}
          style={handleStyle}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleStartResize(e, masking.id, handle.position);
          }}
        />
      );
    });
  };

  // Helper function to render maskings on the image using our improved coordinates function
  const renderMasking = (masking: Masking) => {
    if (!masking.coordinates || !imageElementRef.current) return null;

    // Use our improved scaled coordinates function
    const renderedCoords = getScaledCoordinates(
      masking.coordinates,
      imageElementRef.current,
    );
    if (!renderedCoords) return null;

    // Determine states for visual styling
    const isMoving = movingMasking === masking.id;
    const isResizing = resizingMasking === masking.id;
    const isEditing = editingId === masking.id;
    const isHovered = hoveredMasking === masking.id;

    return (
      <Tooltip
        key={masking.id}
        title={"Masking"}
        arrow
        placement="top"
        PopperProps={{
          sx: { zIndex: 1400 },
        }}
      >
        <Box
          onClick={(e) => {
            e.stopPropagation();
            if (!isEditing && !isResizing && !isMoving) {
              onEditMasking?.(masking);
            }
          }}
          onMouseEnter={() => setHoveredMasking(masking.id)}
          onMouseLeave={() => setHoveredMasking(null)}
          sx={{
            position: "absolute",
            display: "flex",
            alignItems: "flex-start",
            p: 0.5,
            flexWrap: "wrap",
            justifyContent: "space-between",
            left: `${renderedCoords.left}px`,
            top: `${renderedCoords.top}px`,
            width: `${renderedCoords.width}px`,
            height: `${renderedCoords.height}px`,
            border: "2px solid",
            borderColor: isEditing
              ? "#00AB55"
              : isMoving || isResizing
                ? "#FF4785"
                : "#444CE7",
            backgroundColor: masking.settings?.color,
            transition: "box-shadow 0.3s",
            zIndex: 0,
            filter: "none",
            backdropFilter: masking.settings?.blur_mask ? "blur(5px)" : "none",
            cursor: isMoving ? "move" : "pointer",
            // Add masking label for better identification
            "&::after": isHovered
              ? {
                  content: '""',
                  position: "absolute",
                  top: "-28px",
                  left: "0",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "#FFF",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  zIndex: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }
              : {},
            // Add move handle
            "&::before": {
              content: '""',
              position: "absolute",
              right: "-14px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: isEditing
                ? "#00AB55"
                : isMoving || isResizing
                  ? "#FF4785"
                  : "#444CE7",
              cursor: "move",
              zIndex: 2,
              boxShadow: "0 0 4px rgba(0,0,0,0.3)",
              border: "2px solid white",
            },
          }}
          onMouseDown={
            isMoving || isResizing
              ? undefined
              : (e) => {
                  if (e.target === e.currentTarget) {
                    handleStartMove(e, masking.id);
                  }
                }
          }
        >
          {/* Type icon indicator in top left */}
          {isHovered && (
            <Box
              sx={{
                color: "#444CE7",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "50%",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 4px rgba(0,0,0,0.2)",
              }}
            >
              <Visibility sx={{ fontSize: 16 }} />
            </Box>
          )}

          {isHovered && (
            <Box
              sx={{
                position: "absolute",
                // Conditionally position based on width
                ...(renderedCoords.width < 50
                  ? { bottom: "-24px", right: "4px" } // Position at bottom when width < 50px
                  : { top: "4px", right: "4px" }), // Default position at top
                color: "#444CE7",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "50%",
                padding: "2px",
                display: "flex",
                width: "fit-content",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 4px rgba(0,0,0,0.4)",
                zIndex: 10, // Ensure it's above other elements
              }}
            >
              <Delete
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMasking?.(masking.id, masking.type);
                  setEditMode(false);
                  setEditingId(null);
                }}
                sx={{ fontSize: 16 }}
              />
            </Box>
          )}

          {/* Add resize handles when masking is being edited */}
          {renderResizeHandles(masking)}
        </Box>
      </Tooltip>
    );
  };
  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {imageError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {imageError}
        </Alert>
      )}

      <Box
        onClick={() => {
          if (editMode) {
            setEditMode(false);
            setEditingId(null);
            setShowSettings(false);
            setCurrentMasking(null);
          }
        }}
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          cursor: isDrawing
            ? "crosshair"
            : "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='10' fill='black'/%3E%3Cpath d='M12 7V17M7 12H17' stroke='white' stroke-width='2'/%3E%3C/svg%3E\") 12 12, auto",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Editing instructions overlay */}
        {editMode && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "8px 16px",
              zIndex: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backdropFilter: "blur(2px)",
            }}
          >
            <Typography variant="body2">
              Click to select a Masking. Drag to move. Resize with the blue
              handles.
            </Typography>
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={() => setEditMode(false)}
              sx={{ ml: 2 }}
            >
              Exit Edit Mode
            </Button>
          </Box>
        )}

        {processedImageUrl ? (
          <Box
            component="img"
            ref={imageElementRef}
            src={processedImageUrl}
            alt="Masking canvas"
            onError={(e) => {
              console.error(
                "Error loading processed image:",
                processedImageUrl,
              );
              setImageError("Could not load image");
            }}
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : imageError ? (
          <Box
            sx={{
              width: "100%",
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f5f5f5",
              color: "#666",
            }}
          >
            <Typography>No valid image data available</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f5f5f5",
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}

        {/* Existing maskings */}
        {Array.isArray(maskings) && maskings.map(renderMasking)}

        {/* Currently drawing masking */}
        {currentMasking && currentMasking.coordinates && !showSettings && (
          <Box
            sx={{
              position: "absolute",
              left: `${getScaledCoordinates(currentMasking.coordinates, imageElementRef.current)?.left || 0}px`,
              top: `${getScaledCoordinates(currentMasking.coordinates, imageElementRef.current)?.top || 0}px`,
              width: `${getScaledCoordinates(currentMasking.coordinates, imageElementRef.current)?.width || 0}px`,
              height: `${getScaledCoordinates(currentMasking.coordinates, imageElementRef.current)?.height || 0}px`,
              border: "2px solid #444CE7",
              backgroundColor: "#ffc10733",
              pointerEvents: "none",
            }}
          />
        )}
      </Box>

      {/* Settings Dialog */}
      {showSettings && (
        <Paper
          elevation={6}
          sx={{
            position: "fixed",
            top: Math.max(
              16,
              Math.min(dialogPosition.top, viewportSize.height - 480 - 16),
            ),
            left: Math.max(
              16,
              Math.min(dialogPosition.left, viewportSize.width - 550 - 16),
            ),
            maxWidth: 550,
            width: "100%",
            borderRadius: 2,
            zIndex: 1300,
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
            transform: "translate3d(0,0,0)",
          }}
        >
          <Stack spacing={2} sx={{ p: 2 }}>
            {/* Header */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "#F5F6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {editMode ? (
                    <EditIcon sx={{ fontSize: 18, color: "#444CE7" }} />
                  ) : (
                    <VisibilityOff sx={{ fontSize: 18, color: "#444CE7" }} />
                  )}
                </Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  fontSize="18px"
                >
                  {editMode ? "Edit Masking" : "Add Masking"}
                </Typography>
              </Stack>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(false);
                  setCurrentMasking(null);
                  setEditMode(false);
                  setEditingId(null);
                }}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>

            {/* Form Fields */}
            <Stack spacing={2} width="100%">
              <Tabs
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  border: "1px solid #0000000A",
                  borderRadius: "8px",
                  p: "4px",
                  "& .MuiTabs-indicator": {
                    backgroundColor: "transparent",
                    height: 3,
                  },
                }}
                value={value}
                onChange={handleChange}
              >
                <Tab
                  sx={{
                    width: "50%",
                    bgcolor: value === "Solid" ? "#001EEE0A" : "white",
                    color: value === "Solid" ? "#001EEE" : "#00000099",
                    fontWeight: 500,
                    borderRadius: "8px",
                  }}
                  label="Solid Masking"
                  value="Solid"
                />
                <Tab
                  sx={{
                    width: "50%",
                    bgcolor: value === "Blur" ? "#001EEE0A" : "white",
                    color: value === "Blur" ? "#001EEE" : "#00000099",
                    fontWeight: 500,
                    borderRadius: "8px",
                  }}
                  label="Blur Masking"
                  value="Blur"
                />
              </Tabs>
              {/* Highlight color setting for all masking types */}
              {value === "Solid" && (
                <>
                  <TextField
                    size="medium"
                    fullWidth
                    label="Solid Color"
                    value={
                      // Show hex value to user
                      (() => {
                        const rgba = currentMasking?.settings?.color;
                        const match = rgba?.match(
                          /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/,
                        );
                        if (match) {
                          const r = parseInt(match[1])
                            .toString(16)
                            .padStart(2, "0");
                          const g = parseInt(match[2])
                            .toString(16)
                            .padStart(2, "0");
                          const b = parseInt(match[3])
                            .toString(16)
                            .padStart(2, "0");
                          return `#${r}${g}${b}`;
                        }
                        return "#ffc107"; // Default amber color
                      })()
                    }
                    onChange={(e) => {
                      // Convert hex to rgba
                      const colorValue = e.target.value;
                      if (colorValue.startsWith("#")) {
                        // Convert hex to rgba
                        const r = parseInt(colorValue.slice(1, 3), 16);
                        const g = parseInt(colorValue.slice(3, 5), 16);
                        const b = parseInt(colorValue.slice(5, 7), 16);
                        const rgba = `rgba(${r}, ${g}, ${b}, 1)`;

                        setCurrentMasking((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            settings: {
                              ...prev.settings,
                              color: rgba,
                              solid_mask: true,
                              blur_mask: false,
                            },
                          };
                        });
                      }
                    }}
                    InputProps={{
                      style: { height: "48px" },
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor:
                                currentMasking?.settings?.color || "#ffc107",
                              borderRadius: 0.5,
                              border: "1px solid #E5E7EB",
                            }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <input
                            type="color"
                            value={
                              // Convert RGBA to hex for the color input
                              (() => {
                                const rgba =
                                  currentMasking?.settings?.color ||
                                  "rgba(255, 193, 7, 0.8)";
                                const match = rgba.match(
                                  /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/,
                                );
                                if (match) {
                                  const r = parseInt(match[1])
                                    .toString(16)
                                    .padStart(2, "0");
                                  const g = parseInt(match[2])
                                    .toString(16)
                                    .padStart(2, "0");
                                  const b = parseInt(match[3])
                                    .toString(16)
                                    .padStart(2, "0");
                                  return `#${r}${g}${b}`;
                                }
                                return "#ffc107"; // Default amber color
                              })()
                            }
                            onChange={(e) => {
                              const hexColor = e.target.value;
                              // Convert hex to rgba
                              const r = parseInt(hexColor.slice(1, 3), 16);
                              const g = parseInt(hexColor.slice(3, 5), 16);
                              const b = parseInt(hexColor.slice(5, 7), 16);
                              // Keep the existing alpha or default to 1
                              const currentAlpha = (() => {
                                const rgba =
                                  currentMasking?.settings?.color || "";
                                const match = rgba.match(
                                  /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/,
                                );
                                return match ? parseFloat(match[1]) : 1;
                              })();

                              const rgba = `rgba(${r}, ${g}, ${b}, ${currentAlpha})`;

                              setCurrentMasking((prev) => ({
                                ...prev,
                                settings: {
                                  ...prev?.settings,
                                  color: rgba,
                                  solid_mask: true,
                                  blur_mask: false,
                                },
                              }));
                            }}
                            style={{
                              width: 24,
                              height: 24,
                              border: "none",
                              padding: 0,
                              background: "none",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      mt: 1,
                    }}
                  >
                    {commonColors.map((color) => (
                      <Button
                        key={color.name}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          // Convert hex to rgba
                          const hexColor = color.value;
                          const r = parseInt(hexColor.slice(1, 3), 16);
                          const g = parseInt(hexColor.slice(3, 5), 16);
                          const b = parseInt(hexColor.slice(5, 7), 16);
                          const rgba = `rgba(${r}, ${g}, ${b}, 1)`;

                          setCurrentMasking((prev) => ({
                            ...prev,
                            settings: {
                              ...prev?.settings,
                              color: rgba,
                              solid_mask: true,
                              blur_mask: false,
                            },
                          }));
                        }}
                        sx={{
                          minWidth: "auto",
                          py: 0.5,
                          px: 1,
                          fontSize: "11px",
                          borderColor: "divider",
                          color: "text.secondary",
                          textTransform: "none",
                          "&:hover": {
                            borderColor: color.value,
                            color: color.value,
                          },
                        }}
                      >
                        {color.name}
                      </Button>
                    ))}
                  </Box>
                </>
              )}
              {value === "Blur" && (
                <>
                  <TextField
                    size="medium"
                    fullWidth
                    label="Blur Effect"
                    value={
                      // Show hex value to user
                      (() => {
                        const rgba = currentMasking?.settings?.color;
                        const match = rgba?.match(
                          /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/,
                        );
                        if (match) {
                          const r = parseInt(match[1])
                            .toString(16)
                            .padStart(2, "0");
                          const g = parseInt(match[2])
                            .toString(16)
                            .padStart(2, "0");
                          const b = parseInt(match[3])
                            .toString(16)
                            .padStart(2, "0");
                          return `#${r}${g}${b}`;
                        }
                        return "#ffc107"; // Default amber color
                      })()
                    }
                    onChange={(e) => {
                      // Convert hex to rgba
                      const colorValue = e.target.value;
                      if (colorValue.startsWith("#")) {
                        // Convert hex to rgba
                        const r = parseInt(colorValue.slice(1, 3), 16);
                        const g = parseInt(colorValue.slice(3, 5), 16);
                        const b = parseInt(colorValue.slice(5, 7), 16);
                        const rgba = `rgba(${r}, ${g}, ${b}, 1)`;

                        setCurrentMasking((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            settings: {
                              ...prev.settings,
                              color: rgba,
                              solid_mask: false,
                              blur_mask: true,
                            },
                          };
                        });
                      }
                    }}
                    InputProps={{
                      style: { height: "48px" },
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: currentMasking?.settings?.color,
                              borderRadius: 0.5,
                              border: "1px solid ",
                              borderColor: currentMasking?.settings?.color,
                              filter: `blur(${10}px)`,
                            }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <input
                            type="color"
                            value={
                              // Convert RGBA to hex for the color input
                              (() => {
                                const rgba = currentMasking?.settings?.color;
                                const match = rgba?.match(
                                  /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/,
                                );
                                if (match) {
                                  const r = parseInt(match[1])
                                    .toString(16)
                                    .padStart(2, "0");
                                  const g = parseInt(match[2])
                                    .toString(16)
                                    .padStart(2, "0");
                                  const b = parseInt(match[3])
                                    .toString(16)
                                    .padStart(2, "0");
                                  return `#${r}${g}${b}`;
                                }
                                return "#ffc107"; // Default amber color
                              })()
                            }
                            onChange={(e) => {
                              const hexColor = e.target.value;
                              // Convert hex to rgba
                              const r = parseInt(hexColor.slice(1, 3), 16);
                              const g = parseInt(hexColor.slice(3, 5), 16);
                              const b = parseInt(hexColor.slice(5, 7), 16);
                              // Keep the existing alpha or default to 1
                              const currentAlpha = (() => {
                                const rgba =
                                  currentMasking?.settings?.color || "";
                                const match = rgba.match(
                                  /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/,
                                );
                                return match ? parseFloat(match[1]) : 1;
                              })();

                              const rgba = `rgba(${r}, ${g}, ${b}, ${currentAlpha})`;

                              setCurrentMasking((prev) => ({
                                ...prev,
                                settings: {
                                  ...prev?.settings,
                                  color: rgba,
                                  solid_mask: false,
                                  blur_mask: true,
                                },
                              }));
                            }}
                            style={{
                              width: 24,
                              height: 24,
                              border: "none",
                              padding: 0,
                              background: "none",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      mt: 1,
                    }}
                  >
                    {commonColors.map((color) => (
                      <Button
                        key={color.name}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          // Convert hex to rgba
                          const hexColor = color.value;
                          const r = parseInt(hexColor.slice(1, 3), 16);
                          const g = parseInt(hexColor.slice(3, 5), 16);
                          const b = parseInt(hexColor.slice(5, 7), 16);
                          const rgba = `rgba(${r}, ${g}, ${b}, 1)`;

                          setCurrentMasking((prev) => ({
                            ...prev,
                            settings: {
                              ...prev?.settings,
                              color: rgba,
                              solid_mask: false,
                              blur_mask: true,
                            },
                          }));
                        }}
                        sx={{
                          minWidth: "auto",
                          py: 0.5,
                          px: 1,
                          fontSize: "11px",
                          borderColor: "divider",
                          color: "text.secondary",
                          textTransform: "none",
                          "&:hover": {
                            borderColor: color.value,
                            color: color.value,
                          },
                        }}
                      >
                        {color.name}
                      </Button>
                    ))}
                  </Box>
                </>
              )}
            </Stack>

            {/* Actions */}
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSettingsCancel();
                }}
                sx={{
                  textTransform: "none",
                  py: 1,
                  border: "1px solid #00000033",
                  color: "#00000099",
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSettingsSave(currentMasking || {});
                }}
                sx={{
                  bgcolor: "#001EEE",
                  "&:hover": { bgcolor: "#3538CD" },
                  textTransform: "none",
                  py: 1,
                }}
              >
                {editMode ? "Update" : "Save"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* RGBA Color Picker Popover - Kept for compatibility but now hidden */}
      <Popover
        open={false}
        anchorEl={colorPickerAnchorEl}
        onClose={handleCloseColorPicker}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        {/* Content is hidden but kept for compatibility */}
      </Popover>
    </Box>
  );
};

export default MaskingPhi;
