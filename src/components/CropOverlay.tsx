import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { View, Image, PanResponder, Animated, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import {
  CropAspectRatioKey,
  NormalizedCropRect,
} from "@/features/image-tools/types";

const MIN_BOX_SIZE = 48; // display px — small enough to be usable, large enough not to vanish under a finger
const HANDLE_HIT_SIZE = 32;

const RATIO_VALUES: Record<Exclude<CropAspectRatioKey, "free">, number> = {
  square: 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "4:5": 4 / 5,
  "9:16": 9 / 16,
};

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function centeredRectForRatio(
  displayWidth: number,
  displayHeight: number,
  ratio: number,
): Rect {
  let width: number;
  let height: number;
  if (displayWidth / displayHeight > ratio) {
    height = displayHeight;
    width = displayHeight * ratio;
  } else {
    width = displayWidth;
    height = displayWidth / ratio;
  }
  return {
    x: (displayWidth - width) / 2,
    y: (displayHeight - height) / 2,
    width,
    height,
  };
}

export interface CropOverlayHandle {
  /** Returns the current crop box as a rect normalized to the original image (0–1 range). */
  getNormalizedRect: () => NormalizedCropRect;
  /** Resets the crop box to the given aspect ratio (or full-frame for 'free'). */
  resetToRatio: (ratio: CropAspectRatioKey) => void;
}

interface CropOverlayProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  aspectRatio: CropAspectRatioKey;
}

