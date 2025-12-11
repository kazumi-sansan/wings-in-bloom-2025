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

    // FlipBookのサイズを動的に計算（アルバムのアスペクト比を維持）
    // モバイルで左側に余白が出ないよう、横幅を端まで使う
    const baseWidth = isMobile ? windowDimensions.width : 620;
    const controlReserve = 72; // ズームUIぶんの余白
    const targetHeight = baseWidth * aspectRatio;
    const maxHeight = windowDimensions.height * 0.9 - controlReserve;
    const scale = targetHeight > 0 ? Math.min(1, maxHeight / targetHeight) : 1; // 高さ制限が入る場合は縮小して比率維持
    const bookWidth = baseWidth * scale;
    const bookHeight = targetHeight * scale;

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

    return (
        <div className="pdf-book-container">
            {!isMobile && <button className="nav-button prev" onClick={prevFlip}>&lt;</button>}

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
                            &lt;
                        </button>
                    )}
                    <button onClick={handleZoomOut} aria-label="縮小">-</button>
                    <span className="zoom-display">{Math.round(zoom * 100)}%</span>
                    <button onClick={handleZoomIn} aria-label="拡大">+</button>
                    <button onClick={handleReset} aria-label="リセット">⟳</button>
                    {isMobile && (
                        <button
                            className="nav-button mobile next"
                            onClick={nextFlip}
                            aria-label="次のページへ"
                        >
                            &gt;
                        </button>
                    )}
                </div>
                {/*
                    ズーム1倍時はスクロールを出さず、近付いたときのみスクロール許可。
                */}
                {(() => {
                    const isZooming = zoom > 1.01;
                    const canSwipe = !isZooming; // ズーム中はスワイプでページ遷移させない
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
                                        swipeDistance={30}
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
                                                        width={bookWidth}
                                                        loading="lazy"
                                                        height={bookHeight}
                                                        onLoad={handleImageLoad}
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
