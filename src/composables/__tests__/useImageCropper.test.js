import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('vue-sonner', () => ({
    toast: { error: vi.fn() }
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({ t: (key) => key, locale: require('vue').ref('en') })
}));

import {
    applyTransforms,
    cropImage,
    useImageCropper
} from '../useImageCropper';

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 *
 * @param width
 * @param height
 */
function makeImage(width, height) {
    return { width, height };
}

/**
 *
 * @param root0
 * @param root0.left
 * @param root0.top
 * @param root0.width
 * @param root0.height
 * @param root0.imgW
 * @param root0.imgH
 * @param root0.rotate
 * @param root0.flipH
 * @param root0.flipV
 */
function makeCropperResult({
    left = 0,
    top = 0,
    width = 100,
    height = 75,
    imgW = 100,
    imgH = 75,
    rotate = 0,
    flipH = false,
    flipV = false
} = {}) {
    return {
        coordinates: { left, top, width, height },
        image: {
            width: imgW,
            height: imgH,
            transforms: {
                rotate,
                flip: { horizontal: flipH, vertical: flipV }
            }
        }
    };
}

let mockCtx;
let canvasInstances;

/**
 *
 */
function setupCanvasMocks() {
    canvasInstances = [];
    mockCtx = {
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        fillStyle: ''
    };

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'canvas') {
            const canvas = {
                width: 0,
                height: 0,
                getContext: vi.fn(() => mockCtx),
                toDataURL: vi.fn(() => 'data:image/jpeg;base64,mock'),
                toBlob: vi.fn((cb) =>
                    cb(new Blob(['mock'], { type: 'image/png' }))
                )
            };
            canvasInstances.push(canvas);
            return canvas;
        }
        return origCreateElement(tag);
    });

    return { mockCtx, canvasInstances };
}

// ─── useImageCropper composable ──────────────────────────────────────

describe('useImageCropper', () => {
    test('returns all expected properties', () => {
        const result = useImageCropper();
        expect(result).toHaveProperty('cropperRef');
        expect(result).toHaveProperty('cropperImageSrc');
        expect(result).toHaveProperty('resetCropState');
        expect(result).toHaveProperty('loadImageForCrop');
        expect(result).toHaveProperty('getCroppedBlob');
    });

    test('initial state is correct', () => {
        const { cropperRef, cropperImageSrc } = useImageCropper();
        expect(cropperRef.value).toBeNull();
        expect(cropperImageSrc.value).toBe('');
    });

    test('resetCropState clears all state', () => {
        const { cropperImageSrc, resetCropState } = useImageCropper();
        cropperImageSrc.value = 'data:image/png;base64,test';
        resetCropState();
        expect(cropperImageSrc.value).toBe('');
    });

    test('getCroppedBlob returns null when cropperRef is null', async () => {
        const { getCroppedBlob } = useImageCropper();
        const result = await getCroppedBlob();
        expect(result).toBeNull();
    });

    test('getCroppedBlob returns null when getResult returns no coordinates', async () => {
        const { getCroppedBlob, cropperRef } = useImageCropper();
        cropperRef.value = { getResult: () => ({}) };
        const result = await getCroppedBlob();
        expect(result).toBeNull();
    });
});

// ─── cropImage ───────────────────────────────────────────────────────

