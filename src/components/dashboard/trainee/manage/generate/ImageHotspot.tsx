import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  Box,
  Dialog,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stack,
  Typography,
  IconButton,
  Paper,
  InputLabel,
  FormControl,
  FormHelperText,
  Chip,
  InputAdornment,
  Popover,
  Slider,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { withAlpha } from "../../../../../utils/color";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  ColorLens as ColorLensIcon,
  Timer as TimerIcon,
  ChatBubble as ChatBubbleIcon,
  Highlight as HighlightIcon,
  List as ListIcon,
  CheckBox as CheckBoxIcon,
  TextFields as TextFieldsIcon,
  Lightbulb as LightbulbIcon,
} from "@mui/icons-material";
import { Masking } from "./MaskingPhi";

interface Hotspot {
  id: string;
  name: string;
  type: string;
  hotspotType:
    | "button"
    | "dropdown"
    | "checkbox"
    | "textfield"
    | "highlight"
    | "coaching";
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // Add percentage-based coordinates
  percentageCoordinates?: {
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
  };
  settings?: {
    placeholder?: string;
    advanceOnSelect?: boolean;
    advanceOnCheck?: boolean;
    expectedValue?: string;
    textColor?: string;
    fontSize?: number;
    highlightColor?: string;
    tipText?: string;
    tipPosition?: "top" | "bottom" | "left" | "right";
    buttonColor?: string;
    font?: string;
    timeoutDuration?: number;
    highlightField?: boolean;
    enableHotkey?: boolean;
  };
  options?: string[];
}

interface ColorOption {
  name: string;
  value: string;
}

