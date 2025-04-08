import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Card,
  styled,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Description as DescriptionIcon,
  ChevronRight as ChevronRightIcon,
  Message as MessageIcon,
  Info as InfoIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

import { useSimulationWizard } from "../../../../../context/SimulationWizardContext";
import SortableItem from "./SortableItem";
import ImageHotspot from "./ImageHotspot";
import HotspotSequence, { SequenceItem } from "./HotspotSequence";

interface Hotspot {
  id: string;
  name: string;
  type: string;
  text?: string;
  hotkey?: string;
  hotspotType: string;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings?: any;
  options?: string[];
}

interface ScriptMessage {
  id: string;
  text: string;
  role: "Customer" | "Trainee";
  visualId: string;
  order: number;
}

interface VisualImage {
  id: string;
  url: string; // Local URL for display
  name: string;
  file?: File; // Store the actual file reference
  sequence: SequenceItem[]; // Combined sequence of hotspots and messages
}

interface VisualsTabProps {
  images: VisualImage[];
  onImagesUpdate?: (images: VisualImage[]) => void;
  onComplete?: () => void;
  createSimulation?: (formData: FormData) => Promise<any>;
  simulationType?: string;
}

const DropZone = styled(Box)(({ theme }) => ({
  border: "2px dashed #DEE2FC",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  backgroundColor: "#FCFCFE",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  transition: "border-color 0.2s ease-in-out",
  minHeight: "320px",
  "&:hover": {
    borderColor: theme.palette.primary.main,
  },
}));

/**
 * Attempts to detect the image type from binary data
 * Returns the MIME type or defaults to 'image/png'
 */
const detectImageType = (binaryData: string): string => {
  // Check for JPEG header (FF D8 FF)
  if (
    binaryData.length >= 3 &&
    binaryData.charCodeAt(0) === 0xff &&
    binaryData.charCodeAt(1) === 0xd8 &&
    binaryData.charCodeAt(2) === 0xff
  ) {
    return "image/jpeg";
  }

  // Check for PNG header (89 50 4E 47)
  if (
    binaryData.length >= 4 &&
    binaryData.charCodeAt(0) === 0x89 &&
    binaryData.charCodeAt(1) === 0x50 &&
    binaryData.charCodeAt(2) === 0x4e &&
    binaryData.charCodeAt(3) === 0x47
  ) {
    return "image/png";
  }

  // Default to PNG if can't detect
  return "image/png";
};

/**
 * Properly converts various image data formats to displayable URLs
 * This improved version handles both PNG and JPEG binary data
 * and aligns with how preview components handle images
 */
const processImageUrl = (imageData: string): string => {
  if (!imageData) {
    console.log("Empty image data");
    return "";
  }

  // 1. Handle data URLs that might contain encoded blob URLs (this is our problem case)
  if (imageData.startsWith("data:image")) {
    const parts = imageData.split(",");
    if (parts.length > 1) {
      try {
        const decoded = atob(parts[1]);
        if (
          decoded.startsWith("blob:") ||
          decoded.startsWith("http:") ||
          decoded.startsWith("https:")
        ) {
          console.log(
            "Decoded blob URL from base64:",
            decoded.substring(0, 50) + (decoded.length > 50 ? "..." : ""),
          );
          return decoded; // Return the decoded URL
        }
      } catch (e) {
        // Not base64 or couldn't decode, continue with other checks
      }
    }
    return imageData; // Return the original data URL
  }

  // 2. Direct URLs (blob or http/https)
  if (
    imageData.startsWith("blob:") ||
    imageData.startsWith("http:") ||
    imageData.startsWith("https:") ||
    imageData.startsWith("/api/")
  ) {
    return imageData;
  }

  // 3. Raw base64 data (not wrapped in data:image)
  if (/^[A-Za-z0-9+/=]+$/.test(imageData.trim()) && imageData.length > 20) {
    // Try to detect if this is JPEG or PNG base64 data
    try {
      const decoded = atob(imageData);
      const mimeType = detectImageType(decoded);
      return `data:${mimeType};base64,${imageData}`;
    } catch (e) {
      // If we can't decode it, default to PNG
      return `data:image/png;base64,${imageData}`;
    }
  }

  // 4. Binary data handling - like preview components would do
  try {
    // Try to detect image type from the binary data
    const mimeType = detectImageType(imageData);

    // For binary data direct output like preview components
    return imageData;
  } catch (e) {
    console.error("Failed to process binary image data");
    return "/api/placeholder/400/320";
  }
};