describe('cropImage', () => {
    beforeEach(() => {
        setupCanvasMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('returns null when no cropperResult', async () => {
        const result = await cropImage(makeImage(100, 75), 1, null);
        expect(result).toBeNull();
    });

    test('returns null when cropperResult has no coordinates', async () => {
        const result = await cropImage(makeImage(100, 75), 1, { image: {} });
        expect(result).toBeNull();
    });

    test('returns null when no originalImage', async () => {
        const result = await cropImage(null, 1, makeCropperResult());
        expect(result).toBeNull();
    });

    test('returns original file when no transforms and crop covers full image', async () => {
        const file = new File(['test'], 'test.png', { type: 'image/png' });
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 0,
            top: 0,
            width: 200,
            height: 150,
            imgW: 200,
            imgH: 150
        });

        const result = await cropImage(img, 1, cropResult, file);
        expect(result).toBe(file);
    });

    test('returns original file when crop is within 1px tolerance', async () => {
        const file = new File(['test'], 'test.png', { type: 'image/png' });
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 1,
            top: 1,
            width: 199,
            height: 149,
            imgW: 200,
            imgH: 150
        });

        const result = await cropImage(img, 1, cropResult, file);
        expect(result).toBe(file);
    });

    test('does NOT return original file when crop is partial', async () => {
        const file = new File(['test'], 'test.png', { type: 'image/png' });
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 10,
            top: 10,
            width: 100,
            height: 75,
            imgW: 200,
            imgH: 150
        });

        const result = await cropImage(img, 1, cropResult, file);
        expect(result).not.toBe(file);
        expect(result).toBeInstanceOf(Blob);
    });

    test('does NOT return original file when transforms are applied', async () => {
        const file = new File(['test'], 'test.png', { type: 'image/png' });
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 0,
            top: 0,
            width: 200,
            height: 150,
            imgW: 200,
            imgH: 150,
            rotate: 90
        });

        const result = await cropImage(img, 1, cropResult, file);
        expect(result).not.toBe(file);
        expect(result).toBeInstanceOf(Blob);
    });

    test('respects previewScale when computing crop dimensions', async () => {
        const img = makeImage(1600, 1200);
        const cropResult = makeCropperResult({
            left: 50,
            top: 50,
            width: 200,
            height: 150,
            imgW: 400,
            imgH: 300
        });

        await cropImage(img, 0.25, cropResult);

        // cropW = 200 / 0.25 = 800, cropH = 150 / 0.25 = 600
        const cropCanvas = canvasInstances[canvasInstances.length - 1];
        expect(cropCanvas.width).toBe(800);
        expect(cropCanvas.height).toBe(600);
    });

    test('fills canvas with white before drawing', async () => {
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 10,
            top: 10,
            width: 50,
            height: 50,
            imgW: 200,
            imgH: 150
        });

        await cropImage(img, 1, cropResult);

        expect(mockCtx.fillStyle).toBe('#ffffff');
        expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 50, 50);
    });

    test('draws image with negative crop offset', async () => {
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 10,
            top: 20,
            width: 100,
            height: 75,
            imgW: 200,
            imgH: 150
        });

        await cropImage(img, 1, cropResult);

        expect(mockCtx.drawImage).toHaveBeenCalledWith(img, -10, -20);
    });

    test('creates canvas via toBlob with image/png format', async () => {
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 10,
            top: 10,
            width: 50,
            height: 50,
            imgW: 200,
            imgH: 150
        });

        const result = await cropImage(img, 1, cropResult);

        const cropCanvas = canvasInstances[canvasInstances.length - 1];
        expect(cropCanvas.toBlob).toHaveBeenCalledWith(
            expect.any(Function),
            'image/png'
        );
        expect(result).toBeInstanceOf(Blob);
    });

    test('does not return original file when no file parameter provided', async () => {
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 0,
            top: 0,
            width: 200,
            height: 150,
            imgW: 200,
            imgH: 150
        });

        const result = await cropImage(img, 1, cropResult);
        // No file passed, so it should crop even if covering full image
        expect(result).toBeInstanceOf(Blob);
    });
});

// ─── cropImage with transforms ───────────────────────────────────────

