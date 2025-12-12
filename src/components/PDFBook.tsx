import React, { useState, useCallback, useRef, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import './PDFBook.scss';

interface PNGBookProps {
    pngFiles: string[]; // 24枚のPNGファイルURLを配列で渡す
}

const PNGBook: React.FC<PNGBookProps> = ({ pngFiles }) => {
    const [windowDimensions, setWindowDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const bookRef = useRef<any>(null);
    const [zoom, setZoom] = useState(1);
    const [aspectRatio, setAspectRatio] = useState(709 / 500); // 高さ / 幅。初期は従来値
    const ratioFixedRef = useRef(false);
    const [loadedCount, setLoadedCount] = useState(0);
    const [isLoading, setIsLoading] = useState(pngFiles.length > 0);
    const loadStartRef = useRef<number>(Date.now());
    const loadingTimerRef = useRef<number | null>(null);

    // ウィンドウサイズ更新
    useEffect(() => {
        const handleResize = () => {
            setWindowDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = isTouchDevice && windowDimensions.width < 768;
    // const showMobileIndicator = isMobile || windowDimensions.width < 820; // 狭い画面でも表示
    const [showSwipeHint, setShowSwipeHint] = useState(false);
    const [hintShown, setHintShown] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const preloadedRef = useRef<Set<string>>(new Set());

    // ローディング中はヒント非表示、読み込み完了後に一度だけ猫の手ヒントを表示（モバイル）
    useEffect(() => {
        if (isLoading) {
            setShowSwipeHint(false);
            return;
        }
        if (!isMobile || hintShown) return;
        setShowSwipeHint(true);
        const timer = setTimeout(() => setShowSwipeHint(false), 4000);
        setHintShown(true);
        return () => clearTimeout(timer);
    }, [isMobile, hintShown, isLoading]);

    // 画像リストが変わった場合にローディング状態をリセット
    useEffect(() => {
        setLoadedCount(0);
        setIsLoading(pngFiles.length > 0);
        ratioFixedRef.current = false;
        setShowSwipeHint(false);
        setHintShown(false);
        setCurrentPage(0);
        preloadedRef.current.clear();
        loadStartRef.current = Date.now();
        if (loadingTimerRef.current) {
            window.clearTimeout(loadingTimerRef.current);
            loadingTimerRef.current = null;
        }
    }, [pngFiles]);

    // FlipBookのサイズを動的に計算（アルバムのアスペクト比を維持）
    // モバイルで左側に余白が出ないよう、横幅を端まで使う
    const baseWidth = isMobile ? windowDimensions.width : 620;
    const controlReserve = 72; // ズームUIぶんの余白
    const targetHeight = baseWidth * aspectRatio;
    const maxHeight = windowDimensions.height * 0.9 - controlReserve;
    const scale = targetHeight > 0 ? Math.min(1, maxHeight / targetHeight) : 1; // 高さ制限が入る場合は縮小して比率維持
    const bookWidth = baseWidth * scale;
    const bookHeight = targetHeight * scale;

    // 本を捲る体験を残すためアニメーション付きflipを使用
    const getPageIndex = useCallback((api: any) => {
        if (!api) return undefined;
        const p = api.getCurrentPage?.();
        if (typeof p === 'number') return p;
        const idx = api.getCurrentPageIndex?.();
        if (typeof idx === 'number') return idx;
        const obj = api.getCurrentPageObject?.();
        if (obj && typeof obj.pageIndex === 'number') return obj.pageIndex;
        return undefined;
    }, []);

    const nextFlip = useCallback(() => {
        const api = bookRef.current?.pageFlip?.();
        if (!api) return;
        const current = getPageIndex(api) ?? 0;
        const total = api.getPageCount?.() ?? pngFiles.length;

        // モバイルはアニメーションを諦めて直接ページを進める
        if (isMobile) {
            const target = Math.min(current + 1, Math.max(total - 1, 0));
            api.turnToPage?.(target);
            console.log('[next mobile turnToPage]', { current, target });
            setCurrentPage(target);
            return;
        }

        console.log('[flip next] before:', current);
        api.flipNext();
        const target = Math.min(current + 1, Math.max(total - 1, 0));
        setCurrentPage(target);
        window.setTimeout(() => {
            const after = getPageIndex(api);
            console.log('[flip next] after:', after);
        }, 180);
    }, [isMobile, pngFiles.length]);

    const prevFlip = useCallback(() => {
        const api = bookRef.current?.pageFlip?.();
        if (!api) return;
        const current = getPageIndex(api) ?? 0;

        // モバイルはアニメーションを諦めて直接ページを戻す
        if (isMobile) {
            const target = Math.max(current - 1, 0);
            api.turnToPage?.(target);
            console.log('[prev mobile turnToPage]', { current, target });
            setCurrentPage(target);
            return;
        }

        console.log('[flip prev] before:', current);
        api.flipPrev();
        const target = Math.max(current - 1, 0);
        setCurrentPage(target);
        window.setTimeout(() => {
            const after = getPageIndex(api);
            console.log('[flip prev] after:', after);
        }, 180);
    }, [isMobile, pngFiles.length]);

    const clampZoom = (value: number) => Math.min(2.5, Math.max(1, value));

    const handleWheelZoom = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
        // ピンチ（ctrlKey=true） or 修飾キー付きホイールでズーム
        const wantZoom = event.ctrlKey || event.metaKey || event.altKey;
        if (!wantZoom) return; // 通常スクロールはそのまま通す

        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.12 : 0.12;
        setZoom((z) => clampZoom(z + delta));
    }, []);

    const handleDoubleClickReset = () => setZoom(1);
    const handleZoomIn = () => setZoom((z) => clampZoom(z + 0.15));
    const handleZoomOut = () => setZoom((z) => clampZoom(z - 0.15));

    const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        if (!ratioFixedRef.current) {
            const img = event.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
                const ratio = img.naturalHeight / img.naturalWidth;
                setAspectRatio(ratio);
                ratioFixedRef.current = true;
            }
        }
        setLoadedCount((count) => count + 1);
    };

    const handleImageError = () => {
        // エラー時も進行できるようカウントを進める
        setLoadedCount((count) => count + 1);
    };

    const preloadAroundPage = useCallback((pageIndex: number) => {
        if (typeof Image === 'undefined' || pngFiles.length === 0) return;

        const buffer = 2; // 前後何枚まで先読みするか
        const start = Math.max(0, pageIndex - buffer);
        const end = Math.min(pngFiles.length - 1, pageIndex + buffer);

        for (let i = start; i <= end; i += 1) {
            const url = pngFiles[i];
            if (!url || preloadedRef.current.has(url)) continue;
            const img = new Image();
            img.src = url;
            preloadedRef.current.add(url);
        }
    }, [pngFiles]);

    useEffect(() => {
        preloadAroundPage(currentPage);
    }, [currentPage, preloadAroundPage]);

    // 全画像が遅延読み込みされるとスピナーが長時間残るため、
    // 最低1枚（または用意された枚数が少なければ全枚）読み込めば完了扱いにする。
    // ただしローディングが速い場合も1回転ぶん（約1.1s）は表示する。
    useEffect(() => {
        const requiredLoaded = Math.min(1, pngFiles.length);
        if (requiredLoaded === 0) {
            setIsLoading(false);
            return;
        }
        if (loadedCount >= requiredLoaded) {
            const MIN_SPIN_MS = 1100; // 1回転ぶん
            const elapsed = Date.now() - loadStartRef.current;
            const remain = Math.max(0, MIN_SPIN_MS - elapsed);
            if (loadingTimerRef.current) {
                window.clearTimeout(loadingTimerRef.current);
            }
            loadingTimerRef.current = window.setTimeout(() => {
                setIsLoading(false);
                loadingTimerRef.current = null;
            }, remain);
        }
    }, [loadedCount, pngFiles.length]);

    const handleFlip = useCallback((e?: any) => {
        setShowSwipeHint(false);
        const eventPage = e?.data?.page ?? e?.data?.newPage ?? e?.data?.pageIndex;
        const api = bookRef.current?.pageFlip?.();
        const fallback = getPageIndex(api);
        const resolved = typeof eventPage === 'number'
            ? eventPage
            : (typeof fallback === 'number' ? fallback : 0);
        setCurrentPage(resolved);
    }, [getPageIndex]);

    return (
        <div className="pdf-book-container">
            {isLoading && (
                <div className="loading-overlay" aria-live="polite">
                    <img
                        src="/くるくる.png"
                        alt="読み込み中"
                        className="loading-spinner-image"
                    />
                </div>
            )}
            {!isMobile && (
                <button
                    className="nav-button prev"
                    onClick={prevFlip}
                    aria-label="前のページへ"
                >
                    <img src="/左.png" alt="前のページへ" />
                </button>
            )}

            <div
                className="pdf-document"
            >
                <div className="zoom-controls">
                    {isMobile && (
                        <button
                            className="nav-button mobile prev"
                            onClick={prevFlip}
                            aria-label="前のページへ"
                        >
                            <img src="/左.png" alt="前のページへ" />
                        </button>
                    )}
                    <button className="zoom-button" onClick={handleZoomOut} aria-label="縮小">-</button>
                    <span className="zoom-display">{Math.round(zoom * 100)}%</span>
                    <button className="zoom-button" onClick={handleZoomIn} aria-label="拡大">+</button>
                    <button className="zoom-button"  aria-label="リセット">⟳</button>
                    {isMobile && (
                        <button
                            className="nav-button mobile next"
                            onClick={nextFlip}
                            aria-label="次のページへ"
                        >
                            <img src="/右.png" alt="次のページへ" />
                        </button>
                    )}
                </div>
                {/* {
                showMobileIndicator && 
                ( 
                    <div className="page-indicator-container">
                    <div className="page-indicator" aria-live="polite">
                        {displayPage} / {totalPages}
                    </div>
                    </div>
                  
                )} */}
                {(() => {
                    const isZooming = zoom > 1.01;

                    return (
                        <div
                            className="book-viewport"
                            onWheel={handleWheelZoom}
                            onDoubleClick={handleDoubleClickReset}
                            // ズーム時は縦横どちらもスクロールできるようにする
                            style={{
                                overflow: isZooming ? 'auto' : 'hidden',
                                touchAction: isZooming ? 'pan-x pan-y' : 'none',
                            }}
                        >
                            <div
                                className="book-scale"
                                style={{
                                    transform: `scale(${zoom})`,
                                    transformOrigin: '0 0', // 左上起点で拡大して左右が切れないように
                                }}
                            >
                                {pngFiles.length > 0 && (
                                    <HTMLFlipBook
                                        width={bookWidth}
                                        height={bookHeight}
                                        size="fixed"
                                        minWidth={300}
                                        maxWidth={2000}
                                        minHeight={400}
                                        maxHeight={2000}
                                        maxShadowOpacity={0}
                                        showCover={true}
                                        mobileScrollSupport={true}
                                        className="flip-book"
                                        ref={bookRef}
                                        style={{ margin: '0 auto', pointerEvents: isZooming ? 'none' : 'auto' }}
                                        startPage={0}
                                        drawShadow={false}
                                        flippingTime={1000}
                                        usePortrait={isMobile}
                                        startZIndex={0}
                                        autoSize={true}
                                        clickEventForward={true}
                                        useMouseEvents={true}
                                        swipeDistance={20}
                                        showPageCorners={false}
                                        disableFlipByClick={true}
                                        onFlip={handleFlip}
                                    >
                                        {pngFiles.map((url, index) => (
                                            <div key={index} className="page">
                                                <div className="page-content">
                                                    <img
                                                        src={url}
                                                        alt={`Album ${index + 1}`}
                                                        width={bookWidth}
                                                        loading="lazy"
                                                        height={bookHeight}
                                                        onLoad={handleImageLoad}
                                                        onError={handleImageError}
                                                        style={{
                                                            display: 'block',
                                                            margin: 0, // 余白なし
                                                            width: '100%', // 親幅いっぱい
                                                            height: 'auto',
                                                            objectFit: 'contain',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </HTMLFlipBook>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
            {!isMobile && (
                <button
                    className="nav-button next"
                    onClick={nextFlip}
                    aria-label="次のページへ"
                >
                    <img src="/右.png" alt="次のページへ" />
                </button>
            )}

            {showSwipeHint && (
                <div className="swipe-hint-overlay">
                    <img src="/swip_hint.png" alt="Swipe" className="hand-icon" />
                </div>
            )}
        </div>
    );
};

export default PNGBook;
