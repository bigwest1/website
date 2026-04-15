import {
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent
} from "react";

import type {
  AuthoringWorkspaceMode,
  RendererInteractionDelta,
  RendererPrimitive,
  RendererSceneSnapshot,
  RoutingToolMode,
  SceneSpatialReference,
  SimulatorAnchorToolMode,
  TerrainToolMode,
  Vector3
} from "@course-creator-os/scene-authoring";

import { readPlacementDragPayload, type PlacementDragPayload } from "../../app/placement-drag";

type CanvasSceneViewportProps = {
  snapshot: RendererSceneSnapshot;
  activeMode: AuthoringWorkspaceMode;
  placementDraftArmed: boolean;
  sceneryBrushArmed: boolean;
  terrainMaterialPaintArmed: boolean;
  terrainToolMode: TerrainToolMode;
  routingToolMode: RoutingToolMode;
  simulatorAnchorToolMode: SimulatorAnchorToolMode;
  onSelectEntity: (reference: SceneSpatialReference, append: boolean) => void;
  onCommitInteraction: (
    target: NonNullable<RendererPrimitive["interactionTarget"]>,
    delta: RendererInteractionDelta,
  ) => void;
  onViewportGroundAction: (worldPoint: Vector3) => void;
  onHoverEntityChange: (reference: SceneSpatialReference | null) => void;
  onPreviewWorldPointChange: (worldPoint: Vector3 | null) => void;
  onExternalPlacementPreview: (payload: PlacementDragPayload, worldPoint: Vector3) => void;
  onExternalPlacementCommit: (payload: PlacementDragPayload, worldPoint: Vector3) => void;
  onExternalPlacementCancel: () => void;
  onZoomChange: (zoom: number) => void;
  onCameraPan: (delta: { x: number; z: number }) => void;
  onCameraOrbit: (delta: { yawDegrees: number; pitchDegrees: number }) => void;
  onDragStateChange: (payload: {
    state: "idle" | "dragging";
    reference: SceneSpatialReference | null;
    pendingActionLabel: string | null;
  }) => void;
};

type ViewportSize = {
  width: number;
  height: number;
};

type ScreenPoint = {
  x: number;
  y: number;
};

type DragState =
  | {
      kind: "interaction";
      primitive: RendererPrimitive;
      startWorld: Vector3;
      startScreen: ScreenPoint;
      deltaWorld: Vector3;
    }
  | {
      kind: "camera-pan";
      startWorld: Vector3;
    }
  | {
      kind: "camera-orbit";
      startScreen: ScreenPoint;
    }
  | null;

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 3.2;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toneFill(tone: RendererPrimitive["tone"]) {
  switch (tone) {
    case "accent":
      return "rgba(97, 170, 255, 0.24)";
    case "success":
      return "rgba(96, 201, 160, 0.24)";
    case "warning":
      return "rgba(255, 185, 102, 0.22)";
    case "danger":
      return "rgba(255, 109, 109, 0.22)";
    case "muted":
      return "rgba(170, 187, 210, 0.14)";
    case "default":
    default:
      return "rgba(124, 153, 196, 0.18)";
  }
}

function toneStroke(tone: RendererPrimitive["tone"]) {
  switch (tone) {
    case "accent":
      return "rgba(112, 186, 255, 0.92)";
    case "success":
      return "rgba(103, 221, 176, 0.92)";
    case "warning":
      return "rgba(255, 197, 120, 0.92)";
    case "danger":
      return "rgba(255, 122, 122, 0.94)";
    case "muted":
      return "rgba(151, 169, 196, 0.74)";
    case "default":
    default:
      return "rgba(135, 169, 214, 0.88)";
  }
}

function drawPriority(primitive: RendererPrimitive) {
  const layerPriority = {
    terrain: 0,
    routing: 1,
    scene: 2,
    simulator: 3,
    analysis: 4
  } satisfies Record<RendererPrimitive["layer"], number>;

  return primitive.renderPriority + layerPriority[primitive.layer] * 100;
}