interface ImageHotspotProps {
  imageUrl: string;
  onHotspotsChange?: (hotspots: Hotspot[]) => void;
  maskings?: Masking[];
  hotspots?: Hotspot[];
  onEditHotspot?: (hotspot: Hotspot) => void;
  editingHotspot?: Hotspot | null;
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

// Helper to get hotspot type icon
const getHotspotTypeIcon = (hotspotType: string) => {
  switch (hotspotType) {
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
const getHotspotTypeName = (hotspotType: string) => {
  switch (hotspotType) {
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
      return hotspotType.charAt(0).toUpperCase() + hotspotType.slice(1);
  }
};

const ImageHotspot: React.FC<ImageHotspotProps> = ({
  imageUrl,
  onHotspotsChange,
  maskings = [],
  hotspots = [],
  onEditHotspot,
  editingHotspot,
  containerWidth,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ xPercent: 0, yPercent: 0 }); // Updated for percentage-based coordinates
  const [currentHotspot, setCurrentHotspot] = useState<Partial<Hotspot> | null>(
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
  const [newOption, setNewOption] = useState("");
  const [optionsList, setOptionsList] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null,
  );
  const [timeoutError, setTimeoutError] = useState<string | null>(null);

  // Add state for moving hotspots
  const [movingHotspot, setMovingHotspot] = useState<string | null>(null);
  const [moveStart, setMoveStart] = useState({ x: 0, y: 0 });

  // Add state for resizing hotspots
  const [resizingHotspot, setResizingHotspot] = useState<string | null>(null);
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

  // Add hover state for showing hotspot type tooltip
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  // Add states for draggable modal
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Add state to track if dialog has been manually dragged
  const [hasBeenManuallyDragged, setHasBeenManuallyDragged] = useState(false);

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
  const [rgbaColor, setRgbaColor] = useState<{
    r: number;
    g: number;
    b: number;
    a: number;
  }>({ r: 255, g: 193, b: 7, a: 0.8 });

  // Clear error message when hotspot type changes or timeout duration changes
  useEffect(() => {
    // Clear timeout error if hotspot type is not highlight or coaching
    if (
      currentHotspot?.hotspotType !== "highlight" &&
      currentHotspot?.hotspotType !== "coaching"
    ) {
      setTimeoutError(null);
    }
    // Clear error if highlight/coaching has a valid timeout
    else if (
      (currentHotspot?.hotspotType === "highlight" ||
        currentHotspot?.hotspotType === "coaching") &&
      currentHotspot?.settings?.timeoutDuration &&
      currentHotspot.settings.timeoutDuration > 0
    ) {
      setTimeoutError(null);
    }
  }, [currentHotspot?.hotspotType, currentHotspot?.settings?.timeoutDuration]);

  // Add effect to handle global mouse events for modal dragging
  useEffect(() => {
    if (isDraggingModal) {
      const handleMouseMove = (e: MouseEvent) => {
        setDialogPosition((prev) => ({
          top: e.clientY - dragOffset.y,
          left: e.clientX - dragOffset.x,
        }));
        // Mark that the dialog has been manually dragged
        setHasBeenManuallyDragged(true);
      };

      const handleMouseUp = () => {
        setIsDraggingModal(false);
      };

      // Add global event listeners
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      // Clean up
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDraggingModal, dragOffset]);

  // Parse RGBA color string to components
  const parseRgba = (rgbaStr: string) => {
    // Default fallback
    let result = { r: 255, g: 193, b: 7, a: 0.8 };

    try {
      // Parse "rgba(r, g, b, a)" format
      const match = rgbaStr.match(
        /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/,
      );
      if (match) {
        result = {
          r: parseInt(match[1], 10),
          g: parseInt(match[2], 10),
          b: parseInt(match[3], 10),
          a: parseFloat(match[4]),
        };
      }
    } catch (e) {
      console.error("Error parsing RGBA color:", e);
    }

    return result;
  };

  // Convert RGBA components to string
  const rgbaToString = (rgba: {
    r: number;
    g: number;
    b: number;
    a: number;
  }) => {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  };

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

  // Handle opening the color picker - no longer needed as we're using the standard color picker
  const handleOpenColorPicker = (event: React.MouseEvent<HTMLElement>) => {
    // Kept for backwards compatibility, but no longer used
    setColorPickerAnchorEl(event.currentTarget);

    // Parse current color on open
    if (currentHotspot?.settings?.highlightColor) {
      setRgbaColor(parseRgba(currentHotspot.settings.highlightColor));
    }
  };

  // Handle closing the color picker
  const handleCloseColorPicker = () => {
    setColorPickerAnchorEl(null);
  };

  // Update hotspot with new color when slider changes
  const handleColorChange = (rgba: {
    r: number;
    g: number;
    b: number;
    a: number;
  }) => {
    setRgbaColor(rgba);

    // Update the hotspot with the new color
    setCurrentHotspot((prev) => ({
      ...prev,
      settings: {
        ...prev?.settings,
        highlightColor: rgbaToString(rgba),
      },
    }));
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

  // Improved image size and scale tracking with ResizeObserver
  useEffect(() => {
    if (!containerRef.current || !imageElementRef.current) return;

    const updateImageSizeAndScale = () => {
      if (!imageElementRef.current) return;

      const img = imageElementRef.current;
      // Get the actual rendered dimensions
      const rect = img.getBoundingClientRect();
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (naturalWidth === 0 || naturalHeight === 0) {
        console.log("Image not fully loaded, waiting...");
        return;
      }

      // Store current rendered dimensions
      setImageSize({
        width: rect.width,
        height: rect.height,
      });

      // Calculate scales based on original image dimensions
      const widthScale = rect.width / naturalWidth;
      const heightScale = rect.height / naturalHeight;

      setImageScale({
        width: widthScale,
        height: heightScale,
      });

      console.log(
        `Image scales updated - width: ${widthScale}, height: ${heightScale}`,
      );
    };

    // Initial update
    updateImageSizeAndScale();

    // Create observer to track container and image size changes
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        updateImageSizeAndScale();
      });
    });

    // Observe both the container and the image
    resizeObserver.observe(containerRef.current);
    if (imageElementRef.current) {
      resizeObserver.observe(imageElementRef.current);
    }

    // Also handle window resize events
    window.addEventListener("resize", updateImageSizeAndScale);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateImageSizeAndScale);
    };
  }, [containerRef, originalImageSize, containerWidth, processedImageUrl]);

  // Initialize options list when editing a dropdown hotspot
  useEffect(() => {
    if (
      editingHotspot &&
      editingHotspot.hotspotType === "dropdown" &&
      editingHotspot.options
    ) {
      setOptionsList(editingHotspot.options);
    } else {
      setOptionsList([]);
    }
  }, [editingHotspot]);

  // Update hotspots when editing hotspot changes
  useEffect(() => {
    if (editingHotspot) {
      setEditingId(editingHotspot.id);
      setEditMode(true);
      setCurrentHotspot(editingHotspot);
      setShowSettings(true);
      calculateDialogPosition(editingHotspot);
      // Reset the manually dragged flag when opening a new/existing hotspot dialog
      setHasBeenManuallyDragged(false);
    }
  }, [editingHotspot]);

  // Add effect for handling global mouse events during hotspot moving
  useEffect(() => {
    if (movingHotspot) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMoveHotspot(e as unknown as React.MouseEvent);
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
  }, [movingHotspot]);

  // Add effect for handling global mouse events during hotspot resizing
  useEffect(() => {
    if (resizingHotspot) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleResizeHotspot(e as unknown as React.MouseEvent);
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
  }, [resizingHotspot]);

  // Updated to use percentage-based coordinates
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !imageElementRef.current) return;

    const img = imageElementRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate offset of the image within its container
    const offsetX = rect.left - containerRect.left;
    const offsetY = rect.top - containerRect.top;

    // Calculate coordinates as percentages of the image dimensions
    // Adjust by the offset to get coordinates relative to the image
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setStartPos({ xPercent, yPercent });
  };

  // Updated to use percentage-based coordinates
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current || !imageElementRef.current) return;

    const img = imageElementRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate offset of the image within its container
    const offsetX = rect.left - containerRect.left;
    const offsetY = rect.top - containerRect.top;

    // Calculate current position as percentages
    // Adjust by the offset to get coordinates relative to the image
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    // Create percentage-based coordinates
    const percentageCoordinates = {
      xPercent: Math.min(startPos.xPercent, xPercent),
      yPercent: Math.min(startPos.yPercent, yPercent),
      widthPercent: Math.abs(xPercent - startPos.xPercent),
      heightPercent: Math.abs(yPercent - startPos.yPercent),
    };

    // Also calculate absolute coordinates based on natural image dimensions
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const coordinates = {
      x: (percentageCoordinates.xPercent * naturalWidth) / 100,
      y: (percentageCoordinates.yPercent * naturalHeight) / 100,
      width: (percentageCoordinates.widthPercent * naturalWidth) / 100,
      height: (percentageCoordinates.heightPercent * naturalHeight) / 100,
    };

    setCurrentHotspot({
      coordinates,
      percentageCoordinates,
      // Initialize with button hotspot type and settings
      hotspotType: "button",
      settings: {
        font: "Inter",
        fontSize: 16,
        buttonColor: "#00AB55",
        textColor: "#FFFFFF",
        timeoutDuration: 0, // Default to disabled (0)
        highlightField: false,
        enableHotkey: false,
        highlightColor: "rgba(255, 193, 7, 0.8)", // Default highlight color for all hotspot types
      },
    });
  };

  const handleMouseUp = () => {
    if (
      !isDrawing ||
      !currentHotspot ||
      (!currentHotspot.coordinates && !currentHotspot.percentageCoordinates)
    )
      return;

    setIsDrawing(false);

    // Only calculate dialog position and show settings if the rectangle has some size
    const hasSize = currentHotspot.percentageCoordinates
      ? currentHotspot.percentageCoordinates.widthPercent > 0.5 &&
        currentHotspot.percentageCoordinates.heightPercent > 0.5
      : currentHotspot.coordinates &&
        (currentHotspot.coordinates.width > 5 ||
          currentHotspot.coordinates.height > 5);

    if (hasSize) {
      calculateDialogPosition(currentHotspot);
      setShowSettings(true);
      // Reset the manually dragged flag when opening a new dialog
      setHasBeenManuallyDragged(false);
    }
  };

  // Start moving a hotspot - updated for percentage coordinates
  const handleStartMove = (e: React.MouseEvent, hotspotId: string) => {
    e.stopPropagation();
    if (!imageElementRef.current) return;

    // Find the hotspot
    const hotspot = hotspots.find((h) => h.id === hotspotId);
    if (!hotspot) return;

    // Store the original mouse position and original hotspot percentages
    // This approach avoids position calculation errors
    setMoveStart({
      x: e.clientX,
      y: e.clientY,
    });

    // Record this hotspot is being moved
    setMovingHotspot(hotspotId);
    setEditingHotspot(null); // Cancel any active editing
  };

  // Handle moving hotspot - completely redesigned
  const handleMoveHotspot = (e: React.MouseEvent) => {
    if (!movingHotspot || !imageElementRef.current) return;

    const hotspot = hotspots.find((h) => h.id === movingHotspot);
    if (!hotspot || !hotspot.percentageCoordinates) return;

    const img = imageElementRef.current;
    const rect = img.getBoundingClientRect();

    // Calculate the mouse movement delta since drag started
    const deltaX = e.clientX - moveStart.x;
    const deltaY = e.clientY - moveStart.y;

    // Convert delta to percentage of image dimensions
    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    // Calculate new position by adding delta to the original position
    const newXPercent = hotspot.percentageCoordinates.xPercent + deltaXPercent;
    const newYPercent = hotspot.percentageCoordinates.yPercent + deltaYPercent;

    // Apply boundary constraints
    const constrainedXPercent = Math.max(
      0,
      Math.min(newXPercent, 100 - hotspot.percentageCoordinates.widthPercent),
    );
    const constrainedYPercent = Math.max(
      0,
      Math.min(newYPercent, 100 - hotspot.percentageCoordinates.heightPercent),
    );

    // Get width and height values
    const widthPercent = hotspot.percentageCoordinates.widthPercent;
    const heightPercent = hotspot.percentageCoordinates.heightPercent;

    // Calculate absolute coordinates from percentages
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const newX = (constrainedXPercent * naturalWidth) / 100;
    const newY = (constrainedYPercent * naturalHeight) / 100;
    const width = (widthPercent * naturalWidth) / 100;
    const height = (heightPercent * naturalHeight) / 100;

    // Update all hotspots with the moved one
    const updatedHotspots = hotspots.map((h) => {
      if (h.id === movingHotspot) {
        return {
          ...h,
          coordinates: {
            x: newX,
            y: newY,
            width,
            height,
          },
          percentageCoordinates: {
            xPercent: constrainedXPercent,
            yPercent: constrainedYPercent,
            widthPercent,
            heightPercent,
          },
        };
      }
      return h;
    });

    // Update parent with the new positions
    onHotspotsChange?.(updatedHotspots);

    // Update the movement start position for the next frame
    // This is critical for continuous dragging
    setMoveStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // End the move operation
  const handleEndMove = () => {
    setMovingHotspot(null);
  };

  // Start resizing a hotspot - updated for percentage coordinates
  const handleStartResize = (
    e: React.MouseEvent,
    hotspotId: string,
    handle: string,
  ) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection during resize
    if (!imageElementRef.current) return;

    // Find the hotspot
    const hotspot = hotspots.find((h) => h.id === hotspotId);
    if (!hotspot) return;

    // Store starting mouse position
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
    });

    // Create a deep copy of the original coordinates to prevent reference issues
    const originalCoords = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      xPercent: 0,
      yPercent: 0,
      widthPercent: 0,
      heightPercent: 0,
    };

    // Copy absolute coordinates if available
    if (hotspot.coordinates) {
      originalCoords.x = hotspot.coordinates.x;
      originalCoords.y = hotspot.coordinates.y;
      originalCoords.width = hotspot.coordinates.width;
      originalCoords.height = hotspot.coordinates.height;
    }

    // Copy percentage coordinates if available
    if (hotspot.percentageCoordinates) {
      originalCoords.xPercent = hotspot.percentageCoordinates.xPercent;
      originalCoords.yPercent = hotspot.percentageCoordinates.yPercent;
      originalCoords.widthPercent = hotspot.percentageCoordinates.widthPercent;
      originalCoords.heightPercent =
        hotspot.percentageCoordinates.heightPercent;
    }
    // Or calculate percentage coordinates from absolute coordinates
    else if (hotspot.coordinates && imageElementRef.current) {
      const naturalWidth = imageElementRef.current.naturalWidth;
      const naturalHeight = imageElementRef.current.naturalHeight;
      originalCoords.xPercent = (hotspot.coordinates.x / naturalWidth) * 100;
      originalCoords.yPercent = (hotspot.coordinates.y / naturalHeight) * 100;
      originalCoords.widthPercent =
        (hotspot.coordinates.width / naturalWidth) * 100;
      originalCoords.heightPercent =
        (hotspot.coordinates.height / naturalHeight) * 100;
    }

    setResizeOriginal(originalCoords);
    setResizingHotspot(hotspotId);
    setResizeHandle(handle);

    // Keep the edited hotspot state if it's the one being resized
    if (editingHotspot?.id !== hotspotId) {
      setEditingHotspot(null);
    }
  };

  // Handle resize hotspot - updated for percentage coordinates
  const handleResizeHotspot = (e: React.MouseEvent) => {
    if (
      !resizingHotspot ||
      !imageElementRef.current ||
      !resizeHandle ||
      !resizeOriginal
    )
      return;

    const hotspot = hotspots.find((h) => h.id === resizingHotspot);
    if (!hotspot) return;

    const img = imageElementRef.current;
    const rect = img.getBoundingClientRect();

    // Calculate mouse movement in pixels
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    // Convert to percentage of image dimensions
    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    // Get natural dimensions for absolute coordinate calculations
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Initialize new coordinates with original values
    let newXPercent = resizeOriginal.xPercent;
    let newYPercent = resizeOriginal.yPercent;
    let newWidthPercent = resizeOriginal.widthPercent;
    let newHeightPercent = resizeOriginal.heightPercent;

    // Adjust coordinates based on which handle is being dragged
    switch (resizeHandle) {
      case "top-left":
        // Adjust x, y, width, height
        newXPercent = Math.min(
          resizeOriginal.xPercent + resizeOriginal.widthPercent - 1,
          Math.max(0, resizeOriginal.xPercent + deltaXPercent),
        );
        newYPercent = Math.min(
          resizeOriginal.yPercent + resizeOriginal.heightPercent - 1,
          Math.max(0, resizeOriginal.yPercent + deltaYPercent),
        );
        newWidthPercent = Math.max(
          1,
          resizeOriginal.widthPercent - (newXPercent - resizeOriginal.xPercent),
        );
        newHeightPercent = Math.max(
          1,
          resizeOriginal.heightPercent -
            (newYPercent - resizeOriginal.yPercent),
        );
        break;

      case "top-right":
        // Adjust y, width, height
        newYPercent = Math.min(
          resizeOriginal.yPercent + resizeOriginal.heightPercent - 1,
          Math.max(0, resizeOriginal.yPercent + deltaYPercent),
        );
        newWidthPercent = Math.max(
          1,
          resizeOriginal.widthPercent + deltaXPercent,
        );
        newWidthPercent = Math.min(newWidthPercent, 100 - newXPercent);
        newHeightPercent = Math.max(
          1,
          resizeOriginal.heightPercent -
            (newYPercent - resizeOriginal.yPercent),
        );
        break;

      case "bottom-left":
        // Adjust x, width, height
        newXPercent = Math.min(
          resizeOriginal.xPercent + resizeOriginal.widthPercent - 1,
          Math.max(0, resizeOriginal.xPercent + deltaXPercent),
        );
        newWidthPercent = Math.max(
          1,
          resizeOriginal.widthPercent - (newXPercent - resizeOriginal.xPercent),
        );
        newHeightPercent = Math.max(
          1,
          resizeOriginal.heightPercent + deltaYPercent,
        );
        newHeightPercent = Math.min(newHeightPercent, 100 - newYPercent);
        break;

      case "bottom-right":
        // Adjust width, height
        newWidthPercent = Math.max(
          1,
          resizeOriginal.widthPercent + deltaXPercent,
        );
        newHeightPercent = Math.max(
          1,
          resizeOriginal.heightPercent + deltaYPercent,
        );
        newWidthPercent = Math.min(newWidthPercent, 100 - newXPercent);
        newHeightPercent = Math.min(newHeightPercent, 100 - newYPercent);
        break;

      case "top":
        // Adjust y, height
        newYPercent = Math.min(
          resizeOriginal.yPercent + resizeOriginal.heightPercent - 1,
          Math.max(0, resizeOriginal.yPercent + deltaYPercent),
        );
        newHeightPercent = Math.max(
          1,
          resizeOriginal.heightPercent -
            (newYPercent - resizeOriginal.yPercent),
        );
        break;

      case "right":
        // Adjust width
        newWidthPercent = Math.max(
          1,
          resizeOriginal.widthPercent + deltaXPercent,
        );
        newWidthPercent = Math.min(newWidthPercent, 100 - newXPercent);
        break;

      case "bottom":
        // Adjust height
        newHeightPercent = Math.max(
          1,
          resizeOriginal.heightPercent + deltaYPercent,
        );
        newHeightPercent = Math.min(newHeightPercent, 100 - newYPercent);
        break;

      case "left":
        // Adjust x, width
        newXPercent = Math.min(
          resizeOriginal.xPercent + resizeOriginal.widthPercent - 1,
          Math.max(0, resizeOriginal.xPercent + deltaXPercent),
        );
        newWidthPercent = Math.max(
          1,
          resizeOriginal.widthPercent - (newXPercent - resizeOriginal.xPercent),
        );
        break;
    }

    // Calculate absolute coordinates from percentages
    const newX = (newXPercent * naturalWidth) / 100;
    const newY = (newYPercent * naturalHeight) / 100;
    const newWidth = (newWidthPercent * naturalWidth) / 100;
    const newHeight = (newHeightPercent * naturalHeight) / 100;

    // Update all hotspots with the resized one
    const updatedHotspots = hotspots.map((h) => {
      if (h.id === resizingHotspot) {
        return {
          ...h,
          coordinates: {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          },
          percentageCoordinates: {
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
    onHotspotsChange?.(updatedHotspots);

    // If this is also the currently editing hotspot, update currentHotspot state too
    if (editingHotspot && editingHotspot.id === resizingHotspot) {
      setCurrentHotspot((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          coordinates: {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          },
          percentageCoordinates: {
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
    setResizingHotspot(null);
    setResizeHandle(null);
    setResizeOriginal(null);
  };

  const calculateDialogPosition = (hotspot: Partial<Hotspot>) => {
    if (
      !containerRef.current ||
      !hotspot ||
      (!hotspot.coordinates && !hotspot.percentageCoordinates) ||
      !imageElementRef.current ||
      hasBeenManuallyDragged // Don't recalculate if user has dragged the dialog
    )
      return;

    const dialogHeight = 480; // Fixed dialog height
    const dialogWidth = 400; // Fixed dialog width
    const padding = 90; // Increased padding from edges

    // Get accurate viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Always position in top-right corner with more padding
    let left = viewportWidth - dialogWidth - padding - 90;
    let top = padding + 20; // Additional offset from top

    // Ensure dialog is within viewport bounds (in case of very small screens)
    // Left edge
    if (left < padding) {
      left = padding;
    }
    // Top edge
    if (top < padding) {
      top = padding;
    }
    // Bottom edge - in case dialog height is larger than viewport
    if (top + dialogHeight > viewportHeight - padding) {
      top = viewportHeight - dialogHeight - padding;
    }

    setDialogPosition({ top, left });
  };

  // Modified effect to recalculate positions ONLY when container changes, not when currentHotspot changes
  useEffect(() => {
    const mainContentElement =
      containerRef.current?.closest('[role="main"]') ||
      containerRef.current?.closest("main") ||
      containerRef.current?.parentElement;

    if (mainContentElement) {
      const resizeObserver = new ResizeObserver(() => {
        // Only recalculate if dialog hasn't been manually dragged
        if (currentHotspot && showSettings && !hasBeenManuallyDragged) {
          calculateDialogPosition(currentHotspot);
        }
      });

      resizeObserver.observe(mainContentElement);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [showSettings, hasBeenManuallyDragged]); // Removed currentHotspot from dependencies

  // Handle adding option to the dropdown
  const handleAddOption = () => {
    if (newOption.trim() === "") return;

    setOptionsList([...optionsList, newOption.trim()]);
    setNewOption("");

    // Also update the current hotspot
    setCurrentHotspot((prev) => ({
      ...prev,
      options: [...(prev?.options || []), newOption.trim()],
    }));
  };

  // Handle deleting option from dropdown
  const handleDeleteOption = (optionToDelete: string) => {
    const updatedOptions = optionsList.filter(
      (option) => option !== optionToDelete,
    );
    setOptionsList(updatedOptions);

    // Also update the current hotspot
    setCurrentHotspot((prev) => ({
      ...prev,
      options: updatedOptions,
    }));
  };

  // Validate timeout value
  const validateTimeout = (value: number | undefined): boolean => {
    if (
      currentHotspot?.hotspotType === "highlight" ||
      currentHotspot?.hotspotType === "coaching"
    ) {
      // For highlight and coaching, timeout is required and must be > 0
      return value !== undefined && value > 0;
    }
    // For other types, any timeout is valid (even 0 for "disabled")
    return true;
  };

  // Updated handleSettingsSave to save both coordinate types
  const handleSettingsSave = (settings: Partial<Hotspot>) => {
    // Ensure currentHotspot and coordinates exist
    if (
      !currentHotspot ||
      (!currentHotspot.coordinates && !currentHotspot.percentageCoordinates)
    ) {
      console.error(
        "Cannot save hotspot - missing coordinates:",
        currentHotspot,
      );
      return;
    }

    // Validate timeout for highlight and coaching hotspots
    const hotspotType = settings.hotspotType || "button";
    const timeoutDuration = settings.settings?.timeoutDuration;

    if (
      (hotspotType === "highlight" || hotspotType === "coaching") &&
      (timeoutDuration === undefined || timeoutDuration <= 0)
    ) {
      setTimeoutError(
        "Timeout duration is required for highlight and coaching hotspots",
      );
      return;
    } else {
      setTimeoutError(null);
    }

    const id = editMode ? editingId : Date.now().toString();

    // Common settings for all hotspot types
    const commonSettings = {
      timeoutDuration: settings.settings?.timeoutDuration ?? 0, // Default to 0 (disabled)
      highlightColor:
        settings.settings?.highlightColor || "rgba(255, 193, 7, 0.8)", // Default highlight color
    };

    // Initialize type-specific settings based on hotspotType
    let hotspotSettings: any = { ...commonSettings };

    switch (hotspotType) {
      case "dropdown":
        hotspotSettings = {
          ...commonSettings,
          placeholder: settings.settings?.placeholder || "Select an option",
          advanceOnSelect:
            settings.settings?.advanceOnSelect !== undefined
              ? settings.settings.advanceOnSelect
              : true,
          expectedValue: settings.settings?.expectedValue || "",
        };
        break;
      case "checkbox":
        hotspotSettings = {
          ...commonSettings,
          advanceOnCheck:
            settings.settings?.advanceOnCheck !== undefined
              ? settings.settings.advanceOnCheck
              : true,
        };
        break;
      case "textfield":
        hotspotSettings = {
          ...commonSettings,
          placeholder: settings.settings?.placeholder || "Enter text...",
          textColor: settings.settings?.textColor || "#000000",
          fontSize: settings.settings?.fontSize || 14,
          expectedValue: settings.settings?.expectedValue || "",
        };
        break;
      case "highlight":
        hotspotSettings = {
          ...commonSettings,
          // For highlight type, timeoutDuration is required
          timeoutDuration:
            settings.settings?.timeoutDuration > 0
              ? settings.settings.timeoutDuration
              : 3,
          highlightColor:
            settings.settings?.highlightColor || "rgba(255, 193, 7, 0.8)",
        };
        break;
      case "coaching":
        hotspotSettings = {
          ...commonSettings,
          // For coaching type, timeoutDuration is required
          timeoutDuration:
            settings.settings?.timeoutDuration > 0
              ? settings.settings.timeoutDuration
              : 3,
          tipText: settings.settings?.tipText || "Coaching tip",
          tipPosition: settings.settings?.tipPosition || "top",
          // Add buttonColor and textColor for coaching tips
          buttonColor: settings.settings?.buttonColor || "#1e293b",
          textColor: settings.settings?.textColor || "#FFFFFF",
        };
        break;
      case "button":
        hotspotSettings = {
          ...commonSettings,
          font: settings.settings?.font || "Inter",
          fontSize: settings.settings?.fontSize || 16,
          buttonColor: settings.settings?.buttonColor || "#00AB55",
          textColor: settings.settings?.textColor || "#FFFFFF",
          highlightField:
            settings.settings?.highlightField !== undefined
              ? settings.settings.highlightField
              : false,
          enableHotkey:
            settings.settings?.enableHotkey !== undefined
              ? settings.settings.enableHotkey
              : false,
        };
        break;
    }

    // Ensure we have both coordinate types
    let finalCoordinates = currentHotspot.coordinates;
    let finalPercentageCoordinates = currentHotspot.percentageCoordinates;

    // If we only have one type, calculate the other
    if (
      finalCoordinates &&
      !finalPercentageCoordinates &&
      imageElementRef.current
    ) {
      const naturalWidth = imageElementRef.current.naturalWidth;
      const naturalHeight = imageElementRef.current.naturalHeight;
      finalPercentageCoordinates = {
        xPercent: (finalCoordinates.x / naturalWidth) * 100,
        yPercent: (finalCoordinates.y / naturalHeight) * 100,
        widthPercent: (finalCoordinates.width / naturalWidth) * 100,
        heightPercent: (finalCoordinates.height / naturalHeight) * 100,
      };
    } else if (
      finalPercentageCoordinates &&
      !finalCoordinates &&
      imageElementRef.current
    ) {
      const naturalWidth = imageElementRef.current.naturalWidth;
      const naturalHeight = imageElementRef.current.naturalHeight;
      finalCoordinates = {
        x: (finalPercentageCoordinates.xPercent * naturalWidth) / 100,
        y: (finalPercentageCoordinates.yPercent * naturalHeight) / 100,
        width: (finalPercentageCoordinates.widthPercent * naturalWidth) / 100,
        height:
          (finalPercentageCoordinates.heightPercent * naturalHeight) / 100,
      };
    }

    // Create a complete hotspot with coordinates relative to original image
    const hotspot: Hotspot = {
      id,
      name: settings.name || "Untitled hotspot",
      type: "hotspot",
      hotspotType,
      coordinates: finalCoordinates,
      percentageCoordinates: finalPercentageCoordinates,
      settings: hotspotSettings,
    };

    // Add options for dropdown type
    if (hotspotType === "dropdown" && optionsList.length > 0) {
      hotspot.options = optionsList;
    }

    // Update existing hotspot or add new one
    const newHotspots = editMode
      ? [...hotspots].map((h) => (h.id === hotspot.id ? hotspot : h))
      : [...(hotspots || []), hotspot];

    setCurrentHotspot(null);
    setShowSettings(false);
    setEditMode(false);
    setEditingId(null);
    setHasBeenManuallyDragged(false); // Reset when closing
    onHotspotsChange?.(newHotspots);
  };

  // Helper function to render resize handles for a hotspot
  const renderResizeHandles = (hotspot: Hotspot) => {
    if (
      (!hotspot.coordinates && !hotspot.percentageCoordinates) ||
      !imageElementRef.current
    )
      return null;

    const isEditing =
      editingId === hotspot.id || resizingHotspot === hotspot.id;

    if (!isEditing) return null;

    // Create resize handles with more reliable positions and sizing
    return resizeHandles.map((handle) => {
      let handleStyle: React.CSSProperties = {
        position: "absolute",
        width: "16px", // Larger for easier targeting
        height: "16px", // Larger for easier targeting
        backgroundColor: "#444CE7",
        borderRadius: "50%",
        cursor: handle.cursor,
        zIndex: 10, // Higher z-index to ensure it's on top
        border: "2px solid white",
        boxShadow: "0 0 4px rgba(0,0,0,0.5)",
      };

      // Position the handle based on its position name
      switch (handle.position) {
        case "top-left":
          handleStyle.top = "-8px";
          handleStyle.left = "-8px";
          break;
        case "top-right":
          handleStyle.top = "-8px";
          handleStyle.right = "-8px";
          break;
        case "bottom-left":
          handleStyle.bottom = "-8px";
          handleStyle.left = "-8px";
          break;
        case "bottom-right":
          handleStyle.bottom = "-8px";
          handleStyle.right = "-8px";
          break;
        case "top":
          handleStyle.top = "-8px";
          handleStyle.left = "50%";
          handleStyle.transform = "translateX(-50%)";
          break;
        case "right":
          handleStyle.top = "50%";
          handleStyle.right = "-8px";
          handleStyle.transform = "translateY(-50%)";
          break;
        case "bottom":
          handleStyle.bottom = "-8px";
          handleStyle.left = "50%";
          handleStyle.transform = "translateX(-50%)";
          break;
        case "left":
          handleStyle.top = "50%";
          handleStyle.left = "-8px";
          handleStyle.transform = "translateY(-50%)";
          break;
      }

      return (
        <Box
          key={handle.position}
          style={handleStyle}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault(); // Prevent default to avoid text selection
            handleStartResize(e, hotspot.id, handle.position);
          }}
        />
      );
    });
  };

  // Helper function to render hotspots on the image - updated to use proper coordinate scaling
  const renderHotspot = (hotspot: Hotspot) => {
    if (
      (!hotspot.coordinates && !hotspot.percentageCoordinates) ||
      !imageElementRef.current
    )
      return null;

    // Get scaled coordinates using our improved function
    const renderedCoords = getScaledCoordinates(
      hotspot.percentageCoordinates || hotspot.coordinates,
      imageElementRef.current,
    );

    if (!renderedCoords) return null;

    // Determine states for visual styling
    const isMoving = movingHotspot === hotspot.id;
    const isResizing = resizingHotspot === hotspot.id;
    const isEditing = editingId === hotspot.id;
    const isActive = isMoving || isResizing || isEditing;
    const isHovered = hoveredHotspot === hotspot.id;

    // Get tooltip text for hotspot
    const tooltipText = `${getHotspotTypeName(hotspot.hotspotType)}: ${
      hotspot.name
    }`;

    // Get the icon for the hotspot type
    const hotspotIcon = getHotspotTypeIcon(hotspot.hotspotType);

    return (
      <Tooltip
        key={hotspot.id}
        title={tooltipText}
        arrow
        placement="top"
        PopperProps={{
          sx: { zIndex: 1400 },
        }}
      >
        <Box
          onClick={(e) => {
            e.stopPropagation();
            if (!isEditing && !isMoving && !isResizing) {
              onEditHotspot?.(hotspot);
            }
          }}
          onMouseEnter={() => setHoveredHotspot(hotspot.id)}
          onMouseLeave={() => setHoveredHotspot(null)}
          sx={{
            position: "absolute",
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
            backgroundColor: isHovered
              ? "rgba(68, 76, 231, 0.2)"
              : "rgba(68, 76, 231, 0.1)",
            cursor: isMoving ? "move" : "pointer",
            transition: "background-color 0.2s ease",
            // Add hotspot label for better identification
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
                    handleStartMove(e, hotspot.id);
                  }
                }
          }
        >
          {/* Type icon indicator in top left */}
          {isHovered && (
            <Box
              sx={{
                position: "absolute",
                top: "4px",
                left: "4px",
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
              {hotspotIcon}
            </Box>
          )}

          {/* Add resize handles when hotspot is being edited */}
          {renderResizeHandles(hotspot)}
        </Box>
      </Tooltip>
    );
  };

  const renderMasking = (masking: Masking) => {
    if (
      (!masking.coordinates && !masking.percentageCoordinates) ||
      !imageElementRef.current
    )
      return null;

    // Get scaled coordinates using our improved function
    const renderedCoords = getScaledCoordinates(
      masking.percentageCoordinates || masking.coordinates,
      imageElementRef.current,
    );

    if (!renderedCoords) return null;

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
          }}
          sx={{
            position: "absolute",
            left: `${renderedCoords.left}px`,
            top: `${renderedCoords.top}px`,
            width: `${renderedCoords.width}px`,
            height: `${renderedCoords.height}px`,
            border: "2px solid #00AB55 ",
            backgroundColor: masking.settings?.blur_mask
              ? withAlpha(masking.settings?.color || "rgba(0,0,0,1)", 0.4)
              : masking.settings?.color,
            cursor: "pointer",
            filter: "none",
            backdropFilter: masking.settings?.blur_mask ? "blur(2px)" : "none",
            transition: "background-color 0.2s ease",
          }}
        >
          {/* Add resize handles when masking is being edited */}
          {/* renderResizeHandles would need to be adapted for masking */}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {imageError && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {imageError}
        </Alert>
      )}

      <Box
        onClick={() => {
          if (editMode) {
            setEditMode(false);
            setEditingId(null);
            setShowSettings(false);
            setCurrentHotspot(null);
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
              Click to select a hotspot. Drag to move. Resize with the blue
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
            alt="Hotspot canvas"
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

        {/* Existing hotspots */}
        {Array.isArray(hotspots) && hotspots.map(renderHotspot)}
        {Array.isArray(maskings) && maskings.map(renderMasking)}

        {/* Currently drawing hotspot */}
        {currentHotspot &&
          (currentHotspot.coordinates ||
            currentHotspot.percentageCoordinates) &&
          !showSettings && (
            <Box
              sx={{
                position: "absolute",
                left: `${
                  getScaledCoordinates(
                    currentHotspot.percentageCoordinates ||
                      currentHotspot.coordinates,
                    imageElementRef.current,
                  )?.left || 0
                }px`,
                top: `${
                  getScaledCoordinates(
                    currentHotspot.percentageCoordinates ||
                      currentHotspot.coordinates,
                    imageElementRef.current,
                  )?.top || 0
                }px`,
                width: `${
                  getScaledCoordinates(
                    currentHotspot.percentageCoordinates ||
                      currentHotspot.coordinates,
                    imageElementRef.current,
                  )?.width || 0
                }px`,
                height: `${
                  getScaledCoordinates(
                    currentHotspot.percentageCoordinates ||
                      currentHotspot.coordinates,
                    imageElementRef.current,
                  )?.height || 0
                }px`,
                border: "2px solid #444CE7",
                backgroundColor: "rgba(68, 76, 231, 0.1)",
                pointerEvents: "none",
              }}
            />
          )}
      </Box>

      {/* Settings Dialog - Now with draggable header */}
      {showSettings && (
        <Paper
          elevation={6}
          sx={{
            position: "fixed",
            top: dialogPosition.top,
            left: dialogPosition.left,
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
            {/* Header - Now draggable */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                cursor: "move",
                bgcolor: "#F5F6FF",
                py: 1,
                px: 1,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                userSelect: "none", // Prevent text selection while dragging
              }}
              onMouseDown={(e) => {
                // Start dragging
                setIsDraggingModal(true);
                setDragOffset({
                  x: e.clientX - dialogPosition.left,
                  y: e.clientY - dialogPosition.top,
                });
                e.preventDefault(); // Prevent text selection
              }}
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
                    <AddIcon sx={{ fontSize: 18, color: "#444CE7" }} />
                  )}
                </Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  fontSize="18px"
                >
                  {editMode ? "Edit Hotspot" : "Add Hotspot"}
                </Typography>
              </Stack>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(false);
                  setCurrentHotspot(null);
                  setEditMode(false);
                  setEditingId(null);
                  setHasBeenManuallyDragged(false); // Reset when closing
                }}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>

            {/* Form Fields */}
            <Stack spacing={2}>
              <TextField
                size="medium"
                label="Name *"
                value={currentHotspot?.name || ""}
                placeholder="Untitled hotspot"
                onChange={(e) =>
                  setCurrentHotspot((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                onClick={(e) => {
                  if (!currentHotspot?.name) {
                    setCurrentHotspot((prev) => ({
                      ...prev,
                      name: "",
                    }));
                  }
                }}
                InputProps={{
                  style: { height: "48px" },
                }}
              />

              <FormControl fullWidth size="medium">
                <InputLabel id="hotspot-type-label">Type</InputLabel>
                <Select
                  labelId="hotspot-type-label"
                  label="Type"
                  value={currentHotspot?.hotspotType || "button"}
                  onChange={(e) =>
                    setCurrentHotspot((prev) => ({
                      ...prev,
                      hotspotType: e.target.value as Hotspot["hotspotType"],
                    }))
                  }
                  sx={{ height: "48px" }}
                >
                  <MenuItem value="button">Button</MenuItem>
                  <MenuItem value="dropdown">Dropdown</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                  <MenuItem value="textfield">Text Field</MenuItem>
                  <MenuItem value="highlight">Highlight</MenuItem>
                  <MenuItem value="coaching">Coaching Tip</MenuItem>
                </Select>
              </FormControl>

              {/* Coordinates display (read-only) */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  padding: 1.5,
                  backgroundColor: "#f5f5f5",
                }}
              >
                <Typography variant="body2" fontWeight="600">
                  Dimensions:
                </Typography>
                <Typography variant="body2">
                  {currentHotspot?.coordinates
                    ? `W: ${Math.round(currentHotspot.coordinates.width)}, 
                     H: ${Math.round(currentHotspot.coordinates.height)}`
                    : "No coordinates"}
                </Typography>
              </Box>

              {/* Common settings for all hotspot types */}
              <FormControl
                fullWidth
                size="medium"
                error={
                  !!timeoutError &&
                  (currentHotspot?.hotspotType === "highlight" ||
                    currentHotspot?.hotspotType === "coaching")
                }
              >
                <InputLabel>Timeout Duration</InputLabel>
                <Select
                  label="Timeout Duration"
                  value={currentHotspot?.settings?.timeoutDuration ?? 0}
                  onChange={(e) =>
                    setCurrentHotspot((prev) => ({
                      ...prev,
                      settings: {
                        ...prev?.settings,
                        timeoutDuration: e.target.value as number,
                      },
                    }))
                  }
                  sx={{ height: "48px" }}
                  startAdornment={
                    <InputAdornment position="start">
                      <TimerIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value={0}>Disabled</MenuItem>
                  {[1, 2, 3, 4, 5, 7, 10, 15, 20, 30].map((duration) => (
                    <MenuItem key={duration} value={duration}>
                      {duration} sec
                    </MenuItem>
                  ))}
                </Select>
                {timeoutError &&
                  (currentHotspot?.hotspotType === "highlight" ||
                    currentHotspot?.hotspotType === "coaching") && (
                    <FormHelperText>{timeoutError}</FormHelperText>
                  )}
                {(currentHotspot?.hotspotType === "highlight" ||
                  currentHotspot?.hotspotType === "coaching") && (
                  <FormHelperText>
                    *Required for highlight and coaching hotspots
                  </FormHelperText>
                )}
              </FormControl>

              {/* Highlight color setting for all hotspot types */}
              <TextField
                size="medium"
                fullWidth
                label="Highlight Color"
                value={
                  // Show hex value to user
                  (() => {
                    const rgba =
                      currentHotspot?.settings?.highlightColor ||
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
                  // Convert hex to rgba
                  const colorValue = e.target.value;
                  if (colorValue.startsWith("#")) {
                    // Convert hex to rgba
                    const r = parseInt(colorValue.slice(1, 3), 16);
                    const g = parseInt(colorValue.slice(3, 5), 16);
                    const b = parseInt(colorValue.slice(5, 7), 16);
                    const rgba = `rgba(${r}, ${g}, ${b}, 1)`;

                    setCurrentHotspot((prev) => ({
                      ...prev,
                      settings: {
                        ...prev?.settings,
                        highlightColor: rgba,
                      },
                    }));
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
                            currentHotspot?.settings?.highlightColor ||
                            "rgba(255, 193, 7, 0.8)",
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
                              currentHotspot?.settings?.highlightColor ||
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
                              currentHotspot?.settings?.highlightColor || "";
                            const match = rgba.match(
                              /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/,
                            );
                            return match ? parseFloat(match[1]) : 1;
                          })();

                          const rgba = `rgba(${r}, ${g}, ${b}, ${currentAlpha})`;

                          setCurrentHotspot((prev) => ({
                            ...prev,
                            settings: {
                              ...prev?.settings,
                              highlightColor: rgba,
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

                      setCurrentHotspot((prev) => ({
                        ...prev,
                        settings: {
                          ...prev?.settings,
                          highlightColor: rgba,
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

              {/* Type-specific settings */}
              {currentHotspot?.hotspotType === "button" && (
                <>
                  <Stack direction="row" spacing={2}>
                    <FormControl fullWidth size="medium">
                      <InputLabel>Font</InputLabel>
                      <Select
                        label="Font"
                        value={currentHotspot?.settings?.font || "Inter"}
                        onChange={(e) =>
                          setCurrentHotspot((prev) => ({
                            ...prev,
                            settings: {
                              ...prev?.settings,
                              font: e.target.value as string,
                            },
                          }))
                        }
                        sx={{ height: "48px" }}
                      >
                        <MenuItem value="Inter">Inter</MenuItem>
                        <MenuItem value="Arial">Arial</MenuItem>
                        <MenuItem value="Roboto">Roboto</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="medium">
                      <InputLabel>Size</InputLabel>
                      <Select
                        label="Size"
                        value={currentHotspot?.settings?.fontSize || 16}
                        onChange={(e) =>
                          setCurrentHotspot((prev) => ({
                            ...prev,
                            settings: {
                              ...prev?.settings,
                              fontSize: e.target.value as number,
                            },
                          }))
                        }
                        sx={{ height: "48px" }}
                      >
                        {[12, 14, 16, 18, 20].map((size) => (
                          <MenuItem key={size} value={size}>
                            {size}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <Box>
                      <TextField
                        size="medium"
                        fullWidth
                        label="Button Color"
                        value={
                          currentHotspot?.settings?.buttonColor || "#00AB55"
                        }
                        onChange={(e) =>
                          setCurrentHotspot((prev) => ({
                            ...prev,
                            settings: {
                              ...prev?.settings,
                              buttonColor: e.target.value,
                            },
                          }))
                        }
                        InputProps={{
                          style: { height: "48px" },
                          startAdornment: (
                            <InputAdornment position="start">
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  bgcolor:
                                    currentHotspot?.settings?.buttonColor ||
                                    "#00AB55",
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
                                  currentHotspot?.settings?.buttonColor ||
                                  "#00AB55"
                                }
                                onChange={(e) =>
                                  setCurrentHotspot((prev) => ({
                                    ...prev,
                                    settings: {
                                      ...prev?.settings,
                                      buttonColor: e.target.value,
                                    },
                                  }))
                                }
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
                            onClick={() =>
                              setCurrentHotspot((prev) => ({
                                ...prev,
                                settings: {
                                  ...prev?.settings,
                                  buttonColor: color.value,
                                },
                              }))
                            }
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
                    </Box>

                    <Box>
                      <TextField
                        size="medium"
                        fullWidth
                        label="Text Color"
                        value={currentHotspot?.settings?.textColor || "#FFFFFF"}
                        onChange={(e) =>
                          setCurrentHotspot((prev) => ({
                            ...prev,
                            settings: {
                              ...prev?.settings,
                              textColor: e.target.value,
                            },
                          }))
                        }
                        InputProps={{
                          style: { height: "48px" },
                          startAdornment: (
                            <InputAdornment position="start">
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  bgcolor:
                                    currentHotspot?.settings?.textColor ||
                                    "#FFFFFF",
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
                                  currentHotspot?.settings?.textColor ||
                                  "#FFFFFF"
                                }
                                onChange={(e) =>
                                  setCurrentHotspot((prev) => ({
                                    ...prev,
                                    settings: {
                                      ...prev?.settings,
                                      textColor: e.target.value,
                                    },
                                  }))
                                }
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
                            onClick={() =>
                              setCurrentHotspot((prev) => ({
                                ...prev,
                                settings: {
                                  ...prev?.settings,
                                  textColor: color.value,
                                },
                              }))
                            }
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
                    </Box>
                  </Stack>
                </>
              )}

              {/* Dropdown-specific settings */}
              {currentHotspot?.hotspotType === "dropdown" && (
                <Stack spacing={2}>
                  <TextField
                    size="medium"
                    label="Placeholder"
                    value={currentHotspot?.settings?.placeholder || ""}
                    placeholder="Select an option"
                    onChange={(e) =>
                      setCurrentHotspot((prev) => ({
                        ...prev,
                        settings: {
                          ...prev?.settings,
                          placeholder: e.target.value,
                        },
                      }))
                    }
                    onClick={(e) => {
                      if (!currentHotspot?.settings?.placeholder) {
                        setCurrentHotspot((prev) => ({
                          ...prev,
                          settings: {
                            ...prev?.settings,
                            placeholder: "",
                          },
                        }));
                      }
                    }}
                    InputProps={{
                      style: { height: "48px" },
                    }}
                  />
                  <Typography variant="body1">Dropdown Options</Typography>

                  {/* Options chip display */}
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 0 }}
                  >
                    {optionsList.map((option, index) => (
                      <Chip
                        key={index}
                        label={option}
                        onDelete={() => handleDeleteOption(option)}
                        size="medium"
                        sx={{ margin: "2px", py: 1.5, px: 1, height: "32px" }}
                      />
                    ))}
                  </Box>

                  {/* Add option input */}
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      fullWidth
                      label="New Option"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      InputProps={{
                        style: { height: "40px" },
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleAddOption}
                      disabled={!newOption.trim()}
                      sx={{ height: "40px", minWidth: "60px" }}
                    >
                      Add
                    </Button>
                  </Stack>
                  <TextField
                    size="medium"
                    label="Expected Value"
                    value={currentHotspot?.settings?.expectedValue || ""}
                    placeholder="Enter text..."
                    onChange={(e) =>
                      setCurrentHotspot((prev) => ({
                        ...prev,
                        settings: {
                          ...prev?.settings,
                          expectedValue: e.target.value,
                        },
                      }))
                    }
                    onClick={(e) => {
                      if (!currentHotspot?.settings?.placeholder) {
                        setCurrentHotspot((prev) => ({
                          ...prev,
                          settings: {
                            ...prev?.settings,
                            expectedValue: "",
                          },
                        }));
                      }
                    }}
                    InputProps={{
                      style: { height: "48px" },
                    }}
                  />
                </Stack>
              )}

              {/* TextField-specific settings */}
              {currentHotspot?.hotspotType === "textfield" && (
                <>
                  <TextField
                    size="medium"
                    label="Placeholder"
                    value={currentHotspot?.settings?.placeholder || ""}
                    placeholder="Enter text..."
                    onChange={(e) =>
                      setCurrentHotspot((prev) => ({
                        ...prev,
                        settings: {
                          ...prev?.settings,
                          placeholder: e.target.value,
                        },
                      }))
                    }
                    onClick={(e) => {
                      if (!currentHotspot?.settings?.placeholder) {
                        setCurrentHotspot((prev) => ({
                          ...prev,
                          settings: {
                            ...prev?.settings,
                            placeholder: "",
                          },
                        }));
                      }
                    }}
                    InputProps={{
                      style: { height: "48px" },
                    }}
                  />
                  <TextField
                    size="medium"
                    label="Expected Value"
                    value={currentHotspot?.settings?.expectedValue || ""}
                    placeholder="Enter text..."
                    onChange={(e) =>
                      setCurrentHotspot((prev) => ({
                        ...prev,
                        settings: {
                          ...prev?.settings,
                          expectedValue: e.target.value,
                        },
                      }))
                    }
                    onClick={(e) => {
                      if (!currentHotspot?.settings?.placeholder) {
                        setCurrentHotspot((prev) => ({
                          ...prev,
                          settings: {
                            ...prev?.settings,
                            expectedValue: "",
                          },
                        }));
                      }
                    }}
                    InputProps={{
                      style: { height: "48px" },
                    }}
                  />
                </>
              )}

              {/* Coaching-specific settings */}
              {currentHotspot?.hotspotType === "coaching" && (
                <>
                  <TextField
                    size="medium"
                    label="Tip Text"
                    multiline
                    rows={2}
                    value={currentHotspot?.settings?.tipText || ""}
                    placeholder="Coaching tip"
                    onChange={(e) =>
                      setCurrentHotspot((prev) => ({
                        ...prev,
                        settings: {
                          ...prev?.settings,
                          tipText: e.target.value,
                        },
                      }))
                    }
                    onClick={(e) => {
                      if (!currentHotspot?.settings?.tipText) {
                        setCurrentHotspot((prev) => ({
                          ...prev,
                          settings: {
                            ...prev?.settings,
                            tipText: "",
                          },
                        }));
                      }
                    }}
                  />

                  {/* Add color options - same as button type */}
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        size="medium"
                        fullWidth
                        label="Background Color"
                        value={
                          currentHotspot?.settings?.buttonColor || "#1e293b"
                        }
                        onChange={(e) =>
                          setCurrentHotspot((prev) => ({
                            ...prev,
                            settings: {
                              ...prev?.settings,
                              buttonColor: e.target.value,
                            },
                          }))
                        }
                        InputProps={{
                          style: { height: "48px" },
                          startAdornment: (
                            <InputAdornment position="start">
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  bgcolor:
                                    currentHotspot?.settings?.buttonColor ||
                                    "#1e293b",
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
                                  currentHotspot?.settings?.buttonColor ||
                                  "#1e293b"
                                }
                                onChange={(e) =>
                                  setCurrentHotspot((prev) => ({
                                    ...prev,
                                    settings: {
                                      ...prev?.settings,
                                      buttonColor: e.target.value,
                                    },
                                  }))
                                }
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
                            onClick={() =>
                              setCurrentHotspot((prev) => ({
                                ...prev,
                                settings: {
                                  ...prev?.settings,
                                  buttonColor: color.value,
                                },
                              }))
                            }
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
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <TextField
                        size="medium"
                        fullWidth
                        label="Text Color"
                        value={currentHotspot?.settings?.textColor || "#FFFFFF"}
                        onChange={(e) =>
                          setCurrentHotspot((prev) => ({
                            ...prev,
                            settings: {
                              ...prev?.settings,
                              textColor: e.target.value,
                            },
                          }))
                        }
                        InputProps={{
                          style: { height: "48px" },
                          startAdornment: (
                            <InputAdornment position="start">
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  bgcolor:
                                    currentHotspot?.settings?.textColor ||
                                    "#FFFFFF",
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
                                  currentHotspot?.settings?.textColor ||
                                  "#FFFFFF"
                                }
                                onChange={(e) =>
                                  setCurrentHotspot((prev) => ({
                                    ...prev,
                                    settings: {
                                      ...prev?.settings,
                                      textColor: e.target.value,
                                    },
                                  }))
                                }
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
                            onClick={() =>
                              setCurrentHotspot((prev) => ({
                                ...prev,
                                settings: {
                                  ...prev?.settings,
                                  textColor: color.value,
                                },
                              }))
                            }
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
                    </Box>
                  </Stack>
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
                  setShowSettings(false);
                  setCurrentHotspot(null);
                  setEditMode(false);
                  setEditingId(null);
                  setHasBeenManuallyDragged(false); // Reset when closing
                }}
                sx={{ textTransform: "none", py: 1 }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSettingsSave(currentHotspot || {});
                }}
                sx={{
                  bgcolor: "#444CE7",
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

export default ImageHotspot;
