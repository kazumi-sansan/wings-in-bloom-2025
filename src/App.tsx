import PDFBook from './components/PDFBook'
import './App.css'

function App() {
  // Using a sample PDF with multiple pages for demonstration
  // Using local PDF file placed in public folder
  const samplePdfUrl = '/album.pdf';

  return (
    <div className="App">
      <PDFBook pdfUrl={samplePdfUrl} />
      {/* <PDFDebug pdfUrl={samplePdfUrl} /> */}
    </div>
  )
}

export default App
