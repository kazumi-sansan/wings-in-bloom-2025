import PDFBook from './components/PDFBook';
import './App.css';

function App() {
  const pdfFiles = Array.from({ length: 24 }, (_, i) => `/${i + 1}.jpg`);

  return (
    <div className="App">
      <PDFBook pngFiles={pdfFiles} />
    </div>
  );
}

export default App;
