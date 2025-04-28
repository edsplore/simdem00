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
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  ColorLens as ColorLensIcon,
  Timer as TimerIcon,
} from "@mui/icons-material";

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

const ImageHotspot: React.FC<ImageHotspotProps> = ({
  imageUrl,
  onHotspotsChange,
  hotspots = [],
  onEditHotspot,
  editingHotspot,
  containerWidth,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
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

  // Handle opening the color picker
  const handleOpenColorPicker = (event: React.MouseEvent<HTMLElement>) => {
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
        timeoutDuration: 2,
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
        originalImageSize.width - hotspot.coordinates.width,
      ),
    );

    const newY = Math.max(
      0,
      Math.min(
        (e.clientY - moveStart.y - rect.top) / imageScale.height,
        originalImageSize.height - hotspot.coordinates.height,
      ),
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
          effectiveRight - dialogWidth - padding,
        ),
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
      // For highlight and coaching, timeout is required
      return value !== undefined && value > 0;
    }
    // For other types, any timeout is valid (even undefined)
    return true;
  };

  const handleSettingsSave = (settings: Partial<Hotspot>) => {
    // Ensure currentHotspot and coordinates exist
    if (!currentHotspot || !currentHotspot.coordinates) {
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
      timeoutDuration: settings.settings?.timeoutDuration || 2, // Default 2 seconds
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
        };
        break;
      case "highlight":
        hotspotSettings = {
          ...commonSettings,
          // For highlight type, timeoutDuration is required
          timeoutDuration: settings.settings?.timeoutDuration || 3,
          highlightColor:
            settings.settings?.highlightColor || "rgba(255, 193, 7, 0.8)",
        };
        break;
      case "coaching":
        hotspotSettings = {
          ...commonSettings,
          // For coaching type, timeoutDuration is required
          timeoutDuration: settings.settings?.timeoutDuration || 3,
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
        // Keep coordinates relative to original image size (not rendered size)
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
    const isEditing = editingId === hotspot.id;

    return (
      <Box
        onClick={(e) => {
          e.stopPropagation();
          if (!isEditing && !isMoving) {
            onEditHotspot?.(hotspot);
          }
        }}
        key={hotspot.id}
        sx={{
          position: "absolute",
          left: `${scaledCoords.left}px`,
          top: `${scaledCoords.top}px`,
          width: `${scaledCoords.width}px`,
          height: `${scaledCoords.height}px`,
          border: "2px solid",
          borderColor: isEditing ? "#00AB55" : isMoving ? "#FF4785" : "#444CE7",
          backgroundColor: "rgba(68, 76, 231, 0.1)",
          cursor: isMoving ? "move" : "pointer",
          // Add move handle
          "&::before": {
            content: '""',
            position: "absolute",
            right: "-15px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: isEditing
              ? "#00AB55"
              : isMoving
                ? "#FF4785"
                : "#444CE7",
            cursor: "move",
            zIndex: 2,
          },
        }}
        onMouseDown={
          isMoving
            ? undefined
            : (e) => {
                if (e.target === e.currentTarget) {
                  handleStartMove(e, hotspot.id);
                }
              }
        }
      />
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

        {/* Currently drawing hotspot */}
        {currentHotspot && currentHotspot.coordinates && !showSettings && (
          <Box
            sx={{
              position: "absolute",
              left: `${currentHotspot.coordinates.x * imageScale.width}px`,
              top: `${currentHotspot.coordinates.y * imageScale.height}px`,
              width: `${currentHotspot.coordinates.width * imageScale.width}px`,
              height: `${currentHotspot.coordinates.height * imageScale.height}px`,
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
                defaultValue={currentHotspot?.name || "Untitled button"}
                onChange={(e) =>
                  setCurrentHotspot((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
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

              {/* Common settings for all hotspot types */}
              <FormControl fullWidth size="medium" error={!!timeoutError}>
                <InputLabel>Timeout Duration</InputLabel>
                <Select
                  label="Timeout Duration"
                  value={currentHotspot?.settings?.timeoutDuration || 2}
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
                  {[1, 2, 3, 4, 5, 7, 10, 15, 20, 30].map((duration) => (
                    <MenuItem key={duration} value={duration}>
                      {duration} sec
                    </MenuItem>
                  ))}
                </Select>
                {timeoutError && (
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
                  currentHotspot?.settings?.highlightColor ||
                  "rgba(255, 193, 7, 0.8)"
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
                            currentHotspot?.settings?.highlightColor ||
                            "rgba(255, 193, 7, 0.8)",
                          borderRadius: 0.5,
                        }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleOpenColorPicker}
                        sx={{ color: "primary.main" }}
                      >
                        <ColorLensIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  readOnly: true,
                }}
              />

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
                    value={
                      currentHotspot?.settings?.placeholder ||
                      "Select an option"
                    }
                    onChange={(e) =>
                      setCurrentHotspot((prev) => ({
                        ...prev,
                        settings: {
                          ...prev?.settings,
                          placeholder: e.target.value,
                        },
                      }))
                    }
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
                <TextField
                  size="medium"
                  label="Placeholder"
                  value={
                    currentHotspot?.settings?.placeholder || "Enter text..."
                  }
                  onChange={(e) =>
                    setCurrentHotspot((prev) => ({
                      ...prev,
                      settings: {
                        ...prev?.settings,
                        placeholder: e.target.value,
                      },
                    }))
                  }
                  InputProps={{
                    style: { height: "48px" },
                  }}
                />
              )}

              {/* Coaching-specific settings */}
              {currentHotspot?.hotspotType === "coaching" && (
                <>
                  <TextField
                    size="medium"
                    label="Tip Text"
                    multiline
                    rows={2}
                    value={currentHotspot?.settings?.tipText || "Coaching tip"}
                    onChange={(e) =>
                      setCurrentHotspot((prev) => ({
                        ...prev,
                        settings: {
                          ...prev?.settings,
                          tipText: e.target.value,
                        },
                      }))
                    }
                  />

                  {/* Add color options - same as button type */}
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        size="medium"
                        fullWidth
                        label="Button Color"
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

      {/* RGBA Color Picker Popover */}
      <Popover
        open={Boolean(colorPickerAnchorEl)}
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
        <Paper sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            RGBA Color Picker
          </Typography>

          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="caption" gutterBottom>
                Red: {rgbaColor.r}
              </Typography>
              <Slider
                value={rgbaColor.r}
                min={0}
                max={255}
                onChange={(_, value) =>
                  handleColorChange({
                    ...rgbaColor,
                    r: value as number,
                  })
                }
                sx={{
                  color: "red",
                  "& .MuiSlider-thumb": {
                    bgcolor: "white",
                    border: "2px solid currentColor",
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" gutterBottom>
                Green: {rgbaColor.g}
              </Typography>
              <Slider
                value={rgbaColor.g}
                min={0}
                max={255}
                onChange={(_, value) =>
                  handleColorChange({
                    ...rgbaColor,
                    g: value as number,
                  })
                }
                sx={{
                  color: "green",
                  "& .MuiSlider-thumb": {
                    bgcolor: "white",
                    border: "2px solid currentColor",
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" gutterBottom>
                Blue: {rgbaColor.b}
              </Typography>
              <Slider
                value={rgbaColor.b}
                min={0}
                max={255}
                onChange={(_, value) =>
                  handleColorChange({
                    ...rgbaColor,
                    b: value as number,
                  })
                }
                sx={{
                  color: "blue",
                  "& .MuiSlider-thumb": {
                    bgcolor: "white",
                    border: "2px solid currentColor",
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" gutterBottom>
                Alpha: {rgbaColor.a.toFixed(2)}
              </Typography>
              <Slider
                value={rgbaColor.a}
                min={0}
                max={1}
                step={0.01}
                onChange={(_, value) =>
                  handleColorChange({
                    ...rgbaColor,
                    a: value as number,
                  })
                }
                sx={{
                  color: "grey",
                  "& .MuiSlider-thumb": {
                    bgcolor: "white",
                    border: "2px solid currentColor",
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                height: 48,
                bgcolor: rgbaToString(rgbaColor),
                borderRadius: 1,
                boxShadow: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  bgcolor: "rgba(255,255,255,0.8)",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                {rgbaToString(rgbaColor)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleCloseColorPicker}
              sx={{ mt: 2 }}
            >
              Apply Color
            </Button>
          </Stack>
        </Paper>
      </Popover>
    </Box>
  );
};

export default ImageHotspot;