// Debug utility to help identify image data issues
const debugImageData = (data: string, label: string = "Image data") => {
  if (!data) {
    console.log(`${label}: [empty]`);
    return;
  }

  // Show truncated data for long strings
  if (data.length > 100) {
    console.log(`${label} (${data.length} bytes): ${data.substring(0, 50)}...`);
  } else {
    console.log(`${label}: ${data}`);
  }

  // Check image type
  if (data.length > 2) {
    try {
      const mimeType = detectImageType(data);
      console.log(`${label} detected type: ${mimeType}`);
    } catch (e) {
      // Ignore errors in debug function
    }
  }

  // Try to determine the type of data
  if (data.startsWith("data:")) {
    console.log(`${label} type: Data URL`);

    // Check if it might be an encoded URL
    const parts = data.split(",");
    if (parts.length > 1) {
      try {
        const decoded = atob(parts[1]);
        if (decoded.startsWith("blob:") || decoded.startsWith("http")) {
          console.log(
            `${label} contains encoded URL: ${decoded.substring(0, 50)}...`,
          );
        }
      } catch (e) {
        // Not valid base64
      }
    }
  } else if (data.startsWith("blob:")) {
    console.log(`${label} type: Blob URL`);
  } else if (data.startsWith("/api/") || data.startsWith("http")) {
    console.log(`${label} type: External URL`);
  } else if (/^[A-Za-z0-9+/=]+$/.test(data.trim())) {
    // Try to decode it and see what it might be
    try {
      const decoded = atob(data);
      if (decoded.startsWith("blob:") || decoded.startsWith("http")) {
        console.log(`${label} type: Base64-encoded URL!`);
        console.log(`${label} decoded: ${decoded.substring(0, 50)}...`);
      } else {
        console.log(`${label} type: Base64 data`);
      }
    } catch (e) {
      console.log(`${label} type: Looks like Base64 but couldn't decode`);
    }
  } else {
    console.log(`${label} type: Binary data or other format`);
    // For binary data, try to detect the image type
    const mimeType = detectImageType(data);
    console.log(`${label} probable image type: ${mimeType}`);
  }
};