describe('cropImage with transforms', () => {
    beforeEach(() => {
        setupCanvasMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('creates intermediate transform canvas for rotation', async () => {
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 0,
            top: 0,
            width: 150,
            height: 200,
            imgW: 200,
            imgH: 150,
            rotate: 90
        });

        await cropImage(img, 1, cropResult);

        // Two canvases: one for transform, one for crop
        expect(canvasInstances.length).toBe(2);

        // Transform canvas dimensions for 90° rotation: W×H -> H×W
        const transformCanvas = canvasInstances[0];
        expect(transformCanvas.width).toBe(150); // height becomes width
        expect(transformCanvas.height).toBe(200); // width becomes height
    });

    test('applies rotation transform on intermediate canvas', async () => {
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 0,
            top: 0,
            width: 150,
            height: 200,
            imgW: 200,
            imgH: 150,
            rotate: 90
        });

        await cropImage(img, 1, cropResult);

        expect(mockCtx.translate).toHaveBeenCalled();
        expect(mockCtx.rotate).toHaveBeenCalledWith(Math.PI / 2);
    });

    test('applies horizontal flip via scale(-1, 1)', async () => {
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 0,
            top: 0,
            width: 200,
            height: 150,
            imgW: 200,
            imgH: 150,
            flipH: true
        });

        await cropImage(img, 1, cropResult);

        expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1);
    });

    test('applies vertical flip via scale(1, -1)', async () => {
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 0,
            top: 0,
            width: 200,
            height: 150,
            imgW: 200,
            imgH: 150,
            flipV: true
        });

        await cropImage(img, 1, cropResult);

        expect(mockCtx.scale).toHaveBeenCalledWith(1, -1);
    });

    test('applies both flips together', async () => {
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 0,
            top: 0,
            width: 200,
            height: 150,
            imgW: 200,
            imgH: 150,
            flipH: true,
            flipV: true
        });

        await cropImage(img, 1, cropResult);

        expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1);
        expect(mockCtx.scale).toHaveBeenCalledWith(1, -1);
    });

    test('does not create transform canvas when no transforms', async () => {
        const img = makeImage(200, 150);
        const cropResult = makeCropperResult({
            left: 10,
            top: 10,
            width: 50,
            height: 50,
            imgW: 200,
            imgH: 150
        });

        await cropImage(img, 1, cropResult);

        // Only one canvas: the crop canvas, no transform canvas
        expect(canvasInstances.length).toBe(1);
        expect(mockCtx.translate).not.toHaveBeenCalled();
        expect(mockCtx.rotate).not.toHaveBeenCalled();
    });
});

// ─── applyTransforms ─────────────────────────────────────────────────

describe('applyTransforms', () => {
    beforeEach(() => {
        setupCanvasMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('returns canvas with swapped dimensions for 90° rotation', () => {
        const img = makeImage(200, 150);
        const result = applyTransforms(img, 90, false, false);
        expect(result.width).toBe(150);
        expect(result.height).toBe(200);
    });

    test('returns canvas with same dimensions for 180° rotation', () => {
        const img = makeImage(200, 150);
        const result = applyTransforms(img, 180, false, false);
        expect(result.width).toBe(200);
        expect(result.height).toBe(150);
    });

    test('returns canvas with swapped dimensions for 270° rotation', () => {
        const img = makeImage(200, 150);
        const result = applyTransforms(img, 270, false, false);
        expect(result.width).toBe(150);
        expect(result.height).toBe(200);
    });

    test('returns canvas with same dimensions for 0° rotation', () => {
        const img = makeImage(200, 150);
        const result = applyTransforms(img, 0, false, false);
        expect(result.width).toBe(200);
        expect(result.height).toBe(150);
    });

    test('calls translate to center of canvas', () => {
        const img = makeImage(200, 150);
        applyTransforms(img, 90, false, false);
        // For 90°: rotW=150, rotH=200
        expect(mockCtx.translate).toHaveBeenCalledWith(75, 100);
    });

    test('calls scale for horizontal flip', () => {
        const img = makeImage(200, 150);
        applyTransforms(img, 0, true, false);
        expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1);
    });

    test('calls scale for vertical flip', () => {
        const img = makeImage(200, 150);
        applyTransforms(img, 0, false, true);
        expect(mockCtx.scale).toHaveBeenCalledWith(1, -1);
    });

    test('does not call scale when no flips', () => {
        const img = makeImage(200, 150);
        applyTransforms(img, 90, false, false);
        expect(mockCtx.scale).not.toHaveBeenCalled();
    });

    test('draws image centered at origin', () => {
        const img = makeImage(200, 150);
        applyTransforms(img, 0, false, false);
        expect(mockCtx.drawImage).toHaveBeenCalledWith(img, -100, -75);
    });

    test('handles square image correctly', () => {
        const img = makeImage(100, 100);
        const result = applyTransforms(img, 90, false, false);
        expect(result.width).toBe(100);
        expect(result.height).toBe(100);
    });
});
