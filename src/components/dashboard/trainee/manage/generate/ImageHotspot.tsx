import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentHotspot, setCurrentHotspot] = useState<Partial<Hotspot> | null>(
    null
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
    null
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
  } | null>(null);

  // Add hover state for showing hotspot type tooltip
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

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

  // Parse RGBA color string to components
  const parseRgba = (rgbaStr: string) => {
    // Default fallback
    let result = { r: 255, g: 193, b: 7, a: 0.8 };

    try {
      // Parse "rgba(r, g, b, a)" format
      const match = rgbaStr.match(
        /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/
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

  // Track image size and scale changes - crucial for accurate hotspot positioning
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
              `Image scales updated - width: ${widthScale}, height: ${heightScale}`
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

    // Cleanup
    return () => {
      resizeObserver.disconnect();
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !imageElementRef.current) return;

    const img = imageElementRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();

    // Store coordinates relative to ORIGINAL image size (not the rendered size)
    // This is the key to making hotspots work correctly at any scale
    const x = (e.clientX - rect.left) / imageScale.width;
    const y = (e.clientY - rect.top) / imageScale.height;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current || !imageElementRef.current) return;

    const img = imageElementRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();

    // Get the current mouse position in original image coordinates
    const x = (e.clientX - rect.left) / imageScale.width;
    const y = (e.clientY - rect.top) / imageScale.height;

    // Create a properly structured coordinates object that stores positions
    // in the original image coordinate system
    const coordinates = {
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    };

    setCurrentHotspot({
      coordinates: coordinates,
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
    if (!isDrawing || !currentHotspot || !currentHotspot.coordinates) return;
    setIsDrawing(false);

    // Only calculate dialog position and show settings if the rectangle has some size
    if (
      currentHotspot.coordinates &&
      (currentHotspot.coordinates.width > 5 ||
        currentHotspot.coordinates.height > 5)
    ) {
      calculateDialogPosition(currentHotspot);
      setShowSettings(true);
    }
  };

  // Start moving a hotspot
  const handleStartMove = (e: React.MouseEvent, hotspotId: string) => {
    e.stopPropagation();
    if (!imageElementRef.current) return;

    // Find the hotspot
    const hotspot = hotspots.find((h) => h.id === hotspotId);
    if (!hotspot || !hotspot.coordinates) return;

    const rect = imageElementRef.current.getBoundingClientRect();

    // Store starting mouse position in screen coordinates
    setMoveStart({
      x: e.clientX - (hotspot.coordinates.x * imageScale.width + rect.left),
      y: e.clientY - (hotspot.coordinates.y * imageScale.height + rect.top),
    });

    setMovingHotspot(hotspotId);
    setEditingHotspot(null); // Cancel any active editing
  };

  // Handle mouse movement during the move
  const handleMoveHotspot = (e: React.MouseEvent) => {
    if (!movingHotspot || !imageElementRef.current) return;

    const hotspot = hotspots.find((h) => h.id === movingHotspot);
    if (!hotspot || !hotspot.coordinates) return;

    const rect = imageElementRef.current.getBoundingClientRect();

    // Calculate new position in original image coordinates
    const newX = Math.max(
      0,
      Math.min(
        (e.clientX - moveStart.x - rect.left) / imageScale.width,
        originalImageSize.width - hotspot.coordinates.width
      )
    );

    const newY = Math.max(
      0,
      Math.min(
        (e.clientY - moveStart.y - rect.top) / imageScale.height,
        originalImageSize.height - hotspot.coordinates.height
      )
    );

    // Update all hotspots with the moved one
    const updatedHotspots = hotspots.map((h) => {
      if (h.id === movingHotspot) {
        return {
          ...h,
          coordinates: {
            ...h.coordinates,
            x: newX,
            y: newY,
          },
        };
      }
      return h;
    });

    // Update parent with the new positions
    onHotspotsChange?.(updatedHotspots);
  };

  // End the move operation
  const handleEndMove = () => {
    setMovingHotspot(null);
  };

  // Start resizing a hotspot
  const handleStartResize = (
    e: React.MouseEvent,
    hotspotId: string,
    handle: string
  ) => {
    e.stopPropagation();
    if (!imageElementRef.current) return;

    // Find the hotspot
    const hotspot = hotspots.find((h) => h.id === hotspotId);
    if (!hotspot || !hotspot.coordinates) return;

    // Store starting mouse position in screen coordinates
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
    });

    // Store original hotspot coordinates for reference during resize
    setResizeOriginal({
      x: hotspot.coordinates.x,
      y: hotspot.coordinates.y,
      width: hotspot.coordinates.width,
      height: hotspot.coordinates.height,
    });

    setResizingHotspot(hotspotId);
    setResizeHandle(handle);

    // Important: DON'T set editingHotspot to null here to keep the selected state
    // This allows the resizing to be reflected in the currently edited hotspot
    if (editingHotspot?.id !== hotspotId) {
      setEditingHotspot(null);
    }
  };

  // Handle mouse movement during resize
  const handleResizeHotspot = (e: React.MouseEvent) => {
    if (
      !resizingHotspot ||
      !imageElementRef.current ||
      !resizeHandle ||
      !resizeOriginal
    )
      return;

    const hotspot = hotspots.find((h) => h.id === resizingHotspot);
    if (!hotspot || !hotspot.coordinates) return;

    const rect = imageElementRef.current.getBoundingClientRect();

    // Calculate mouse movement in original image coordinates
    const deltaX = (e.clientX - resizeStart.x) / imageScale.width;
    const deltaY = (e.clientY - resizeStart.y) / imageScale.height;

    // Initialize new coordinates with original values
    let newX = resizeOriginal.x;
    let newY = resizeOriginal.y;
    let newWidth = resizeOriginal.width;
    let newHeight = resizeOriginal.height;

    // Update coordinates based on which handle is being dragged
    switch (resizeHandle) {
      case "top-left":
        newX = Math.min(
          resizeOriginal.x + resizeOriginal.width - 5,
          Math.max(0, resizeOriginal.x + deltaX)
        );
        newY = Math.min(
          resizeOriginal.y + resizeOriginal.height - 5,
          Math.max(0, resizeOriginal.y + deltaY)
        );
        newWidth = resizeOriginal.width - (newX - resizeOriginal.x);
        newHeight = resizeOriginal.height - (newY - resizeOriginal.y);
        break;
      case "top-right":
        newY = Math.min(
          resizeOriginal.y + resizeOriginal.height - 5,
          Math.max(0, resizeOriginal.y + deltaY)
        );
        newWidth = Math.max(5, resizeOriginal.width + deltaX);
        newWidth = Math.min(newWidth, originalImageSize.width - newX);
        newHeight = resizeOriginal.height - (newY - resizeOriginal.y);
        break;
      case "bottom-left":
        newX = Math.min(
          resizeOriginal.x + resizeOriginal.width - 5,
          Math.max(0, resizeOriginal.x + deltaX)
        );
        newWidth = resizeOriginal.width - (newX - resizeOriginal.x);
        newHeight = Math.max(5, resizeOriginal.height + deltaY);
        newHeight = Math.min(newHeight, originalImageSize.height - newY);
        break;
      case "bottom-right":
        newWidth = Math.max(5, resizeOriginal.width + deltaX);
        newHeight = Math.max(5, resizeOriginal.height + deltaY);
        newWidth = Math.min(newWidth, originalImageSize.width - newX);
        newHeight = Math.min(newHeight, originalImageSize.height - newY);
        break;
      case "top":
        newY = Math.min(
          resizeOriginal.y + resizeOriginal.height - 5,
          Math.max(0, resizeOriginal.y + deltaY)
        );
        newHeight = resizeOriginal.height - (newY - resizeOriginal.y);
        break;
      case "right":
        newWidth = Math.max(5, resizeOriginal.width + deltaX);
        newWidth = Math.min(newWidth, originalImageSize.width - newX);
        break;
      case "bottom":
        newHeight = Math.max(5, resizeOriginal.height + deltaY);
        newHeight = Math.min(newHeight, originalImageSize.height - newY);
        break;
      case "left":
        newX = Math.min(
          resizeOriginal.x + resizeOriginal.width - 5,
          Math.max(0, resizeOriginal.x + deltaX)
        );
        newWidth = resizeOriginal.width - (newX - resizeOriginal.x);
        break;
    }

    // Ensure minimum size
    newWidth = Math.max(5, newWidth);
    newHeight = Math.max(5, newHeight);

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

  // Replace the existing calculateDialogPosition function with this improved version:
  const calculateDialogPosition = (hotspot: Partial<Hotspot>) => {
    if (
      !containerRef.current ||
      !hotspot ||
      !hotspot.coordinates ||
      !imageElementRef.current
    )
      return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const img = imageElementRef.current;
    if (!img) return;

    const imgRect = img.getBoundingClientRect();
    const dialogHeight = 480; // Reduced fixed dialog height
    const dialogWidth = 320; // Fixed dialog width
    const padding = 16; // Padding from edges

    // Convert from original image coordinates to screen coordinates
    const x = hotspot.coordinates.x * imageScale.width + imgRect.left;
    const y = hotspot.coordinates.y * imageScale.height + imgRect.top;
    const width = hotspot.coordinates.width * imageScale.width;
    const height = hotspot.coordinates.height * imageScale.height;

    // Get the most accurate viewport dimensions
    const viewportWidth = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    );
    const viewportHeight = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0
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

    // Calculate optimal position based on available space

    // Check if there's enough space to the right
    const rightSpace = effectiveRight - (x + width);
    const leftSpace = x - scrollRect.left;

    // Determine optimal horizontal position
    let left;
    if (rightSpace >= dialogWidth + padding) {
      // Position to the right of the hotspot
      left = x + width + padding;
    } else if (leftSpace >= dialogWidth + padding) {
      // Position to the left of the hotspot
      left = x - dialogWidth - padding;
    } else {
      // Center it if neither side has enough space
      // But ensure it doesn't go outside boundaries
      left = Math.max(
        padding + scrollRect.left,
        Math.min(
          x + width / 2 - dialogWidth / 2,
          effectiveRight - dialogWidth - padding
        )
      );
    }

    // Get the distance from the top of the viewport to determine vertical space
    const topSpace = y - scrollRect.top;
    const bottomSpace = effectiveBottom - (y + height);

    // Determine optimal vertical position
    let top;
    if (
      dialogHeight <=
      Math.min(viewportHeight - 2 * padding, scrollContainer.clientHeight)
    ) {
      // Dialog can fit in viewport height
      if (topSpace >= dialogHeight / 2 && bottomSpace >= dialogHeight / 2) {
        // Center it vertically relative to the hotspot
        top = y + height / 2 - dialogHeight / 2;
      } else if (bottomSpace >= dialogHeight) {
        // Position below the hotspot
        top = y + height + padding;
      } else if (topSpace >= dialogHeight) {
        // Position above the hotspot
        top = y - dialogHeight - padding;
      } else {
        // Place it as high as possible while keeping it visible
        top = Math.max(
          scrollRect.top + padding,
          Math.min(
            y - dialogHeight / 2,
            effectiveBottom - dialogHeight - padding
          )
        );
      }
    } else {
      // Dialog is taller than viewport - position at top with minimum padding
      top = scrollRect.top + padding;
    }

    // Final boundary check
    left = Math.max(
      scrollRect.left + padding,
      Math.min(left, effectiveRight - dialogWidth - padding)
    );
    top = Math.max(
      scrollRect.top + padding,
      Math.min(top, effectiveBottom - dialogHeight - padding)
    );

    setDialogPosition({ top, left });

    // Log position for debugging
    console.log("Dialog positioned at:", { top, left });
  };

  // Also add this effect to recalculate positions when the container changes
  useEffect(() => {
    const mainContentElement =
      containerRef.current?.closest('[role="main"]') ||
      containerRef.current?.closest("main") ||
      containerRef.current?.parentElement;

    if (mainContentElement) {
      const resizeObserver = new ResizeObserver(() => {
        if (currentHotspot && showSettings) {
          calculateDialogPosition(currentHotspot);
        }
      });

      resizeObserver.observe(mainContentElement);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [showSettings, currentHotspot]);

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
      (option) => option !== optionToDelete
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

  const handleSettingsSave = (settings: Partial<Hotspot>) => {
    // Ensure currentHotspot and coordinates exist
    if (!currentHotspot || !currentHotspot.coordinates) {
      console.error(
        "Cannot save hotspot - missing coordinates:",
        currentHotspot
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
        "Timeout duration is required for highlight and coaching hotspots"
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

    // Create a complete hotspot with coordinates relative to original image
    const hotspot: Hotspot = {
      id,
      name: settings.name || "Untitled hotspot",
      type: "hotspot",
      hotspotType,
      coordinates: {
        // Use coordinates from currentHotspot, which may have been updated via resizing
        x: Number(currentHotspot.coordinates.x),
        y: Number(currentHotspot.coordinates.y),
        width: Number(currentHotspot.coordinates.width),
        height: Number(currentHotspot.coordinates.height),
      },
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
    onHotspotsChange?.(newHotspots);
  };

  // Helper function to render resize handles for a hotspot
  const renderResizeHandles = (hotspot: Hotspot) => {
    if (!hotspot.coordinates || !imageElementRef.current) return null;

    const isEditing =
      editingId === hotspot.id || resizingHotspot === hotspot.id;

    if (!isEditing) return null;

    // Create resize handles for the hotspot
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
            handleStartResize(e, hotspot.id, handle.position);
          }}
        />
      );
    });
  };

  // Helper function to render hotspots on the image - converts from original image coordinates to rendered coordinates
  const renderHotspot = (hotspot: Hotspot) => {
    if (!hotspot.coordinates || !imageElementRef.current) return null;

    // Convert coordinates from original image coordinates to rendered coordinates
    const scaledCoords = {
      left: hotspot.coordinates.x * imageScale.width,
      top: hotspot.coordinates.y * imageScale.height,
      width: hotspot.coordinates.width * imageScale.width,
      height: hotspot.coordinates.height * imageScale.height,
    };

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
            left: `${scaledCoords.left}px`,
            top: `${scaledCoords.top}px`,
            width: `${scaledCoords.width}px`,
            height: `${scaledCoords.height}px`,
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
    if (!masking.coordinates || !imageElementRef.current) return null;

    // Convert coordinates from original image coordinates to rendered coordinates
    const scaledCoords = {
      left: masking.coordinates.x * imageScale.width,
      top: masking.coordinates.y * imageScale.height,
      width: masking.coordinates.width * imageScale.width,
      height: masking.coordinates.height * imageScale.height,
    };

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
            left: `${scaledCoords.left}px`,
            top: `${scaledCoords.top}px`,
            width: `${scaledCoords.width}px`,
            height: `${scaledCoords.height}px`,
            border: "2px solid #00AB55 ",
            backgroundColor: masking.settings?.color,
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          }}
        >
          {" "}
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
            setCurrentHotspot(null);
          }
        }}
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
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
                processedImageUrl
              );
              setImageError("Could not load image");
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
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
        {currentHotspot && currentHotspot.coordinates && !showSettings && (
          <Box
            sx={{
              position: "absolute",
              left: `${currentHotspot.coordinates.x * imageScale.width}px`,
              top: `${currentHotspot.coordinates.y * imageScale.height}px`,
              width: `${currentHotspot.coordinates.width * imageScale.width}px`,
              height: `${
                currentHotspot.coordinates.height * imageScale.height
              }px`,
              border: "2px solid #444CE7",
              backgroundColor: "rgba(68, 76, 231, 0.1)",
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
              Math.min(dialogPosition.top, viewportSize.height - 480 - 16)
            ),
            left: Math.max(
              16,
              Math.min(dialogPosition.left, viewportSize.width - 550 - 16)
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
                      /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/
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
                              /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/
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
                              /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/
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
