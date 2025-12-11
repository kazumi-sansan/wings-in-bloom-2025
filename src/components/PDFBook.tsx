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

    useEffect(() => {
        const handleFirstTouch = () => {
            if (!hintShown && window.innerWidth < 768) {
                setShowSwipeHint(true);
                setTimeout(() => setShowSwipeHint(false), 4000);
                setHintShown(true);
            }
        };

        window.addEventListener('touchstart', handleFirstTouch, { once: true });

        return () => {
            window.removeEventListener('touchstart', handleFirstTouch);
        };
    }, [hintShown]);

    const onPageFlip = useCallback(() => setShowSwipeHint(false), []);

    // FlipBookのサイズを動的に計算
    const bookWidth = isMobile ? windowDimensions.width : 500;
    const bookHeight = isMobile ? windowDimensions.height : 709;

    const nextFlip = () => { if (bookRef.current) bookRef.current.pageFlip().flipNext(); };
    const prevFlip = () => { if (bookRef.current) bookRef.current.pageFlip().flipPrev(); };

    return (
        <div className="pdf-book-container">
            {!isMobile && <button className="nav-button prev" onClick={prevFlip}>&lt;</button>}

            <div
                className="pdf-document"
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
                        style={{ margin: '0 auto' }}
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
                                        width={isMobile ? bookWidth : 500}
                                        height={bookHeight}
                                        style={{ display: 'block', margin: '0 auto', objectFit: 'contain' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </HTMLFlipBook>
                )}
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
