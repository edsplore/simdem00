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
  Chip,
  InputAdornment,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  ColorLens as ColorLensIcon,
} from "@mui/icons-material";

interface Hotspot {
  id: string;
  name: string;
  type: "hotspot";
  hotspotType:
    | "button"
    | "dropdown"
    | "checkbox"
    | "textfield"
    | "highlight"
    | "coaching";
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings: {
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

interface ImageHotspotProps {
  imageUrl: string;
  onHotspotsChange?: (hotspots: Hotspot[]) => void;
  hotspots?: Hotspot[];
  onEditHotspot?: (hotspot: Hotspot) => void;
  editingHotspot?: Hotspot | null;
  containerWidth: number;
}

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
  const [scale, setScale] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [originalImageSize, setOriginalImageSize] = useState({
    width: 0,
    height: 0,
  });
  const [newOption, setNewOption] = useState("");
  const [optionsList, setOptionsList] = useState<string[]>([]);

  // Log coordinates for debugging
  useEffect(() => {
    if (currentHotspot && currentHotspot.coordinates) {
      console.log("Current hotspot coordinates:", currentHotspot.coordinates);
    }
  }, [currentHotspot]);

  // Track original image size
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setOriginalImageSize({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);

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

  // Track image size changes
  useEffect(() => {
    const updateImageSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const img = container.querySelector("img");
        if (img) {
          const rect = img.getBoundingClientRect();
          setImageSize({ width: rect.width, height: rect.height });
          setScale(rect.width / img.naturalWidth);
        }
      }
    };

    const observer = new ResizeObserver(updateImageSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
      console.log(
        "Editing hotspot with coordinates:",
        editingHotspot.coordinates,
      );
    }
  }, [editingHotspot]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const img = containerRef.current.querySelector("img");
    if (!img) return;

    const rect = img.getBoundingClientRect();
    // Store coordinates relative to original image size
    const x = ((e.clientX - rect.left) / rect.width) * originalImageSize.width;
    const y = ((e.clientY - rect.top) / rect.height) * originalImageSize.height;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;

    const img = containerRef.current.querySelector("img");
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * originalImageSize.width;
    const y = ((e.clientY - rect.top) / rect.height) * originalImageSize.height;

    // Create a properly structured coordinates object
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
      },
    });

    console.log("Drawing hotspot with coordinates:", coordinates);
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
      console.log(
        "Completed drawing with coordinates:",
        currentHotspot.coordinates,
      );
    }
  };

  const calculateDialogPosition = (hotspot: Partial<Hotspot>) => {
    if (!containerRef.current || !hotspot || !hotspot.coordinates) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const img = containerRef.current.querySelector("img");
    if (!img) return;

    const imgRect = img.getBoundingClientRect();
    const scale = imgRect.width / originalImageSize.width;
    const dialogHeight = 520; // Fixed dialog height
    const dialogWidth = 320; // Fixed dialog width
    const padding = 16; // Padding from edges

    // Calculate initial position relative to the hotspot
    let x = hotspot.coordinates.x * scale + imgRect.left;
    let y = hotspot.coordinates.y * scale + imgRect.top;

    // Try positioning to the right of the hotspot
    let left = x + hotspot.coordinates.width * scale + padding;

    // If it would go off the right edge, position to the left instead
    if (left + dialogWidth > viewportSize.width) {
      left = x - dialogWidth - padding;
    }

    // If it would go off the left edge, position it at the left edge with padding
    if (left < padding) {
      left = padding;
    }

    // Center vertically by default
    let top = y - dialogHeight / 2;

    // Ensure the dialog stays within the vertical bounds
    if (top < padding) {
      top = padding;
    } else if (top + dialogHeight > viewportSize.height - padding) {
      top = viewportSize.height - dialogHeight - padding;
    }

    setDialogPosition({ top, left });
  };

  // Recalculate position when editing an existing hotspot
  useEffect(() => {
    if (editingHotspot) {
      calculateDialogPosition(editingHotspot);
    }
  }, [editingHotspot, viewportSize]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (showSettings && currentHotspot) {
        calculateDialogPosition(currentHotspot);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  const handleSettingsSave = (settings: Partial<Hotspot>) => {
    // Ensure currentHotspot and coordinates exist
    if (!currentHotspot || !currentHotspot.coordinates) {
      console.error(
        "Cannot save hotspot - missing coordinates:",
        currentHotspot,
      );
      return;
    }

    const id = editMode ? editingId : Date.now().toString();

    // Initialize type-specific settings based on hotspotType
    let hotspotSettings: any = {};
    const hotspotType = settings.hotspotType || "button";

    switch (hotspotType) {
      case "dropdown":
        hotspotSettings = {
          placeholder: settings.settings?.placeholder || "Select an option",
          advanceOnSelect:
            settings.settings?.advanceOnSelect !== undefined
              ? settings.settings.advanceOnSelect
              : true,
        };
        break;
      case "checkbox":
        hotspotSettings = {
          advanceOnCheck:
            settings.settings?.advanceOnCheck !== undefined
              ? settings.settings.advanceOnCheck
              : true,
        };
        break;
      case "textfield":
        hotspotSettings = {
          placeholder: settings.settings?.placeholder || "Enter text...",
          textColor: settings.settings?.textColor || "#000000",
          fontSize: settings.settings?.fontSize || 14,
        };
        break;
      case "highlight":
        hotspotSettings = {
          highlightColor:
            settings.settings?.highlightColor || "rgba(255, 193, 7, 0.8)",
        };
        break;
      case "coaching":
        hotspotSettings = {
          tipText: settings.settings?.tipText || "Coaching tip",
          tipPosition: settings.settings?.tipPosition || "top",
        };
        break;
      case "button":
        hotspotSettings = {
          font: settings.settings?.font || "Inter",
          fontSize: settings.settings?.fontSize || 16,
          buttonColor: settings.settings?.buttonColor || "#00AB55",
          textColor: settings.settings?.textColor || "#FFFFFF",
          timeoutDuration: settings.settings?.timeoutDuration || 2,
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

    // Create a complete hotspot with explicit coordinates
    const hotspot: Hotspot = {
      id,
      name: settings.name || "Untitled hotspot",
      type: "hotspot",
      hotspotType,
      coordinates: {
        // Explicitly use Number to ensure they're numeric values, not undefined
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

    console.log("Saving hotspot with coordinates:", hotspot.coordinates);

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

  // Function to remove a hotspot
  const removeHotspot = (id: string) => {
    const newHotspots = hotspots.filter((h) => h.id !== id);
    onHotspotsChange?.(newHotspots);
  };

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
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
        <Box
          component="img"
          src={imageUrl}
          alt="Hotspot canvas"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />

        {/* Existing hotspots */}
        {hotspots.map((hotspot) => (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              if (!editMode || editingId !== hotspot.id) {
                onEditHotspot?.(hotspot);
              }
            }}
            key={hotspot.id}
            sx={{
              position: "absolute",
              left: `${(hotspot.coordinates.x / originalImageSize.width) * 100}%`,
              top: `${(hotspot.coordinates.y / originalImageSize.height) * 100}%`,
              width: `${(hotspot.coordinates.width / originalImageSize.width) * 100}%`,
              height: `${(hotspot.coordinates.height / originalImageSize.height) * 100}%`,
              border: "2px solid #444CE7",
              borderColor: editingId === hotspot.id ? "#00AB55" : "#444CE7",
              backgroundColor: "rgba(68, 76, 231, 0.1)",
              cursor: "pointer",
            }}
          />
        ))}

        {/* Currently drawing hotspot */}
        {currentHotspot && currentHotspot.coordinates && (
          <Box
            sx={{
              position: "absolute",
              left: `${(currentHotspot.coordinates.x / originalImageSize.width) * 100}%`,
              top: `${(currentHotspot.coordinates.y / originalImageSize.height) * 100}%`,
              width: `${(currentHotspot.coordinates.width / originalImageSize.width) * 100}%`,
              height: `${(currentHotspot.coordinates.height / originalImageSize.height) * 100}%`,
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
              Math.min(dialogPosition.top, viewportSize.height - 520 - 16),
            ),
            left: Math.max(
              16,
              Math.min(dialogPosition.left, viewportSize.width - 320 - 16),
            ),
            maxWidth: 320,
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
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: "#F5F6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {editMode ? (
                    <EditIcon sx={{ fontSize: 16, color: "#444CE7" }} />
                  ) : (
                    <AddIcon sx={{ fontSize: 16, color: "#444CE7" }} />
                  )}
                </Box>
                <Typography variant="subtitle1" fontWeight="600">
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
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label="Name *"
                defaultValue={currentHotspot?.name || "Untitled button"}
                onChange={(e) =>
                  setCurrentHotspot((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />

              <FormControl fullWidth size="small">
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
                >
                  <MenuItem value="button">Button</MenuItem>
                  <MenuItem value="dropdown">Dropdown</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                  <MenuItem value="textfield">Text Field</MenuItem>
                  <MenuItem value="highlight">Highlight</MenuItem>
                  <MenuItem value="coaching">Coaching Tip</MenuItem>
                </Select>
              </FormControl>

              {/* Only show font/size/color options for button type */}
              {(currentHotspot?.hotspotType === "button" ||
                !currentHotspot?.hotspotType) && (
                <>
                  <Stack direction="row" spacing={1}>
                    <FormControl fullWidth size="small">
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
                      >
                        <MenuItem value="Inter">Inter</MenuItem>
                        <MenuItem value="Arial">Arial</MenuItem>
                        <MenuItem value="Roboto">Roboto</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
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
                      >
                        {[12, 14, 16, 18, 20].map((size) => (
                          <MenuItem key={size} value={size}>
                            {size}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  <FormControl fullWidth size="small">
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
                    >
                      {[1, 2, 3, 4, 5].map((duration) => (
                        <MenuItem key={duration} value={duration}>
                          {duration} sec
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Button Color"
                      value={currentHotspot?.settings?.buttonColor || "#00AB55"}
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
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
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

                    <TextField
                      size="small"
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
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
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
                                currentHotspot?.settings?.textColor || "#FFFFFF"
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
                  </Stack>
                </>
              )}

              {/* Dropdown-specific settings */}
              {currentHotspot?.hotspotType === "dropdown" && (
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
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
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={
                          currentHotspot?.settings?.advanceOnSelect || true
                        }
                        onChange={(e) =>
                          setCurrentHotspot((prev) => ({
                            ...prev,
                            settings: {
                              ...prev?.settings,
                              advanceOnSelect: e.target.checked,
                            },
                          }))
                        }
                      />
                    }
                    label={
                      <Typography variant="body2">Advance On Select</Typography>
                    }
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Dropdown Options
                  </Typography>

                  {/* Options chip display */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {optionsList.map((option, index) => (
                      <Chip
                        key={index}
                        label={option}
                        onDelete={() => handleDeleteOption(option)}
                        size="small"
                        sx={{ margin: "2px" }}
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
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleAddOption}
                      disabled={!newOption.trim()}
                    >
                      Add
                    </Button>
                  </Stack>
                </Stack>
              )}

              {/* Checkbox-specific settings */}
              {currentHotspot?.hotspotType === "checkbox" && (
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={currentHotspot?.settings?.advanceOnCheck || true}
                      onChange={(e) =>
                        setCurrentHotspot((prev) => ({
                          ...prev,
                          settings: {
                            ...prev?.settings,
                            advanceOnCheck: e.target.checked,
                          },
                        }))
                      }
                    />
                  }
                  label={
                    <Typography variant="body2">Advance On Check</Typography>
                  }
                />
              )}

              {/* TextField-specific settings */}
              {currentHotspot?.hotspotType === "textfield" && (
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
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
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Text Color"
                    value={currentHotspot?.settings?.textColor || "#000000"}
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
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              bgcolor:
                                currentHotspot?.settings?.textColor ||
                                "#000000",
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
                              currentHotspot?.settings?.textColor || "#000000"
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
                </Stack>
              )}

              {/* Highlight-specific settings */}
              {currentHotspot?.hotspotType === "highlight" && (
                <TextField
                  size="small"
                  fullWidth
                  label="Highlight Color"
                  value={
                    currentHotspot?.settings?.highlightColor ||
                    "rgba(255, 193, 7, 0.8)"
                  }
                  onChange={(e) =>
                    setCurrentHotspot((prev) => ({
                      ...prev,
                      settings: {
                        ...prev?.settings,
                        highlightColor: e.target.value,
                      },
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
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
                        <input
                          type="color"
                          value={
                            currentHotspot?.settings?.highlightColor?.replace(
                              /[^#\w]/g,
                              "",
                            ) || "#FFC107"
                          }
                          onChange={(e) =>
                            setCurrentHotspot((prev) => ({
                              ...prev,
                              settings: {
                                ...prev?.settings,
                                highlightColor:
                                  e.target.value.replace(/^#/, "rgba(") +
                                  ", 0.8)",
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
              )}

              {/* Coaching-specific settings */}
              {currentHotspot?.hotspotType === "coaching" && (
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
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
                  <FormControl fullWidth size="small">
                    <InputLabel>Tip Position</InputLabel>
                    <Select
                      label="Tip Position"
                      value={currentHotspot?.settings?.tipPosition || "top"}
                      onChange={(e) =>
                        setCurrentHotspot((prev) => ({
                          ...prev,
                          settings: {
                            ...prev?.settings,
                            tipPosition: e.target.value as
                              | "top"
                              | "bottom"
                              | "left"
                              | "right",
                          },
                        }))
                      }
                    >
                      <MenuItem value="top">Top</MenuItem>
                      <MenuItem value="bottom">Bottom</MenuItem>
                      <MenuItem value="left">Left</MenuItem>
                      <MenuItem value="right">Right</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              )}

              {/* Button-specific settings (shown for button type only) */}
              {(currentHotspot?.hotspotType === "button" ||
                !currentHotspot?.hotspotType) && (
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={
                            currentHotspot?.settings?.highlightField || false
                          }
                          onChange={(e) =>
                            setCurrentHotspot((prev) => ({
                              ...prev,
                              settings: {
                                ...prev?.settings,
                                highlightField: e.target.checked,
                              },
                            }))
                          }
                        />
                      }
                      label={
                        <Typography variant="body2">Highlight Field</Typography>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={
                            currentHotspot?.settings?.enableHotkey || false
                          }
                          onChange={(e) =>
                            setCurrentHotspot((prev) => ({
                              ...prev,
                              settings: {
                                ...prev?.settings,
                                enableHotkey: e.target.checked,
                              },
                            }))
                          }
                        />
                      }
                      label={
                        <Typography variant="body2">Enable Hotkey</Typography>
                      }
                    />
                  </Stack>
                </Stack>
              )}
            </Stack>

            {/* Actions */}
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(false);
                  setCurrentHotspot(null);
                  setEditMode(false);
                  setEditingId(null);
                }}
                sx={{ textTransform: "none" }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSettingsSave(currentHotspot || {});
                }}
                sx={{
                  bgcolor: "#444CE7",
                  "&:hover": { bgcolor: "#3538CD" },
                  textTransform: "none",
                }}
              >
                {editMode ? "Update" : "Save"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default ImageHotspot;
