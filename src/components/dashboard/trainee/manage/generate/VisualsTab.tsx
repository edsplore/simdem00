import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
  transition: "border-color 0.2s ease-in-out, transform 0.2s ease-in-out",
  minHeight: "320px",
  "&:hover": {
    borderColor: theme.palette.primary.main,
    transform: "scale(1.005)",
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

/**
 * Strips HTML tags from a string
 * Returns clean text content
 */
const stripHtmlTags = (html: string): string => {
  if (!html) return "";
  // This regex removes all HTML tags while preserving the text content
  return html.replace(/<\/?[^>]+(>|$)/g, "");
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

  // Confirm dialog for deleting the last slide
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isLastImage, setIsLastImage] = useState(false);

  // Use useMemo to stabilize the isSequenceExpanded state and prevent unnecessary re-renders
  const [isSequenceExpanded, setIsSequenceExpanded] = useState(false);

  // Keep track of the last stable container width to prevent flickering
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const stableContainerWidth = useRef<number>(0);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const containerSizeObserver = useRef<ResizeObserver | null>(null);

  // For the "Add Script Message" menu
  const [scriptMenuAnchor, setScriptMenuAnchor] = useState<null | HTMLElement>(
    null,
  );

  // Check if the simulation type is visual-audio or visual-chat to ensure same behavior
  const isVisualAudioOrChat =
    simulationType === "visual-audio" || simulationType === "visual-chat";
  // Check if this is pure "visual" type (no script)
  const isPureVisual = simulationType === "visual";

  // Memoize the current sequence to prevent unnecessary recalculations
  const selectedImage = useMemo(
    () => visualImages.find((img) => img.id === selectedImageId),
    [visualImages, selectedImageId],
  );

  const currentSequence: SequenceItem[] = useMemo(
    () => selectedImage?.sequence || [],
    [selectedImage],
  );

  // Throttled container width update to prevent too frequent state changes
  const updateContainerWidth = useCallback(() => {
    if (!mainContentRef.current) return;

    const newWidth = mainContentRef.current.clientWidth;

    // Only update if the change is significant (more than 5px difference)
    if (Math.abs(newWidth - stableContainerWidth.current) > 5) {
      stableContainerWidth.current = newWidth;
      setContainerWidth(newWidth);
    }
  }, []);

  // Update container width when ref is available, but with more stable behavior
  useEffect(() => {
    if (!mainContentRef.current) return;

    // Initialize width
    updateContainerWidth();

    // Clean up previous observer if it exists
    if (containerSizeObserver.current) {
      containerSizeObserver.current.disconnect();
    }

    // Create a new observer with throttling built in
    let throttleTimeout: number | null = null;
    containerSizeObserver.current = new ResizeObserver(() => {
      if (throttleTimeout !== null) {
        window.clearTimeout(throttleTimeout);
      }

      throttleTimeout = window.setTimeout(() => {
        updateContainerWidth();
        throttleTimeout = null;
      }, 100); // Throttle to max once per 100ms
    });

    containerSizeObserver.current.observe(mainContentRef.current);

    // Clean up
    return () => {
      if (throttleTimeout !== null) {
        window.clearTimeout(throttleTimeout);
      }
      if (containerSizeObserver.current) {
        containerSizeObserver.current.disconnect();
      }
    };
  }, [updateContainerWidth]);

  // Update parent when visualImages changes, but debounce to prevent excessive updates
  useEffect(() => {
    if (!onImagesUpdate) return;

    const debounceTimeout = setTimeout(() => {
      onImagesUpdate(visualImages);
    }, 300); // Debounce updates to 300ms

    return () => clearTimeout(debounceTimeout);
  }, [visualImages, onImagesUpdate]);

  // Only process images prop on initial mount or when explicitly needed
  const didInitializeRef = useRef(false);

  useEffect(() => {
    // Skip if we've already initialized (only sync from props once)
    if (didInitializeRef.current) return;

    console.log("Initial images processing:", images);
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
          processedUrl = img.url;
        }
        // For file objects, create a proper object URL
        else if (img.file) {
          processedUrl = URL.createObjectURL(img.file);
        }

        return {
          id: img.id,
          url: processedUrl,
          name: img.name || `Image ${img.id}`,
          file: img.file,
          sequence: processedSequence,
        };
      });

      setVisualImages(processedImages);

      // Auto-select the first image if there's no current selection
      if (processedImages.length > 0 && !selectedImageId) {
        setSelectedImageId(processedImages[0].id);
      }

      // Mark that we've initialized
      didInitializeRef.current = true;
    } else if (images && images.length === 0) {
      // If we receive an empty images array, clear our state completely
      setVisualImages([]);
      setSelectedImageId(null);
      setEditingHotspot(null);
      setIsEditing(false);

      // Mark that we've initialized
      didInitializeRef.current = true;
    }
  }, [images, selectedImageId]);

  /** Helper: add a hotspot to the selected image's sequence. */
  const addHotspotToSequence = useCallback(
    (imageId: string, hotspot: Hotspot) => {
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
    },
    [],
  );

  // Handle reordering of the sequence
  const handleSequenceReorder = useCallback(
    (newSequence: SequenceItem[]) => {
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
    },
    [selectedImageId],
  );

  // Extract hotspots from the selected image for the ImageHotspot component
  const getHotspotsForImageHotspot = useCallback(() => {
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
  }, [selectedImage]);

  // For the "Add Script Message" menu
  // Filter out messages that have already been assigned to a visual
  const unassignedMessages = useMemo(
    () =>
      scriptData.filter((msg) => {
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
      }),
    [scriptData, visualImages],
  );

  const handleOpenScriptMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setScriptMenuAnchor(event.currentTarget);
    },
    [],
  );

  const handleCloseScriptMenu = useCallback(() => {
    setScriptMenuAnchor(null);
  }, []);

  const handleAddMessage = useCallback(
    (message: { id: string; role: string; message: string }) => {
      if (!selectedImageId) return;

      const newMsg: ScriptMessage = {
        id: message.id,
        role: message.role as "Customer" | "Trainee",
        text: stripHtmlTags(message.message), // Strip HTML tags when adding to sequence
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
    },
    [selectedImageId, handleCloseScriptMenu],
  );

  // For draggable thumbnails on the left
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleThumbnailsDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = visualImages.findIndex((img) => img.id === active.id);
      const newIndex = visualImages.findIndex((img) => img.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const newArr = arrayMove(visualImages, oldIndex, newIndex);
      setVisualImages(newArr);
    },
    [visualImages],
  );

  // Image Upload
  const handleFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const newImages = imageFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      name: file.name,
      file: file, // Store the actual File reference
      sequence: [], // Initialize with empty sequence
    }));
    setVisualImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      handleFiles(Array.from(e.target.files));
    },
    [handleFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(Array.from(e.dataTransfer.files));
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Enhanced delete function with better state management
  const handleDeleteImage = useCallback(
    (imgId: string) => {
      // Store the ID of the image to delete
      setImageToDelete(imgId);
      // Check if this is the last image - for different dialog message
      setIsLastImage(visualImages.length === 1);
      // Always show confirmation dialog
      setShowDeleteConfirm(true);
    },
    [visualImages.length],
  );

  // Actual deletion function separated for clarity and improved with functional updates
  const performDeleteImage = useCallback((imgId: string) => {
    // Use functional updates to ensure we always work with the latest state
    setVisualImages((prevImages) => {
      const idx = prevImages.findIndex((img) => img.id === imgId);
      const nextImages = prevImages.filter((img) => img.id !== imgId);

      // Choose the slide that will be selected afterwards
      setSelectedImageId((currentSel) => {
        if (currentSel !== imgId) return currentSel; // Nothing to fix
        if (nextImages.length === 0) {
          // If this was the last image, also reset sequence expanded state
          setIsSequenceExpanded(false);
          return null; // List became empty
        }
        return nextImages[Math.min(idx, nextImages.length - 1)].id;
      });

      return nextImages;
    });

    // Clear edit state regardless
    setEditingHotspot(null);
    setIsEditing(false);
  }, []);

  // Clicking a thumbnail
  const handleSelectImage = useCallback((imgId: string) => {
    setSelectedImageId(imgId);
    setEditingHotspot(null);
  }, []);

  const handleSaveAndContinue = useCallback(async () => {
    if (visualImages.length === 0) {
      setError("Please add at least one image before continuing");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData for multipart/form-data submission with files
      const formData = new FormData();

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
      formData.append("slidesData", JSON.stringify(slidesData));

      // Add file objects to FormData when available
      visualImages.forEach((image) => {
        if (image.file) {
          // Use image ID in the key name to maintain correct mapping
          formData.append(`slide_${image.id}`, image.file, image.name);
        }
      });

      // Call create/update simulation for all visual-related types
      if (createSimulation) {
        console.log(
          `Updating simulation with slides for ${simulationType} type`,
        );

        // Call the update function
        const response = await createSimulation(formData);

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
  }, [visualImages, simulationType, createSimulation, onComplete]);

  // Update hotspots in the sequence - optimized to minimize state updates
  const updateImageHotspots = useCallback(
    (imageId: string, newHotspots: Hotspot[]) => {
      if (!imageId) return;

      setVisualImages((currentImages) => {
        // Find the current image
        const currentImageIndex = currentImages.findIndex(
          (img) => img.id === imageId,
        );
        if (currentImageIndex === -1) return currentImages;

        const currentImage = currentImages[currentImageIndex];

        // Find all sequence items that are hotspots
        const currentHotspotItems = currentImage.sequence.filter(
          (item) => item.type === "hotspot",
        );
        const currentHotspots = currentHotspotItems.map(
          (item) => item.content as Hotspot,
        );

        // Identify deleted hotspots
        const deletedHotspotIds = currentHotspots
          .filter(
            (oldHotspot) =>
              !newHotspots.some(
                (newHotspot) => newHotspot.id === oldHotspot.id,
              ),
          )
          .map((hotspot) => hotspot.id);

        // Updated/added hotspots map for quick lookup
        const updatedHotspotsMap = new Map(
          newHotspots.map((hotspot) => [hotspot.id, hotspot]),
        );

        // Process sequence in a single pass
        const updatedSequence = currentImage.sequence
          .filter(
            (item) =>
              !(
                item.type === "hotspot" &&
                deletedHotspotIds.includes((item.content as Hotspot).id)
              ),
          )
          .map((item) => {
            if (item.type === "hotspot") {
              const hotspot = item.content as Hotspot;
              const updatedHotspot = updatedHotspotsMap.get(hotspot.id);

              if (updatedHotspot) {
                // Remove from map to track what's been processed
                updatedHotspotsMap.delete(hotspot.id);
                return {
                  ...item,
                  content: updatedHotspot,
                };
              }
            }
            return item;
          });

        // Add any remaining new hotspots
        updatedHotspotsMap.forEach((hotspot) => {
          updatedSequence.push({
            id: `hotspot-${hotspot.id}`,
            type: "hotspot",
            content: hotspot,
            timestamp: Date.now(),
          });
        });

        // Create a new array with the updated image
        const newImages = [...currentImages];
        newImages[currentImageIndex] = {
          ...currentImage,
          sequence: updatedSequence,
        };

        return newImages;
      });
    },
    [],
  );

  // Edit / Delete a single hotspot or message from the sequence
  const handleDeleteItem = useCallback(
    (id: string, type: "hotspot" | "message") => {
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
    },
    [selectedImageId],
  );

  const handleEditItem = useCallback(
    (id: string, type: "hotspot" | "message") => {
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
    },
    [selectedImageId, visualImages],
  );

  const handleToggleEditMode = useCallback(() => {
    setIsEditing((prev) => !prev);
    setEditingHotspot(null);
  }, []);

  const handleToggleSequencePanel = useCallback(() => {
    // Use a callback to ensure we're working with the latest state
    setIsSequenceExpanded((prev) => !prev);
  }, []);

  // Track if user is actively dragging over the component
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Enhanced handlers to provide visual feedback
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  return (
    <Stack spacing={2}>
      {/* Error alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

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
            onClick={handleOpenScriptMenu}
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
                "Save Simulation"
              )}
            </Button>
          </Stack>
        )}

        {/* Menu listing unassigned script messages - only for non-visual type */}
        {!isPureVisual && (
          <Menu
            anchorEl={scriptMenuAnchor}
            open={Boolean(scriptMenuAnchor)}
            onClose={handleCloseScriptMenu}
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
                    <Typography variant="body2">
                      {stripHtmlTags(msg.message)}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))
            )}
          </Menu>
        )}
      </Stack>

      {visualImages.length === 0 ? (
        <DropZone
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          sx={{
            borderColor: isDraggingOver ? "#444CE7" : "#DEE2FC",
            boxShadow: isDraggingOver
              ? "0 0 10px rgba(68, 76, 231, 0.3)"
              : "none",
            backgroundColor: isDraggingOver ? "#F5F6FF" : "#FCFCFE",
          }}
        >
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
        <Stack spacing={2} sx={{ height: "calc(100vh - 180px)" }}>
          <Box sx={{ display: "flex", gap: 2, flex: 1 }}>
            {/* Left sidebar: thumbnails */}
            <Box sx={{ width: 240 }}>
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
                      maxHeight: "calc(100vh - 280px)",
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
                    <Stack spacing={1} sx={{ p: 1 }}>
                      {visualImages.map((img, index) => (
                        <SortableItem
                          key={img.id}
                          id={img.id}
                          image={img}
                          index={index}
                          selectedImageId={selectedImageId}
                          onImageClick={handleSelectImage}
                          onDelete={handleDeleteImage}
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

            {/* Main content area with proper positioning for dialog */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                position: "relative",
                overflow: "hidden", // Prevent overflow during transitions
              }}
            >
              {selectedImageId ? (
                <Box
                  ref={mainContentRef}
                  sx={{
                    height: "100%",
                    bgcolor: "#F9FAFB",
                    borderRadius: 2,
                    p: 4,
                    flex: 1,
                    position: "relative",
                    // IMPORTANT: Remove the padding-right that was causing resizing issues
                    // This ensures the image always has the full width of its container
                    width: "100%",
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

              {/* Sequence panel with improved overlay design */}
              {selectedImageId && (
                <Box
                  sx={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    height: "100%",
                    display: "flex",
                    zIndex: 10, // Higher z-index to ensure it overlays the image content
                  }}
                >
                  {/* Toggle button - fixed position with higher z-index */}
                  <Box
                    sx={{
                      width: 40,
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      zIndex: 12, // Above the sequence panel
                      backgroundColor: "#F5F6FF", // Add background to make button visible
                      boxShadow: isSequenceExpanded
                        ? "-2px 0 5px rgba(0,0,0,0.1)"
                        : "none",
                    }}
                  >
                    <IconButton
                      onClick={handleToggleSequencePanel}
                      sx={{
                        bgcolor: "#F5F6FF",
                        "&:hover": { bgcolor: "#EEF0FF" },
                        transform: isSequenceExpanded
                          ? "rotate(180deg)"
                          : "none",
                        transition: "transform 0.3s ease",
                      }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Box>

                  {/* Sequence panel with improved overlay styling */}
                  <Box
                    sx={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      height: "100%",
                      width: 400, // INCREASED WIDTH
                      transform: isSequenceExpanded
                        ? "translateX(0)"
                        : "translateX(100%)",
                      transition: "transform 0.3s ease-out",
                      borderLeft: "1px solid",
                      borderColor: "divider",
                      bgcolor: "rgba(249, 250, 251, 0.97)", // Slightly transparent to show it's an overlay
                      backdropFilter: "blur(5px)", // Add blur effect for modern look
                      boxShadow: "-5px 0 15px rgba(0,0,0,0.1)", // Add shadow for depth
                      zIndex: 11, // Between the toggle button and the image
                      pointerEvents: isSequenceExpanded ? "auto" : "none", // Only capture events when visible
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

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>Delete Slide?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isLastImage
              ? "This is the last slide. Deleting it will reset the visuals section."
              : "Are you sure you want to delete this slide?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (imageToDelete) {
                performDeleteImage(imageToDelete);
                setImageToDelete(null);
              }
              setShowDeleteConfirm(false);
            }}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