function projectWorldPoint(
  point: Vector3,
  snapshot: RendererSceneSnapshot,
  size: ViewportSize,
): ScreenPoint {
  const pixelsPerMeter = 5.2 * snapshot.camera.zoom;
  const dx = point.x - snapshot.camera.target.x;
  const dz = point.z - snapshot.camera.target.z;

  if (snapshot.projectionMode === "isometric" || snapshot.projectionMode === "cinematic") {
    return {
      x: size.width / 2 + (dx - dz * 0.55) * pixelsPerMeter,
      y: size.height / 2 + (dx * 0.35 + dz * 0.7) * pixelsPerMeter * 0.72 - point.y * 0.8
    };
  }

  if (snapshot.projectionMode === "orbit") {
    return {
      x: size.width / 2 + dx * pixelsPerMeter * 0.92,
      y: size.height / 2 + dz * pixelsPerMeter * 0.8 - point.y * 0.4
    };
  }

  return {
    x: size.width / 2 + dx * pixelsPerMeter,
    y: size.height / 2 + dz * pixelsPerMeter
  };
}

function screenToWorldPoint(
  point: ScreenPoint,
  snapshot: RendererSceneSnapshot,
  size: ViewportSize,
): Vector3 {
  const pixelsPerMeter = 5.2 * snapshot.camera.zoom;
  const dx = (point.x - size.width / 2) / pixelsPerMeter;
  const dz = (point.y - size.height / 2) / pixelsPerMeter;

  return {
    x: snapshot.camera.target.x + dx,
    y: 0,
    z: snapshot.camera.target.z + dz
  };
}

function projectPrimitivePoints(
  primitive: RendererPrimitive,
  snapshot: RendererSceneSnapshot,
  size: ViewportSize,
  dragState: DragState,
) {
  if (
    dragState?.kind === "interaction" &&
    dragState.primitive.id === primitive.id &&
    primitive.geometryType === "point"
  ) {
    const point = primitive.position;
    return [
      projectWorldPoint(
        {
          x: point.x + dragState.deltaWorld.x,
          y: point.y,
          z: point.z + dragState.deltaWorld.z
        },
        snapshot,
        size,
      )
    ];
  }

  if (primitive.geometryType === "point") {
    return [projectWorldPoint(primitive.position, snapshot, size)];
  }

  const points =
    primitive.geometryType === "polyline" ? primitive.polyline.points : primitive.polygon.points;
  return points.map((point) => projectWorldPoint(point, snapshot, size));
}

function pointInPolygon(point: ScreenPoint, polygon: ScreenPoint[]) {
  let inside = false;

  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index++) {
    const current = polygon[index]!;
    const previous = polygon[previousIndex]!;
    const intersects =
      current.y > point.y !== previous.y > point.y &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y || 1e-6) +
          current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function distanceToSegment(point: ScreenPoint, start: ScreenPoint, end: ScreenPoint) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const projection =
    ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared;
  const t = clamp(projection, 0, 1);
  const projectedX = start.x + deltaX * t;
  const projectedY = start.y + deltaY * t;
  return Math.hypot(point.x - projectedX, point.y - projectedY);
}

function hitTestPrimitive(
  primitive: RendererPrimitive,
  pointer: ScreenPoint,
  snapshot: RendererSceneSnapshot,
  size: ViewportSize,
) {
  const points = projectPrimitivePoints(primitive, snapshot, size, null);

  if (primitive.geometryType === "point") {
    return Math.hypot(pointer.x - points[0]!.x, pointer.y - points[0]!.y) <= primitive.radius + 10;
  }

  if (primitive.geometryType === "polyline") {
    for (let index = 0; index < points.length - 1; index += 1) {
      const distance = distanceToSegment(pointer, points[index]!, points[index + 1]!);
      if (distance <= Math.max(8, primitive.width * 0.28)) {
        return true;
      }
    }
    return false;
  }

  return pointInPolygon(pointer, points);
}

function sortPrimitivesForHitTest(primitives: RendererPrimitive[]) {
    return [...primitives].sort((left, right) => {
      if (left.selected !== right.selected) {
        return left.selected ? -1 : 1;
    }

    if (left.geometryType !== right.geometryType) {
      const geometryPriority = {
        point: 0,
        polyline: 1,
        polygon: 2
      };

      return geometryPriority[left.geometryType] - geometryPriority[right.geometryType];
    }

    return drawPriority(right) - drawPriority(left);
  });
}

function pointerPosition(event: ReactPointerEvent<HTMLCanvasElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  };
}

function pointFromClient(clientX: number, clientY: number, element: HTMLElement) {
  const bounds = element.getBoundingClientRect();
  return {
    x: clientX - bounds.left,
    y: clientY - bounds.top
  };
}

