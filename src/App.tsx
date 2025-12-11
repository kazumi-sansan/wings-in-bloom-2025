import PDFBook from './components/PDFBook'
import './App.css'

function App() {
  // PDF is hosted on GitHub Releases to avoid Git file size limits
  // Download URL from GitHub Releases v1.0.0
  const samplePdfUrl = '/api/album';

  return (
    <div className="App">
      <PDFBook pdfUrl={samplePdfUrl} />
      {/* <PDFDebug pdfUrl={samplePdfUrl} /> */}
    </div>
  )
}

export default App
