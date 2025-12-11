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
    const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);

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
    const [showSwipeHint, setShowSwipeHint] = useState(false);
    const [hintShown, setHintShown] = useState(false);

    // モバイル初期表示時のみ猫の手ヒントを表示
    useEffect(() => {
        if (!isMobile || hintShown) return;
        setShowSwipeHint(true);
        const timer = setTimeout(() => setShowSwipeHint(false), 4000);
        setHintShown(true);
        return () => clearTimeout(timer);
    }, [isMobile, hintShown]);

    const onPageFlip = useCallback(() => setShowSwipeHint(false), []);

    // FlipBookのサイズを動的に計算
    const bookWidth = isMobile ? windowDimensions.width * 0.98 : 620;
    const controlReserve = 72; // ズームUIぶんの余白
    const bookHeight = Math.min(windowDimensions.height * 0.9 - controlReserve, bookWidth * aspectRatio);
    const scaledWidth = bookWidth * zoom;
    const scaledHeight = bookHeight * zoom;

    const nextFlip = () => { if (bookRef.current) bookRef.current.pageFlip().flipNext(); };
    const prevFlip = () => { if (bookRef.current) bookRef.current.pageFlip().flipPrev(); };

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
    const handleReset = () => setZoom(1);

    const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        if (ratioFixedRef.current) return;
        const img = event.currentTarget;
        if (img.naturalWidth && img.naturalHeight) {
            const ratio = img.naturalHeight / img.naturalWidth;
            setAspectRatio(ratio);
            ratioFixedRef.current = true;
        }
    };

    // ピンチズーム（モバイル向け）
    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if (event.touches.length === 2) {
            const [t1, t2] = [event.touches[0], event.touches[1]];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            pinchStartRef.current = { dist, zoom };
        }
    };

    const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
        if (event.touches.length === 2 && pinchStartRef.current) {
            event.preventDefault();
            const [t1, t2] = [event.touches[0], event.touches[1]];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const scale = dist / pinchStartRef.current.dist;
            setZoom(clampZoom(pinchStartRef.current.zoom * scale));
        }
    };

    const handleTouchEnd = () => {
        if (pinchStartRef.current) pinchStartRef.current = null;
    };

    return (
        <div className="pdf-book-container">
            {!isMobile && <button className="nav-button prev" onClick={prevFlip}>&lt;</button>}

            <div
                className="pdf-document"
            >
                <div className="zoom-controls">
                    <button onClick={handleZoomOut} aria-label="縮小">-</button>
                    <span className="zoom-display">{Math.round(zoom * 100)}%</span>
                    <button onClick={handleZoomIn} aria-label="拡大">+</button>
                    <button onClick={handleReset} aria-label="リセット">⟳</button>
                </div>
                {/*
                    ズーム1倍時はスクロールを出さず、近付いたときのみスクロール許可。
                */}
                {(() => {
                    const isZooming = zoom > 1.01;
                    return (
                        <div
                            className="book-viewport"
                            onWheel={handleWheelZoom}
                            onDoubleClick={handleDoubleClickReset}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            style={{ overflow: isZooming ? 'auto' : 'hidden' }}
                        >
                            <div
                                className="book-scale"
                                style={{
                                    width: `${scaledWidth}px`,
                                    height: `${scaledHeight}px`,
                                }}
                            >
                                {pngFiles.length > 0 && (
                                    <HTMLFlipBook
                                        width={scaledWidth}
                                        height={scaledHeight}
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
                                        style={{ margin: '0 auto' }}
                                        startPage={0}
                                        drawShadow={false}
                                flippingTime={650}
                                        usePortrait={isMobile}
                                        startZIndex={0}
                                        autoSize={true}
                                        clickEventForward={true}
                                        useMouseEvents={true}
                                swipeDistance={15}
                                        showPageCorners={false}
                                        disableFlipByClick={true}
                                        onFlip={onPageFlip}
                                    >
                                        {pngFiles.map((url, index) => (
                                            <div key={index} className="page">
                                                <div className="page-content">
                                                    <img
                                                        src={url}
                                                        alt={`Album ${index + 1}`}
                                                        width={scaledWidth}
                                                        loading="lazy"
                                                        height={scaledHeight}
                                                        onLoad={handleImageLoad}
                                                        style={{ display: 'block', margin: '0 auto', objectFit: 'contain' }}
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
            {!isMobile && <button className="nav-button next" onClick={nextFlip}>&gt;</button>}

            {showSwipeHint && (
                <div className="swipe-hint-overlay">
                    <img src="/cat_hand.png" alt="Swipe" className="hand-icon" />
                </div>
            )}
        </div>
    );
};

export default PNGBook;