export default function VisualsTab({
  images = [],
  onImagesUpdate,
  onComplete,
  createSimulation,
  simulationType,
}: VisualsTabProps) {
  const { scriptData } = useSimulationWizard();

  // Initialize visualImages with proper initial state
  const [visualImages, setVisualImages] = useState<VisualImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // We'll keep the sequence panel default to collapsed
  const [isSequenceExpanded, setIsSequenceExpanded] = useState(false);

  const [containerWidth, setContainerWidth] = useState<number>(0);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // For the "Add Script Message" menu
  const [scriptMenuAnchor, setScriptMenuAnchor] = useState<null | HTMLElement>(
    null,
  );

  // Check if the simulation type is visual-audio or visual-chat to ensure same behavior
  const isVisualAudioOrChat =
    simulationType === "visual-audio" || simulationType === "visual-chat";
  // Check if this is pure "visual" type (no script)
  const isPureVisual = simulationType === "visual";

  // Update container width when ref is available
  useEffect(() => {
    if (mainContentRef.current) {
      const updateContainerWidth = () => {
        setContainerWidth(mainContentRef.current?.clientWidth || 0);
      };

      updateContainerWidth();
      window.addEventListener("resize", updateContainerWidth);

      return () => {
        window.removeEventListener("resize", updateContainerWidth);
      };
    }
  }, [mainContentRef]);

  // Update parent when visualImages changes
  useEffect(() => {
    if (onImagesUpdate) {
      onImagesUpdate(visualImages);
    }
  }, [visualImages, onImagesUpdate]);

  // Creates a map of images similar to what preview components use
  const createImageMap = (): Map<string, string> => {
    const imageMap = new Map<string, string>();

    visualImages.forEach((img) => {
      if (img.id && img.url) {
        imageMap.set(img.id, img.url);
      }
    });

    return imageMap;
  };

  // Crucial update: Process images prop into proper visualImages state
  useEffect(() => {
    console.log("Images prop changed:", images);
    if (images && images.length > 0) {
      // Transform the input images to our internal format
      const processedImages = images.map((img) => {
        // Validate the sequence data structure
        const validSequence = Array.isArray(img.sequence) ? img.sequence : [];

        // Process sequence items based on their format
        const processedSequence = validSequence.map((item) => {
          // Case 1: Item is already in the correct format with content property
          if (
            item.type &&
            (item.type === "hotspot" || item.type === "message") &&
            item.content
          ) {
            // For hotspots, ensure coordinates are properly formatted as numbers
            if (item.type === "hotspot" && item.content.coordinates) {
              item.content.coordinates = {
                x: Number(item.content.coordinates.x || 0),
                y: Number(item.content.coordinates.y || 0),
                width: Number(item.content.coordinates.width || 0),
                height: Number(item.content.coordinates.height || 0),
              };
            }
            return item;
          }

          // Case 2: Item is from API format and needs conversion
          else if (item.type === "hotspot") {
            return {
              id: `hotspot-${item.id || Date.now()}`,
              type: "hotspot",
              content: {
                id: item.id || String(Date.now()),
                name: item.name || "Untitled Hotspot",
                type: "hotspot",
                hotspotType: item.hotspotType || "button",
                coordinates: item.coordinates
                  ? {
                      x: Number(item.coordinates.x || 0),
                      y: Number(item.coordinates.y || 0),
                      width: Number(item.coordinates.width || 0),
                      height: Number(item.coordinates.height || 0),
                    }
                  : undefined,
                settings: item.settings || {},
                options: item.options || [],
                text: item.text,
              },
              timestamp: Date.now(),
            };
          }

          // Case 3: Item is a message from API format
          else if (item.type === "message") {
            return {
              id: `message-${item.id || Date.now()}`,
              type: "message",
              content: {
                id: item.id || String(Date.now()),
                role: item.role || "Customer", // Keep original role
                text: item.text || "",
                visualId: img.id,
                order: item.order || 0,
              },
              timestamp: Date.now(),
            };
          }

          // Case 4: Unrecognized format - return as is
          return item;
        });

        // Process the URL using our improved approach
        let processedUrl = "";

        if (img.url) {
          // Debug the URL before processing
          debugImageData(img.url, `Original URL for image ${img.id}`);

          // Special handling for data URLs that might contain encoded blob URLs
          if (img.url.startsWith("data:image")) {
            const parts = img.url.split(",");
            if (parts.length > 1) {
              try {
                const decoded = atob(parts[1]);
                if (decoded.startsWith("blob:") || decoded.startsWith("http")) {
                  console.log(
                    `Image ${img.id}: Found encoded URL in data URL:`,
                    decoded.substring(0, 50) + "...",
                  );
                  processedUrl = decoded;
                } else {
                  // Regular data URL
                  processedUrl = img.url;
                }
              } catch (e) {
                // Not valid base64 or other error
                processedUrl = img.url;
              }
            } else {
              processedUrl = img.url;
            }
          }
          // Handle direct URLs
          else if (
            img.url.startsWith("blob:") ||
            img.url.startsWith("http") ||
            img.url.startsWith("/api/")
          ) {
            processedUrl = img.url;
          }
          // For raw base64
          else if (
            /^[A-Za-z0-9+/=]+$/.test(img.url.trim()) &&
            img.url.length > 20
          ) {
            // Try to determine the image type
            try {
              const decoded = atob(img.url);
              const mimeType = detectImageType(decoded);
              processedUrl = `data:${mimeType};base64,${img.url}`;
            } catch (e) {
              // Default to PNG if we can't determine
              processedUrl = `data:image/png;base64,${img.url}`;
            }
          }
          // For binary data - this approach matches preview components
          else {
            processedUrl = img.url; // Keep as is for binary data
          }

          // Debug the processed URL
          debugImageData(processedUrl, `Processed URL for image ${img.id}`);
        }
        // For file objects, create a proper object URL
        else if (img.file) {
          processedUrl = URL.createObjectURL(img.file);
          console.log(`Created object URL for file: ${img.name}`);
        }

        return {
          id: img.id,
          url: processedUrl,
          name: img.name || `Image ${img.id}`,
          file: img.file,
          sequence: processedSequence,
        };
      });

      console.log("Processed images:", processedImages);
      setVisualImages(processedImages);

      // Create and log the image map that would be used by preview components
      const imageMap = createImageMap();
      console.log("Image map (similar to preview components):", imageMap);

      // Set selected image if none is selected
      if (processedImages.length > 0 && !selectedImageId) {
        setSelectedImageId(processedImages[0].id);
      }
    }
  }, [images]);

  /** Helper: add a hotspot to the selected image's sequence. */
  const addHotspotToSequence = (imageId: string, hotspot: Hotspot) => {
    if (!imageId) return;

    setVisualImages((currentImages) =>
      currentImages.map((img) => {
        if (img.id === imageId) {
          const newSequenceItem: SequenceItem = {
            id: `hotspot-${hotspot.id}`,
            type: "hotspot",
            content: hotspot,
            timestamp: Date.now(),
          };

          return {
            ...img,
            sequence: [...img.sequence, newSequenceItem],
          };
        }
        return img;
      }),
    );
  };

  /** Get the selected image object. */
  const selectedImage = visualImages.find((img) => img.id === selectedImageId);

  // Get the current sequence for the selected image
  const currentSequence: SequenceItem[] = selectedImage?.sequence || [];

  // Handle reordering of the sequence
  const handleSequenceReorder = (newSequence: SequenceItem[]) => {
    if (!selectedImageId) return;

    setVisualImages((currentImages) =>
      currentImages.map((img) => {
        if (img.id === selectedImageId) {
          return {
            ...img,
            sequence: newSequence,
          };
        }
        return img;
      }),
    );
  };

  // Extract hotspots from the selected image for the ImageHotspot component
  const getHotspotsForImageHotspot = () => {
    if (!selectedImage || !selectedImage.sequence) return [];

    return selectedImage.sequence
      .filter((item) => item.type === "hotspot" && item.content)
      .map((item) => {
        // Ensure the content is properly formatted as a Hotspot
        const hotspot = item.content as Hotspot;

        // Ensure coordinates are properly formatted as numbers
        if (hotspot.coordinates) {
          hotspot.coordinates = {
            x: Number(hotspot.coordinates.x || 0),
            y: Number(hotspot.coordinates.y || 0),
            width: Number(hotspot.coordinates.width || 0),
            height: Number(hotspot.coordinates.height || 0),
          };
        }

        // Return the properly formatted hotspot
        return {
          ...hotspot,
          id: hotspot.id || String(Date.now()),
          name: hotspot.name || "Untitled Hotspot",
          type: hotspot.type || "hotspot",
          hotspotType: hotspot.hotspotType || "button",
          settings: hotspot.settings || {},
        };
      });
  };

  // For the "Add Script Message" menu
  // Filter out messages that have already been assigned to a visual
  const unassignedMessages = scriptData.filter((msg) => {
    if (!msg || !msg.id) return false;

    return !visualImages.some((img) => {
      if (!img || !img.sequence) return false;

      return img.sequence.some((item) => {
        if (!item || item.type !== "message" || !item.content) return false;

        // Safely access the ID with type checking
        const messageContent = item.content as Partial<ScriptMessage>;
        return messageContent.id === msg.id;
      });
    });
  });

  const handleOpenScriptMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setScriptMenuAnchor(event.currentTarget);
  };

  const handleCloseScriptMenu = () => {
    setScriptMenuAnchor(null);
  };

  const handleAddMessage = (message: {
    id: string;
    role: string;
    message: string;
  }) => {
    if (!selectedImageId) return;

    const newMsg: ScriptMessage = {
      id: message.id,
      role: message.role as "Customer" | "Trainee",
      text: message.message,
      visualId: selectedImageId,
      order: 0, // We're not using this anymore as we rely on sequence order
    };

    const newSequenceItem: SequenceItem = {
      id: `message-${message.id}`,
      type: "message",
      content: newMsg,
      timestamp: Date.now(),
    };

    setVisualImages((currentImages) =>
      currentImages.map((img) => {
        if (img.id === selectedImageId) {
          return {
            ...img,
            sequence: [...img.sequence, newSequenceItem],
          };
        }
        return img;
      }),
    );

    handleCloseScriptMenu();
  };

  // For draggable thumbnails on the left
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleThumbnailsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visualImages.findIndex((img) => img.id === active.id);
    const newIndex = visualImages.findIndex((img) => img.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const newArr = [...visualImages];
    const [moved] = newArr.splice(oldIndex, 1);
    newArr.splice(newIndex, 0, moved);
    setVisualImages(newArr);
  };

  // Image Upload
  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const newImages = imageFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      name: file.name,
      file: file, // Store the actual File reference
      sequence: [], // Initialize with empty sequence
    }));
    setVisualImages([...visualImages, ...newImages]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    handleFiles(Array.from(e.target.files));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Delete a thumbnail
  const handleDeleteImage = (imgId: string) => {
    if (selectedImageId === imgId) {
      setSelectedImageId(null);
    }
    setVisualImages(visualImages.filter((img) => img.id !== imgId));
  };

  // Clicking a thumbnail
  const handleSelectImage = (imgId: string) => {
    setSelectedImageId(imgId);
    setEditingHotspot(null);
  };

  const handleSaveAndContinue = async () => {
    if (visualImages.length === 0) {
      setError("Please add at least one image before continuing");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData for multipart/form-data submission with files
      const formData = new FormData();

      // First check if we have actual file objects to upload
      const hasFiles = visualImages.some((img) => img.file !== undefined);
      console.log("Has files to upload:", hasFiles);

      // Convert visualImages to slidesData format for API
      const slidesData = visualImages.map((img, index) => {
        // Extract all necessary data from each image
        const sequence = img.sequence.map((item) => {
          if (item.type === "hotspot") {
            const hotspot = item.content as Hotspot;

            // Start with the base hotspot data structure
            const hotspotData = {
              type: "hotspot",
              id: hotspot.id,
              name: hotspot.name,
              hotspotType: hotspot.hotspotType,
              coordinates: hotspot.coordinates
                ? {
                    // Ensure we explicitly access and use numbers for each coordinate
                    x: Number(hotspot.coordinates.x || 0),
                    y: Number(hotspot.coordinates.y || 0),
                    width: Number(hotspot.coordinates.width || 0),
                    height: Number(hotspot.coordinates.height || 0),
                  }
                : undefined,
              settings: hotspot.settings || {},
            };

            // Add options array for dropdown type
            if (hotspot.hotspotType === "dropdown" && hotspot.options) {
              hotspotData.options = hotspot.options;
            }

            return hotspotData;
          } else {
            const message = item.content as ScriptMessage;
            return {
              type: "message",
              id: message.id,
              role: message.role,
              text: message.text,
            };
          }
        });

        // Create a clean image URL that doesn't include any base64 data
        // The server will use the uploaded file or existing server-side image
        let cleanImageUrl = "";
        if (img.url) {
          // If it's a blob URL created from a file upload, don't include it
          if (img.url.startsWith("blob:")) {
            cleanImageUrl = ""; // Server will use the uploaded file instead
          }
          // If it's a data URL, don't include the full data in the JSON
          else if (img.url.startsWith("data:")) {
            cleanImageUrl = ""; // Server will use the uploaded file instead
          }
          // If it's an API URL, keep it as is
          else if (img.url.startsWith("/api/") || img.url.startsWith("http")) {
            cleanImageUrl = img.url;
          }
        }

        // Return complete slide data object
        return {
          imageId: img.id,
          imageName: img.name,
          imageUrl: cleanImageUrl, // Use the clean URL or empty string
          sequence,
        };
      });

      // Add the slides data as JSON to FormData
      console.log("Sending slidesData:", JSON.stringify(slidesData));
      formData.append("slidesData", JSON.stringify(slidesData));

      // Add file objects to FormData when available
      let fileCount = 0;
      visualImages.forEach((image, index) => {
        if (image.file) {
          fileCount++;
          // Use a consistent naming convention for files
          formData.append(`slides[${index}]`, image.file, image.name);
        }
      });
      console.log(`Added ${fileCount} files to form data`);

      // Debug what's in the FormData
      for (const pair of formData.entries()) {
        // Don't log the actual file content, just log that a file was included
        if (pair[1] instanceof File) {
          console.log(
            `FormData contains file: ${pair[0]} - ${(pair[1] as File).name}`,
          );
        } else if (typeof pair[1] === "string" && pair[1].length > 100) {
          console.log(
            `FormData contains ${pair[0]} (large string, ${pair[1].length} chars)`,
          );
        } else {
          console.log(`FormData contains: ${pair[0]} - ${pair[1]}`);
        }
      }

      // Call create/update simulation for all visual-related types
      if (createSimulation) {
        console.log(
          `Updating simulation with slides for ${simulationType} type`,
        );

        // Call the update function
        const response = await createSimulation(formData);

        // Log the full response for debugging
        console.log("API Response:", response);

        // More robust response checking
        if (response) {
          // Check if the response has a status directly or in a nested structure
          const status =
            response.status ||
            (response.document && response.document.status) ||
            (response.simulation && response.simulation.status);

          if (
            status === "success" ||
            status === "published" ||
            status === "draft"
          ) {
            console.log("Simulation updated successfully with status:", status);

            // Call onComplete to move to the next step
            if (onComplete) {
              onComplete();
            }
          } else {
            console.error("API returned non-success status:", status);
            setError(
              `Failed to update simulation. Server returned: ${status || "unknown status"}`,
            );
          }
        } else {
          console.error("API returned empty response");
          setError("Failed to update simulation. Empty response from server.");
        }
      } else {
        setError("No update function provided");
      }
    } catch (error) {
      console.error("Error updating simulation:", error);

      // More descriptive error message
      if (error instanceof Error) {
        setError(`Error updating simulation: ${error.message}`);
      } else {
        setError("An unexpected error occurred while updating the simulation.");
      }
    } finally {
      setIsSubmitting(false);
      setIsEditing(false); // Reset editing mode after saving
    }
  };

  // Update hotspots in the sequence
  const updateImageHotspots = (imageId: string, newHotspots: Hotspot[]) => {
    if (!imageId) return;

    // Find the current image
    const currentImage = visualImages.find((img) => img.id === imageId);
    if (!currentImage) return;

    // Find all sequence items that are hotspots
    const currentHotspotItems = currentImage.sequence.filter(
      (item) => item.type === "hotspot",
    );
    const currentHotspots = currentHotspotItems.map(
      (item) => item.content as Hotspot,
    );

    // Identify deleted hotspots
    const deletedHotspots = currentHotspots.filter(
      (oldHotspot) =>
        !newHotspots.some((newHotspot) => newHotspot.id === oldHotspot.id),
    );

    // Identify new hotspots
    const addedHotspots = newHotspots.filter(
      (newHotspot) =>
        !currentHotspots.some((oldHotspot) => oldHotspot.id === newHotspot.id),
    );

    // Updated hotspots (existing but modified)
    const updatedHotspots = newHotspots.filter((newHotspot) =>
      currentHotspots.some((oldHotspot) => oldHotspot.id === newHotspot.id),
    );

    // Update the image's sequence
    setVisualImages((currentImages) =>
      currentImages.map((img) => {
        if (img.id === imageId) {
          // Remove deleted hotspot items
          let updatedSequence = img.sequence.filter(
            (item) =>
              !(
                item.type === "hotspot" &&
                deletedHotspots.some(
                  (h) => h.id === (item.content as Hotspot).id,
                )
              ),
          );

          // Add new hotspots to the end of the sequence
          addedHotspots.forEach((hotspot) => {
            updatedSequence.push({
              id: `hotspot-${hotspot.id}`,
              type: "hotspot",
              content: hotspot,
              timestamp: Date.now(),
            });
          });

          // Update existing hotspots
          updatedSequence = updatedSequence.map((item) => {
            if (item.type === "hotspot") {
              const hotspot = item.content as Hotspot;
              const updatedHotspot = updatedHotspots.find(
                (h) => h.id === hotspot.id,
              );
              if (updatedHotspot) {
                return {
                  ...item,
                  content: updatedHotspot,
                };
              }
            }
            return item;
          });

          return {
            ...img,
            sequence: updatedSequence,
          };
        }
        return img;
      }),
    );
  };

  // Edit / Delete a single hotspot or message from the sequence
  const handleDeleteItem = (id: string, type: "hotspot" | "message") => {
    if (!selectedImageId) return;

    setVisualImages((currentImages) =>
      currentImages.map((img) => {
        if (img.id === selectedImageId) {
          return {
            ...img,
            sequence: img.sequence.filter(
              (item) =>
                !(item.type === type && (item.content as any).id === id),
            ),
          };
        }
        return img;
      }),
    );
  };

  const handleEditItem = (id: string, type: "hotspot" | "message") => {
    if (!selectedImageId) return;

    if (type === "hotspot") {
      // Find the hotspot in the sequence
      const selectedImage = visualImages.find(
        (img) => img.id === selectedImageId,
      );
      if (!selectedImage) return;

      const hotspotItem = selectedImage.sequence.find(
        (item) =>
          item.type === "hotspot" && (item.content as Hotspot).id === id,
      );

      if (hotspotItem) {
        setEditingHotspot(hotspotItem.content as Hotspot);
        setIsEditing(true);
      }
    } else {
      // Handle message editing if needed
      alert(`Editing message #${id} not implemented`);
    }
  };

  const handleToggleEditMode = () => {
    setIsEditing(!isEditing);
    setEditingHotspot(null);
  };

  return (
    <Stack spacing={4}>
      {/* Error alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Top row: "Add Script Message" + "Save and Continue" */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        {isPureVisual ? (
          // For pure visual type, show information instead of Add Script Message button
          <Tooltip title="Script messages are not available in Visual type simulations">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <InfoIcon sx={{ color: "text.disabled" }} />
              <Typography variant="body2" color="text.disabled">
                No script messages in Visual type
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          // For visual-audio and visual-chat, show the Add Script Message button
          <Button
            variant="contained"
            startIcon={<MessageIcon />}
            disabled={
              !selectedImageId ||
              !Array.isArray(scriptData) ||
              scriptData.length === 0
            }
            onClick={(e) => {
              if (!selectedImageId) return;
              setScriptMenuAnchor(e.currentTarget);
            }}
            sx={{ bgcolor: "#444CE7", "&:hover": { bgcolor: "#3538CD" } }}
          >
            Add Script Message
          </Button>
        )}

        {/* Actions for when we have images */}
        {visualImages.length > 0 && (
          <Stack direction="row" spacing={2}>
            {/* Toggle Edit Mode button */}
            <Button
              variant="outlined"
              startIcon={isEditing ? null : <EditIcon />}
              onClick={handleToggleEditMode}
              sx={{ mr: 2 }}
            >
              {isEditing ? "Cancel Editing" : "Edit Visuals"}
            </Button>

            {/* Always show Save and Continue */}
            <Button
              variant="contained"
              onClick={handleSaveAndContinue}
              disabled={visualImages.length === 0 || isSubmitting}
              sx={{
                bgcolor: "#444CE7",
                "&:hover": { bgcolor: "#3538CD" },
                borderRadius: 2,
                px: 4,
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Save and Continue"
              )}
            </Button>
          </Stack>
        )}

        {/* Menu listing unassigned script messages - only for non-visual type */}
        {!isPureVisual && (
          <Menu
            anchorEl={scriptMenuAnchor}
            open={Boolean(scriptMenuAnchor)}
            onClose={() => setScriptMenuAnchor(null)}
            PaperProps={{
              sx: {
                maxHeight: 300,
                width: 400,
              },
            }}
          >
            {!Array.isArray(unassignedMessages) ||
            unassignedMessages.length === 0 ? (
              <MenuItem disabled>No unassigned messages left</MenuItem>
            ) : (
              unassignedMessages.map((msg) => (
                <MenuItem
                  key={msg.id}
                  onClick={() =>
                    handleAddMessage({
                      id: msg.id,
                      role: msg.role,
                      message: msg.message,
                    })
                  }
                  sx={{
                    py: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack spacing={1} sx={{ width: "100%" }}>
                    <Typography variant="caption" color="text.secondary">
                      {msg.role}
                    </Typography>
                    <Typography variant="body2">{msg.message}</Typography>
                  </Stack>
                </MenuItem>
              ))
            )}
          </Menu>
        )}
      </Stack>

      {visualImages.length === 0 ? (
        <DropZone onDrop={handleDrop} onDragOver={handleDragOver}>
          <DescriptionIcon sx={{ fontSize: 80, color: "#DEE2FC", mb: 2 }} />
          <Typography
            variant="h5"
            sx={{ color: "#0F174F", mb: 2 }}
            gutterBottom
            fontWeight="800"
          >
            Add Visuals
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "13px", mb: 2 }}
          >
            Drag and drop your images here in .png, .jpeg format
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ width: "100%", my: 2 }}
          >
            <Divider sx={{ flex: 1 }} />
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Stack>

          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            sx={{
              bgcolor: "#444CE7",
              color: "white",
              py: 1.5,
              px: 4,
              "&:hover": { bgcolor: "#3538CD" },
            }}
          >
            Upload
            <input
              type="file"
              hidden
              accept="image/*"
              multiple
              onChange={handleFileSelect}
            />
          </Button>
        </DropZone>
      ) : (
        <Stack spacing={3} sx={{ height: "calc(100vh - 250px)" }}>
          <Box sx={{ display: "flex", gap: 4, flex: 1 }}>
            {/* Left sidebar: thumbnails */}
            <Box sx={{ width: 280 }}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleThumbnailsDragEnd}
              >
                <SortableContext
                  items={visualImages.map((img) => img.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Box
                    sx={{
                      maxHeight: "calc(100vh - 400px)",
                      overflowY: "auto",
                      "&::-webkit-scrollbar": { width: "4px" },
                      "&::-webkit-scrollbar-track": {
                        background: "#F1F1F1",
                        borderRadius: "10px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#DEE2FC",
                        borderRadius: "10px",
                        "&:hover": { background: "#444CE7" },
                      },
                    }}
                  >
                    <Stack spacing={2} sx={{ p: 2 }}>
                      {visualImages.map((img, index) => (
                        <SortableItem
                          key={img.id}
                          id={img.id}
                          image={img}
                          index={index}
                          selectedImageId={selectedImageId}
                          onImageClick={(id) => handleSelectImage(id)}
                          onDelete={(id) => handleDeleteImage(id)}
                        />
                      ))}
                    </Stack>
                  </Box>
                </SortableContext>
              </DndContext>

              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                component="label"
                sx={{
                  mt: 2,
                  borderStyle: "dashed",
                  borderColor: "#DEE2FC",
                  color: "#444CE7",
                  "&:hover": {
                    borderColor: "#444CE7",
                    bgcolor: "#F5F6FF",
                  },
                }}
              >
                Add Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                />
              </Button>
            </Box>

            {/* Main content area */}
            <Box sx={{ flex: 1, display: "flex", position: "relative" }}>
              {selectedImageId ? (
                <Box
                  ref={mainContentRef}
                  sx={{
                    height: "100%",
                    bgcolor: "#F9FAFB",
                    borderRadius: 2,
                    p: 4,
                    flex: 1,
                    transition: "all 0.3s ease",
                    // If sequence is expanded, we'll leave space for it:
                    marginRight: isSequenceExpanded ? "340px" : "40px",
                  }}
                >
                  <ImageHotspot
                    imageUrl={selectedImage?.url || ""}
                    hotspots={getHotspotsForImageHotspot()}
                    editingHotspot={editingHotspot}
                    onHotspotsChange={(newHs) => {
                      if (!selectedImageId) return;
                      updateImageHotspots(selectedImageId, newHs);
                      setEditingHotspot(null);
                    }}
                    onEditHotspot={(ht) => setEditingHotspot(ht)}
                    containerWidth={containerWidth}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    flex: 1,
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    Select an image from the left to preview
                  </Typography>
                </Box>
              )}

              {selectedImageId && (
                <Box
                  sx={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    height: "100%",
                    display: "flex",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Toggle arrow (on the left side of the sequence panel) */}
                  <Box
                    sx={{
                      width: 40,
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <IconButton
                      onClick={() => setIsSequenceExpanded(!isSequenceExpanded)}
                      sx={{
                        bgcolor: "#F5F6FF",
                        "&:hover": { bgcolor: "#EEF0FF" },
                        // If expanded, arrow points right => rotate(180)
                        transform: isSequenceExpanded
                          ? "rotate(180deg)"
                          : "none",
                        transition: "transform 0.3s ease",
                      }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Box>

                  {/* Sequence panel */}
                  <Box
                    sx={{
                      transform: isSequenceExpanded
                        ? "translateX(0)"
                        : "translateX(100%)",
                      transition: "transform 0.3s ease",
                      position: "absolute",
                      right: 0,
                      top: 0,
                      height: "100%",
                      width: 320,
                      borderLeft: "1px solid",
                      borderColor: "divider",
                      bgcolor: "#F9FAFB",
                    }}
                  >
                    <HotspotSequence
                      sequence={currentSequence}
                      onSequenceReorder={handleSequenceReorder}
                      onItemDelete={handleDeleteItem}
                      onItemEdit={handleEditItem}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Stack>
      )}
    </Stack>
  );
}
