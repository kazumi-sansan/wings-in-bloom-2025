import React, { useState, useCallback, useRef, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PDFBook.scss';

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFBookProps {
    pdfUrl: string;
}

const PDFBook: React.FC<PDFBookProps> = ({ pdfUrl }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [windowDimensions, setWindowDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const bookRef = useRef<any>(null);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    }, []);

    React.useEffect(() => {
        const handleResize = () => {
            setWindowDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowDimensions.width < 768;
    const [showSwipeHint, setShowSwipeHint] = useState(false);

    useEffect(() => {
        let startTimer: any;
        let hideTimer: any;

        if (isMobile && numPages > 0) {
            // Delay showing the hint to ensure the album is fully rendered
            startTimer = setTimeout(() => {
                setShowSwipeHint(true);
                hideTimer = setTimeout(() => {
                    setShowSwipeHint(false);
                }, 4000);
            }, 1000);
        } else {
            setShowSwipeHint(false);
        }

        return () => {
            clearTimeout(startTimer);
            clearTimeout(hideTimer);
        };
    }, [isMobile, numPages]);

    const onPageFlip = useCallback(() => {
        setShowSwipeHint(false);
    }, []);

    // Calculate dimensions
    // Mobile: Use full width/height minus some padding if needed
    // Desktop: Fixed size
    const bookWidth = isMobile ? windowDimensions.width : 500;
    const bookHeight = isMobile ? windowDimensions.height : 709;

    // Pages array helper
    const pages = Array.from(new Array(numPages), (_, index) => index + 1);

    const nextFlip = () => {
        if (bookRef.current) {
            bookRef.current.pageFlip().flipNext();
        }
    };

    const prevFlip = () => {
        if (bookRef.current) {
            bookRef.current.pageFlip().flipPrev();
        }
    };

    return (
        <div className="pdf-book-container">
            {!isMobile && (
                <button className="nav-button prev" onClick={prevFlip}>
                    &lt;
                </button>
            )}
            <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                className="pdf-document"
                loading={<div className="loading-spinner"></div>}
            >
                {numPages > 0 && (
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
                        {pages.map((pageNumber) => (
                            <div key={pageNumber} className="page">
                                <div className="page-content">
                                    <Page
                                        pageNumber={pageNumber}
                                        width={isMobile ? bookWidth : 500}
                                        renderAnnotationLayer={false}
                                        renderTextLayer={false}
                                    />

                                </div>
                            </div>
                        ))}
                    </HTMLFlipBook>
                )}
            </Document>
            {!isMobile && (
                <button className="nav-button next" onClick={nextFlip}>
                    &gt;
                </button>
            )}
            {showSwipeHint && (
                <div className="swipe-hint-overlay">
                    <img src="/cat_hand.png" alt="Swipe" className="hand-icon" />
                </div>
            )}
        </div>
    );
};

export default PDFBook;