export const CropOverlay = forwardRef<CropOverlayHandle, CropOverlayProps>(
  function CropOverlay(
    { imageUri, imageWidth, imageHeight, displayWidth, aspectRatio },
    ref,
  ) {
    const { colors } = useTheme();
    const displayHeight = displayWidth * (imageHeight / imageWidth);

    // The single source of truth for the box, in display pixels. Animated
    // values drive the visual position/size without going through React
    // re-renders on every drag frame; rectRef mirrors the same numbers so
    // gesture handlers can read/clamp against the current state
    // synchronously (Animated.Value's own current value isn't meant to be
    // read directly).
    const rectRef = useRef<Rect>(
      centeredRectForRatio(displayWidth, displayHeight, 1),
    );
    const animX = useRef(new Animated.Value(rectRef.current.x)).current;
    const animY = useRef(new Animated.Value(rectRef.current.y)).current;
    const animW = useRef(new Animated.Value(rectRef.current.width)).current;
    const animH = useRef(new Animated.Value(rectRef.current.height)).current;

    const applyRect = (next: Rect): void => {
      rectRef.current = next;
      animX.setValue(next.x);
      animY.setValue(next.y);
      animW.setValue(next.width);
      animH.setValue(next.height);
    };

    const resetToRatio = (ratio: CropAspectRatioKey): void => {
      const next =
        ratio === "free"
          ? { x: 0, y: 0, width: displayWidth, height: displayHeight }
          : centeredRectForRatio(
              displayWidth,
              displayHeight,
              RATIO_VALUES[ratio],
            );
      applyRect(next);
    };

    useImperativeHandle(ref, () => ({
      resetToRatio,
      getNormalizedRect: () => ({
        x: rectRef.current.x / displayWidth,
        y: rectRef.current.y / displayHeight,
        width: rectRef.current.width / displayWidth,
        height: rectRef.current.height / displayHeight,
      }),
    }));

    // Drag-to-move: pan anywhere inside the box, clamped so it can't leave
    // the displayed image bounds.
    const moveStart = useRef<Rect>(rectRef.current);
    const movePanResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            moveStart.current = { ...rectRef.current };
          },
          onPanResponderMove: (_evt, gesture) => {
            const start = moveStart.current;
            const x = Math.min(
              Math.max(start.x + gesture.dx, 0),
              displayWidth - start.width,
            );
            const y = Math.min(
              Math.max(start.y + gesture.dy, 0),
              displayHeight - start.height,
            );
            applyRect({ ...start, x, y });
          },
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [displayWidth, displayHeight],
    );

    // Resize from any of the 4 corners. Each corner drag keeps the
    // *opposite* corner fixed as an anchor. When a ratio is locked, the
    // horizontal drag drives width and height is derived from it, then
    // re-clamped against however much room that corner actually has.
    type Corner = "tl" | "tr" | "bl" | "br";
    const resizeStart = useRef<Rect>(rectRef.current);

    function resizeFromCorner(
      start: Rect,
      corner: Corner,
      dx: number,
      dy: number,
    ): Rect {
      const anchor =
        corner === "br"
          ? { x: start.x, y: start.y }
          : corner === "bl"
            ? { x: start.x + start.width, y: start.y }
            : corner === "tr"
              ? { x: start.x, y: start.y + start.height }
              : { x: start.x + start.width, y: start.y + start.height }; // 'tl'

      const rawMovingCorner =
        corner === "br"
          ? { x: start.x + start.width + dx, y: start.y + start.height + dy }
          : corner === "bl"
            ? { x: start.x + dx, y: start.y + start.height + dy }
            : corner === "tr"
              ? { x: start.x + start.width + dx, y: start.y + dy }
              : { x: start.x + dx, y: start.y + dy }; // 'tl'

      const movingCorner = {
        x: Math.min(Math.max(rawMovingCorner.x, 0), displayWidth),
        y: Math.min(Math.max(rawMovingCorner.y, 0), displayHeight),
      };

      let width = Math.abs(movingCorner.x - anchor.x);
      let height = Math.abs(movingCorner.y - anchor.y);
      const maxWidth =
        corner === "bl" || corner === "tl" ? anchor.x : displayWidth - anchor.x;
      const maxHeight =
        corner === "tl" || corner === "tr"
          ? anchor.y
          : displayHeight - anchor.y;

      if (aspectRatio !== "free") {
        const ratio = RATIO_VALUES[aspectRatio];
        height = width / ratio;
        if (height > maxHeight) {
          height = maxHeight;
          width = height * ratio;
        }
      }

      width = Math.min(Math.max(width, MIN_BOX_SIZE), maxWidth);
      height =
        aspectRatio === "free"
          ? Math.min(Math.max(height, MIN_BOX_SIZE), maxHeight)
          : width / RATIO_VALUES[aspectRatio];

      const x =
        corner === "bl" || corner === "tl" ? anchor.x - width : anchor.x;
      const y =
        corner === "tl" || corner === "tr" ? anchor.y - height : anchor.y;

      return { x, y, width, height };
    }

    const cornerPanResponders = useMemo(
      () =>
        (["tl", "tr", "bl", "br"] as Corner[]).reduce(
          (acc, corner) => {
            acc[corner] = PanResponder.create({
              onStartShouldSetPanResponder: () => true,
              onPanResponderGrant: () => {
                resizeStart.current = { ...rectRef.current };
              },
              onPanResponderMove: (_evt, gesture) => {
                applyRect(
                  resizeFromCorner(
                    resizeStart.current,
                    corner,
                    gesture.dx,
                    gesture.dy,
                  ),
                );
              },
            });
            return acc;
          },
          {} as Record<Corner, ReturnType<typeof PanResponder.create>>,
        ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [displayWidth, displayHeight, aspectRatio],
    );

    return (
      <View style={{ width: displayWidth, height: displayHeight }}>
        <Image
          source={{ uri: imageUri }}
          style={{ width: displayWidth, height: displayHeight }}
          resizeMode="contain"
        />

        {/* Dimming overlay outside the crop box, built from 4 plain views
          rather than a mask — simplest option that needs no new library. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.dim, { top: 0, left: 0, right: 0, height: animY }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dim,
            { left: 0, top: animY, width: animX, height: animH },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dim,
            {
              left: Animated.add(animX, animW),
              top: animY,
              right: 0,
              height: animH,
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dim,
            { left: 0, right: 0, top: Animated.add(animY, animH), bottom: 0 },
          ]}
        />

        <Animated.View
          {...movePanResponder.panHandlers}
          style={[
            styles.box,
            {
              borderColor: colors.primary,
              transform: [{ translateX: animX }, { translateY: animY }],
              width: animW,
              height: animH,
            },
          ]}
        />

        <Animated.View
          {...cornerPanResponders.tl.panHandlers}
          hitSlop={{
            top: HANDLE_HIT_SIZE / 2,
            bottom: HANDLE_HIT_SIZE / 2,
            left: HANDLE_HIT_SIZE / 2,
            right: HANDLE_HIT_SIZE / 2,
          }}
          style={[
            styles.handle,
            {
              backgroundColor: colors.primary,
              transform: [{ translateX: animX }, { translateY: animY }],
            },
          ]}
        />
        <Animated.View
          {...cornerPanResponders.tr.panHandlers}
          hitSlop={{
            top: HANDLE_HIT_SIZE / 2,
            bottom: HANDLE_HIT_SIZE / 2,
            left: HANDLE_HIT_SIZE / 2,
            right: HANDLE_HIT_SIZE / 2,
          }}
          style={[
            styles.handle,
            {
              backgroundColor: colors.primary,
              transform: [
                { translateX: Animated.add(animX, animW) },
                { translateY: animY },
              ],
            },
          ]}
        />
        <Animated.View
          {...cornerPanResponders.bl.panHandlers}
          hitSlop={{
            top: HANDLE_HIT_SIZE / 2,
            bottom: HANDLE_HIT_SIZE / 2,
            left: HANDLE_HIT_SIZE / 2,
            right: HANDLE_HIT_SIZE / 2,
          }}
          style={[
            styles.handle,
            {
              backgroundColor: colors.primary,
              transform: [
                { translateX: animX },
                { translateY: Animated.add(animY, animH) },
              ],
            },
          ]}
        />
        <Animated.View
          {...cornerPanResponders.br.panHandlers}
          hitSlop={{
            top: HANDLE_HIT_SIZE / 2,
            bottom: HANDLE_HIT_SIZE / 2,
            left: HANDLE_HIT_SIZE / 2,
            right: HANDLE_HIT_SIZE / 2,
          }}
          style={[
            styles.handle,
            {
              backgroundColor: colors.primary,
              transform: [
                { translateX: Animated.add(animX, animW) },
                { translateY: Animated.add(animY, animH) },
              ],
            },
          ]}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  dim: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  box: {
    position: "absolute",
    top: 0,
    left: 0,
    borderWidth: 2,
  },
  handle: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -10,
    marginTop: -10,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