function dragLabelForPrimitive(primitive: RendererPrimitive) {
  return primitive.interactionTarget?.kind === "entity-rotate"
    ? `Rotating ${primitive.label}`
    : primitive.interactionTarget?.kind === "entity-scale"
      ? `Scaling ${primitive.label}`
      : primitive.interactionTarget?.kind === "routing-bend"
        ? `Refining ${primitive.label}`
        : `Dragging ${primitive.label}`;
}

function supportsGroundCreation(
  activeMode: AuthoringWorkspaceMode,
  placementDraftArmed: boolean,
  sceneryBrushArmed: boolean,
  terrainMaterialPaintArmed: boolean,
  terrainToolMode: TerrainToolMode,
  routingToolMode: RoutingToolMode,
  simulatorAnchorToolMode: SimulatorAnchorToolMode,
) {
  if (activeMode === "placement") {
    return placementDraftArmed;
  }

  if (activeMode === "scenery-brush") {
    return sceneryBrushArmed;
  }

  if (activeMode === "terrain") {
    return terrainToolMode === "create-region" || terrainToolMode === "modifier-edit" || terrainMaterialPaintArmed;
  }

  if (activeMode === "routing") {
    return routingToolMode === "add-node";
  }

  if (activeMode === "simulator-anchors") {
    return simulatorAnchorToolMode !== "select-anchor";
  }

  return false;
}

function viewportPrimaryActionLabel(
  activeMode: AuthoringWorkspaceMode,
  placementDraftArmed: boolean,
  sceneryBrushArmed: boolean,
  terrainMaterialPaintArmed: boolean,
  terrainToolMode: TerrainToolMode,
  routingToolMode: RoutingToolMode,
  simulatorAnchorToolMode: SimulatorAnchorToolMode,
) {
  if (activeMode === "placement") {
    return placementDraftArmed
      ? "Click the ground to place the armed asset with live surface-snap feedback while keeping drawer context intact."
      : "Select, move, rotate, or scale scenery directly in the world.";
  }

  if (activeMode === "scenery-brush") {
    return sceneryBrushArmed
      ? "Click the ground to brush scenery from the current pack-aware palette while spacing and weighting stay visible."
      : "Load brush-ready assets from the scenery palette, then brush the world directly.";
  }

  if (activeMode === "terrain") {
    if (terrainMaterialPaintArmed) {
      return "Click the ground to paint terrain finish on the selected region without changing terrain shape or losing layer context.";
    }
    return terrainToolMode === "modifier-edit"
      ? "Paint the selected terrain region with the live sculpt brush."
      : terrainToolMode === "create-region"
        ? "Click the ground to stamp a new terrain region at the cursor."
        : "Select terrain first, then reshape or classify it in context.";
  }

  if (activeMode === "routing") {
    return routingToolMode === "add-node"
      ? "Click the ground to place the next routing node and keep hole flow readable."
      : "Select route handles in the world to refine continuity, width, elevation, and approach flow.";
  }

  if (activeMode === "simulator-anchors") {
    return simulatorAnchorToolMode === "select-anchor"
      ? "Select simulator geometry in the world to inspect export readiness."
      : "Click the ground to place simulator-critical geometry directly in context.";
  }

  return "Select, move, rotate, or scale scenery directly in the world.";
}

export function CanvasSceneViewport({
  snapshot,
  activeMode,
  placementDraftArmed,
  sceneryBrushArmed,
  terrainMaterialPaintArmed,
  terrainToolMode,
  routingToolMode,
  simulatorAnchorToolMode,
  onSelectEntity,
  onCommitInteraction,
  onViewportGroundAction,
  onHoverEntityChange,
  onPreviewWorldPointChange,
  onExternalPlacementPreview,
  onExternalPlacementCommit,
  onExternalPlacementCancel,
  onZoomChange,
  onCameraPan,
  onCameraOrbit,
  onDragStateChange
}: CanvasSceneViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 960,
    height: 560
  });
  const [dragState, setDragState] = useState<DragState>(null);
  const [hoveredPrimitiveId, setHoveredPrimitiveId] = useState<string | null>(null);
  const [externalPlacementActive, setExternalPlacementActive] = useState(false);
  const [, setExternalPlacementDepth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setViewportSize({
        width: Math.max(320, Math.round(entry.contentRect.width)),
        height: Math.max(360, Math.round(entry.contentRect.height))
      });
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(viewportSize.width * pixelRatio);
    canvas.height = Math.round(viewportSize.height * pixelRatio);
    canvas.style.width = `${viewportSize.width}px`;
    canvas.style.height = `${viewportSize.height}px`;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    const background = context.createLinearGradient(0, 0, 0, viewportSize.height);
    background.addColorStop(0, "rgba(8, 18, 34, 0.98)");
    background.addColorStop(0.35, "rgba(10, 22, 40, 0.99)");
    background.addColorStop(0.55, "rgba(6, 14, 26, 0.99)");
    background.addColorStop(1, "rgba(4, 10, 18, 1)");
    context.fillStyle = background;
    context.fillRect(0, 0, viewportSize.width, viewportSize.height);

    const gridStep = 26 * snapshot.camera.zoom;
    context.strokeStyle = "rgba(120, 149, 190, 0.08)";
    context.lineWidth = 1;
    for (let x = 0; x < viewportSize.width; x += gridStep) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, viewportSize.height);
      context.stroke();
    }
    for (let y = 0; y < viewportSize.height; y += gridStep) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(viewportSize.width, y);
      context.stroke();
    }

    if (snapshot.sceneBounds) {
      const topLeft = projectWorldPoint(
        { x: snapshot.sceneBounds.minX, y: 0, z: snapshot.sceneBounds.minZ },
        snapshot,
        viewportSize,
      );
      const bottomRight = projectWorldPoint(
        { x: snapshot.sceneBounds.maxX, y: 0, z: snapshot.sceneBounds.maxZ },
        snapshot,
        viewportSize,
      );
      context.save();
      context.strokeStyle = "rgba(120, 162, 222, 0.18)";
      context.setLineDash([8, 8]);
      context.lineWidth = 1;
      context.strokeRect(
        topLeft.x,
        topLeft.y,
        Math.max(1, bottomRight.x - topLeft.x),
        Math.max(1, bottomRight.y - topLeft.y),
      );
      context.restore();
    }

    for (const pass of snapshot.renderPasses.sort((left, right) => left.priority - right.priority)) {
      const passPrimitives = pass.primitiveIds
        .map((primitiveId) => snapshot.primitives.find((primitive) => primitive.id === primitiveId) ?? null)
        .filter((primitive): primitive is RendererPrimitive => primitive !== null)
        .sort((left, right) => drawPriority(left) - drawPriority(right));

      for (const primitive of passPrimitives) {
        const points = projectPrimitivePoints(primitive, snapshot, viewportSize, dragState);
      const stroke = toneStroke(primitive.tone);
      const fill = toneFill(primitive.tone);
      const hovered = primitive.id === hoveredPrimitiveId;

      context.save();
      context.strokeStyle = stroke;
      context.fillStyle = fill;
      context.lineWidth = primitive.selected ? 3 : hovered ? 2.5 : 1.5;
      context.globalAlpha = primitive.selected ? 1 : hovered ? 0.96 : 0.9;

      if (primitive.geometryType === "polygon") {
        context.beginPath();
        points.forEach((point, index) => {
          if (index === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        });
        context.closePath();
        context.fill();
        context.stroke();
      } else if (primitive.geometryType === "polyline") {
        context.beginPath();
        points.forEach((point, index) => {
          if (index === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        });
        context.lineWidth = Math.max(2, primitive.width * 0.18 * snapshot.camera.zoom);
        context.stroke();
      } else {
        const point = points[0]!;
        context.beginPath();
        context.arc(
          point.x,
          point.y,
          Math.max(4, primitive.radius * snapshot.camera.zoom * 0.4 + (hovered ? 1.4 : 0)),
          0,
          Math.PI * 2,
        );
        context.fill();
        context.stroke();
      }

      if (primitive.selected || hovered) {
        const anchorPoint =
          primitive.geometryType === "point"
            ? points[0]!
            : points[Math.floor(points.length / 2)]!;
        context.beginPath();
        context.arc(anchorPoint.x, anchorPoint.y, hovered ? 12 : 10, 0, Math.PI * 2);
        context.strokeStyle = hovered ? "rgba(255, 228, 168, 0.95)" : "rgba(255, 255, 255, 0.9)";
        context.lineWidth = 1.2;
        context.stroke();
      }

        context.restore();
      }
    }

    if (snapshot.runtimeStatus.activeTargetPosition) {
      const targetPoint = projectWorldPoint(snapshot.runtimeStatus.activeTargetPosition, snapshot, viewportSize);
      context.save();
      context.strokeStyle = "rgba(255, 236, 190, 0.95)";
      context.lineWidth = 1.4;
      context.beginPath();
      context.arc(targetPoint.x, targetPoint.y, 18, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(targetPoint.x - 8, targetPoint.y);
      context.lineTo(targetPoint.x + 8, targetPoint.y);
      context.moveTo(targetPoint.x, targetPoint.y - 8);
      context.lineTo(targetPoint.x, targetPoint.y + 8);
      context.stroke();
      if (snapshot.runtimeStatus.activeTargetLabel) {
        context.fillStyle = "rgba(227, 236, 248, 0.94)";
        context.font = '500 11px "JetBrains Mono", monospace';
        context.fillText(snapshot.runtimeStatus.activeTargetLabel, targetPoint.x + 14, targetPoint.y - 14);
      }
      context.restore();
    }
  }, [dragState, hoveredPrimitiveId, snapshot, viewportSize]);

  function hitPrimitive(pointer: ScreenPoint) {
    return sortPrimitivesForHitTest(snapshot.primitives).find(
      (primitive) => primitive.interactive && hitTestPrimitive(primitive, pointer, snapshot, viewportSize),
    );
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const pointer = pointerPosition(event);
    const worldPoint = screenToWorldPoint(pointer, snapshot, viewportSize);
    const hit = hitPrimitive(pointer);
    const cameraMode =
      event.button === 1 || event.button === 2 || event.altKey
        ? event.shiftKey
          ? "camera-orbit"
          : "camera-pan"
        : null;

    if (cameraMode) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      onDragStateChange({
        state: "dragging",
        reference: null,
        pendingActionLabel: cameraMode === "camera-orbit" ? "Orbiting camera" : "Panning camera"
      });
      setDragState(
        cameraMode === "camera-orbit"
          ? {
              kind: "camera-orbit",
              startScreen: pointer
            }
          : {
              kind: "camera-pan",
              startWorld: worldPoint
            },
      );
      return;
    }

    const groundCreationEnabled =
      event.button === 0 &&
      supportsGroundCreation(
        activeMode,
        placementDraftArmed,
        sceneryBrushArmed,
        terrainMaterialPaintArmed,
        terrainToolMode,
        routingToolMode,
        simulatorAnchorToolMode,
      );

    if (!hit) {
      onHoverEntityChange(null);
      setHoveredPrimitiveId(null);
      if (groundCreationEnabled) {
        onViewportGroundAction(worldPoint);
      }
      return;
    }

    if (groundCreationEnabled && !hit.interactionTarget) {
      onViewportGroundAction(worldPoint);
      return;
    }

    if (hit.entityRef) {
      onSelectEntity(hit.entityRef, event.shiftKey || event.metaKey);
    }

    if (!hit.interactionTarget) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    onDragStateChange({
      state: "dragging",
      reference: hit.entityRef,
      pendingActionLabel: dragLabelForPrimitive(hit)
    });
    setDragState({
      kind: "interaction",
      primitive: hit,
      startWorld: worldPoint,
      startScreen: pointer,
      deltaWorld: { x: 0, y: 0, z: 0 }
    });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const pointer = pointerPosition(event);

    if (!dragState) {
      const hit = hitPrimitive(pointer);
      setHoveredPrimitiveId(hit?.id ?? null);
      onHoverEntityChange(hit?.entityRef ?? null);
      if (
        supportsGroundCreation(
          activeMode,
          placementDraftArmed,
          sceneryBrushArmed,
          terrainMaterialPaintArmed,
          terrainToolMode,
          routingToolMode,
          simulatorAnchorToolMode,
        )
      ) {
        onPreviewWorldPointChange(screenToWorldPoint(pointer, snapshot, viewportSize));
      } else {
        onPreviewWorldPointChange(null);
      }
      return;
    }

    if (dragState.kind === "camera-pan") {
      const nextWorld = screenToWorldPoint(pointer, snapshot, viewportSize);
      onCameraPan({
        x: dragState.startWorld.x - nextWorld.x,
        z: dragState.startWorld.z - nextWorld.z
      });
      setDragState({
        kind: "camera-pan",
        startWorld: nextWorld
      });
      onPreviewWorldPointChange(null);
      return;
    }

    if (dragState.kind === "camera-orbit") {
      const deltaX = pointer.x - dragState.startScreen.x;
      const deltaY = pointer.y - dragState.startScreen.y;
      onCameraOrbit({
        yawDegrees: deltaX * 0.24,
        pitchDegrees: -deltaY * 0.16
      });
      setDragState({
        kind: "camera-orbit",
        startScreen: pointer
      });
      onPreviewWorldPointChange(null);
      return;
    }

    const nextWorld = screenToWorldPoint(pointer, snapshot, viewportSize);
    onDragStateChange({
      state: "dragging",
      reference: dragState.primitive.entityRef,
      pendingActionLabel: dragLabelForPrimitive(dragState.primitive)
    });
    setDragState({
      ...dragState,
      deltaWorld: {
        x: nextWorld.x - dragState.startWorld.x,
        y: 0,
        z: nextWorld.z - dragState.startWorld.z
      }
    });
    onPreviewWorldPointChange(null);
  }

  function releaseDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!dragState) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);

    if (dragState.kind === "interaction" && dragState.primitive.interactionTarget) {
      const nextWorld = screenToWorldPoint(pointerPosition(event), snapshot, viewportSize);
      const worldDelta = {
        x: nextWorld.x - dragState.startWorld.x,
        y: 0,
        z: nextWorld.z - dragState.startWorld.z
      };
      const screenDelta = {
        x: pointerPosition(event).x - dragState.startScreen.x,
        y: pointerPosition(event).y - dragState.startScreen.y
      };
      const delta: RendererInteractionDelta =
        dragState.primitive.interactionTarget.kind === "entity-rotate"
          ? {
              rotationDegrees: screenDelta.x * 0.4
            }
          : dragState.primitive.interactionTarget.kind === "entity-scale"
            ? {
                scaleFactor: clamp(1 + (screenDelta.x - screenDelta.y) / 180, 0.65, 1.65)
              }
            : dragState.primitive.interactionTarget.kind === "routing-bend" ||
                dragState.primitive.interactionTarget.kind === "corridor-bend"
              ? {
                  worldPoint: nextWorld
                }
              : dragState.primitive.interactionTarget.kind === "routing-height"
                ? {
                    heightDeltaMeters: clamp(-screenDelta.y / 28, -12, 12)
                  }
                : dragState.primitive.interactionTarget.kind === "routing-width" ||
                    dragState.primitive.interactionTarget.kind === "corridor-width" ||
                    dragState.primitive.interactionTarget.kind === "visibility-width"
                  ? {
                      widthDeltaMeters: worldDelta.z
                    }
                : {
                    worldDelta
                  };

      onCommitInteraction(dragState.primitive.interactionTarget, delta);
    }

    onDragStateChange({
      state: "idle",
      reference: null,
      pendingActionLabel: null
    });
    setDragState(null);
  }

  function handlePointerLeave() {
    setHoveredPrimitiveId(null);
    onHoverEntityChange(null);
    onPreviewWorldPointChange(null);
  }

  function handleExternalDragEnter(event: ReactDragEvent<HTMLDivElement>) {
    const payload = readPlacementDragPayload(event.dataTransfer);
    if (!payload) {
      return;
    }

    event.preventDefault();
    setExternalPlacementActive(true);
    setExternalPlacementDepth((depth) => depth + 1);
  }

  function handleExternalDragOver(event: ReactDragEvent<HTMLDivElement>) {
    const payload = readPlacementDragPayload(event.dataTransfer);
    const element = containerRef.current;
    if (!payload || !element) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setExternalPlacementActive(true);
    const worldPoint = screenToWorldPoint(pointFromClient(event.clientX, event.clientY, element), snapshot, viewportSize);
    onExternalPlacementPreview(payload, worldPoint);
  }

  function handleExternalDragLeave(event: ReactDragEvent<HTMLDivElement>) {
    const payload = readPlacementDragPayload(event.dataTransfer);
    if (!payload) {
      return;
    }

    setExternalPlacementDepth((depth) => {
      const nextDepth = Math.max(0, depth - 1);
      if (nextDepth === 0) {
        setExternalPlacementActive(false);
        onExternalPlacementCancel();
      }
      return nextDepth;
    });
  }

  function handleExternalDrop(event: ReactDragEvent<HTMLDivElement>) {
    const payload = readPlacementDragPayload(event.dataTransfer);
    const element = containerRef.current;
    if (!payload || !element) {
      return;
    }

    event.preventDefault();
    const worldPoint = screenToWorldPoint(pointFromClient(event.clientX, event.clientY, element), snapshot, viewportSize);
    setExternalPlacementActive(false);
    setExternalPlacementDepth(0);
    onExternalPlacementCommit(payload, worldPoint);
  }

  function handleWheel(event: ReactWheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.12 : 0.12;
    onZoomChange(clamp(Number((snapshot.camera.zoom + direction).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  }

  const modeDetail =
    activeMode === "scenery-brush"
      ? "brush-placement"
      : activeMode === "terrain"
      ? terrainToolMode
      : activeMode === "routing"
        ? routingToolMode
        : activeMode === "simulator-anchors"
          ? simulatorAnchorToolMode
          : "direct-manipulation";
  const primaryActionLabel = viewportPrimaryActionLabel(
    activeMode,
    placementDraftArmed,
    sceneryBrushArmed,
    terrainMaterialPaintArmed,
    terrainToolMode,
    routingToolMode,
    simulatorAnchorToolMode,
  );

  return (
    <div
      className="scene-canvas-shell"
      data-external-drag-active={externalPlacementActive}
      ref={containerRef}
      onDragEnter={handleExternalDragEnter}
      onDragLeave={handleExternalDragLeave}
      onDragOver={handleExternalDragOver}
      onDrop={handleExternalDrop}
    >
      <div className="scene-canvas-hud scene-canvas-hud-primary">
        <span>{snapshot.runtimeStatus.fidelity.replace(/-/g, " ")}</span>
        <strong>{modeDetail.replace(/-/g, " ")}</strong>
        <small>
          {snapshot.runtimeStatus.activeOverlayCount} overlays active · {snapshot.runtimeStatus.primitiveCount} primitives
        </small>
      </div>
      <div className="scene-canvas-hud scene-canvas-hud-secondary">
        <span>Primary Action</span>
        <strong>{externalPlacementActive ? "Drop the dragged asset to commit placement." : primaryActionLabel}</strong>
        <small>LMB create/select · MMB/RMB/Alt pan · Shift+Alt orbit · Wheel zoom</small>
      </div>
      {externalPlacementActive ? (
        <div className="scene-canvas-external-drop">
          <span>Direct Drag Placement</span>
          <strong>Drop into the world to place with live ghosting.</strong>
          <small>Esc or drag away to cancel.</small>
        </div>
      ) : null}
      <div className="scene-canvas-legend scene-canvas-legend-secondary">
        <span>
          {snapshot.sceneBounds
            ? `${Math.round(snapshot.sceneBounds.widthMeters)}m × ${Math.round(snapshot.sceneBounds.depthMeters)}m scene envelope`
            : "Scene envelope pending"}
        </span>
        <strong>{snapshot.runtimeStatus.qualityTier.replace(/-/g, " ")}</strong>
      </div>
      <div className="scene-canvas-legend scene-canvas-legend-secondary">
        <span>{snapshot.runtimeStatus.previewLabel ?? snapshot.runtimeStatus.activeTargetLabel ?? "No active target"}</span>
        <strong>
          {snapshot.runtimeStatus.previewMode !== "idle"
            ? snapshot.runtimeStatus.previewMode.replace(/-/g, " ")
            : `${snapshot.renderPasses.length} render passes`}
        </strong>
      </div>
      <div className="scene-canvas-overlay-strip">
        {snapshot.overlays
          .filter((overlay) => overlay.active)
          .sort((left, right) => right.priority - left.priority)
          .map((overlay) => (
            <span key={overlay.overlayId} className="scene-canvas-overlay-chip">
              {overlay.label} · {overlay.itemCount}
            </span>
          ))}
      </div>
      <canvas
        aria-label="Scene authoring viewport"
        className="scene-canvas"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={releaseDrag}
        onPointerLeave={(event) => {
          releaseDrag(event);
          handlePointerLeave();
        }}
        onWheel={handleWheel}
        ref={canvasRef}
        tabIndex={0}
      />
    </div>
  );
}
